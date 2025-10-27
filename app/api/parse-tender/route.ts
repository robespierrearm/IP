import { NextRequest, NextResponse } from 'next/server';

// API endpoint для парсинга тендеров через ИИ
// Использует существующие провайдеры: Google AI и Intelligence.io

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html, provider = 'intelligence' } = body; // По умолчанию Intelligence.io (быстрее)

    if (!url && !html) {
      return NextResponse.json(
        { error: 'Необходимо указать URL или HTML' },
        { status: 400 }
      );
    }

    // Получаем HTML страницы
    let pageContent = html;
    
    if (url && !html) {
      try {
        // Пытаемся получить страницу по URL
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить страницу');
        }
        
        pageContent = await response.text();
      } catch (error) {
        return NextResponse.json(
          { 
            error: 'Не удалось загрузить страницу. Попробуйте вставить HTML код вручную.',
            hint: 'Откройте страницу тендера → Ctrl+U → Скопируйте код → Вставьте в поле HTML'
          },
          { status: 400 }
        );
      }
    }

    // Очищаем HTML от скриптов и стилей для экономии токенов
    const cleanedHtml = pageContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .substring(0, 30000); // Ограничиваем размер для Llama

    // Промпт для ИИ
    const prompt = `Ты - эксперт по извлечению данных из веб-страниц тендеров.

Проанализируй следующую HTML страницу тендера и извлеки информацию в JSON формате.

ВАЖНО: Возвращай ТОЛЬКО JSON, без дополнительного текста и markdown.

Нужно найти и извлечь следующие поля:
1. name - название тендера/закупки (обязательно)
2. purchase_number - номер закупки/извещения (если есть)
3. region - регион/адрес поставки (если есть)
4. publication_date - дата публикации в формате YYYY-MM-DD (если есть)
5. submission_deadline - срок подачи заявок в формате YYYY-MM-DD (если есть)
6. start_price - начальная/максимальная цена (только число без валюты, если есть)
7. link - ссылка на тендер (используй URL: ${url || 'не указана'})

Если поле не найдено, используй null.

Формат ответа:
{
  "name": "string",
  "purchase_number": "string или null",
  "region": "string или null",
  "publication_date": "YYYY-MM-DD или null",
  "submission_deadline": "YYYY-MM-DD или null",
  "start_price": число или null,
  "link": "string или null"
}

HTML страницы:
${cleanedHtml}`;

    let parsedData;

    // Используем Intelligence.io или Google AI
    try {
      if (provider === 'intelligence') {
        parsedData = await parseWithIntelligenceIO(prompt);
      } else if (provider === 'google') {
        parsedData = await parseWithGoogleAI(prompt);
      } else {
        throw new Error('Неизвестный провайдер. Используйте intelligence или google');
      }
    } catch (error: any) {
      console.error('AI parsing error:', error);
      
      // Если Intelligence не сработал, пробуем Google
      if (provider === 'intelligence') {
        try {
          parsedData = await parseWithGoogleAI(prompt);
        } catch (fallbackError: any) {
          throw new Error(`Ошибка парсинга: ${error.message}`);
        }
      } else {
        throw error;
      }
    }

    // Валидация результата
    if (!parsedData || !parsedData.name) {
      return NextResponse.json(
        { error: 'ИИ не смог извлечь данные. Попробуйте другую страницу или вставьте HTML код.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: parsedData.name || '',
        purchase_number: parsedData.purchase_number || '',
        link: parsedData.link || url || '',
        region: parsedData.region || '',
        publication_date: parsedData.publication_date || '',
        submission_deadline: parsedData.submission_deadline || '',
        start_price: parsedData.start_price || null,
      }
    });

  } catch (error: any) {
    console.error('Parse tender error:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Функция парсинга через Intelligence.io (Llama 3.3 70B)
async function parseWithIntelligenceIO(prompt: string) {
  const apiKey = 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjNmMzg4Yzc0LWYzZjItNDI0ZC04MmExLTFlNzhhMzUxY2NjNiIsImV4cCI6NDkxNDQxMTI2MH0.TDGo9AQD2jWlIj56dy8Vk0_EMq7jQX6bcTWgsfyZLmr-vTyv2ygvOIb03CNJWtAE6jecQyNPB2YMvRap9fqs-A';
  
  const response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: 'Ты - эксперт по извлечению данных. Отвечай ТОЛЬКО валидным JSON, без markdown форматирования.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Intelligence.io error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content || '';
  
  // Извлекаем JSON из ответа
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ИИ не вернул валидный JSON');
  }
  
  return JSON.parse(jsonMatch[0]);
}

// Функция парсинга через Google AI (Gemini)
async function parseWithGoogleAI(prompt: string) {
  const apiKey = 'AIzaSyB4q--whZbW0GpezMXfJncEQibZayhRbaA';
  const model = 'gemini-2.0-flash-exp';
  
  // Используем CORS прокси для обхода региональных ограничений
  const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: 'Ты - эксперт по извлечению данных. Отвечай ТОЛЬКО валидным JSON, без markdown форматирования.\n\n' + prompt }],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI error: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.candidates[0]?.content?.parts[0]?.text || '';
  
  // Извлекаем JSON из ответа
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ИИ не вернул валидный JSON');
  }
  
  return JSON.parse(jsonMatch[0]);
}
