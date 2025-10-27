import { NextRequest, NextResponse } from 'next/server';

// API endpoint для парсинга тендеров через ИИ
// Использует существующие провайдеры: Google AI и Intelligence.io

// Вспомогательная функция для валидации даты
function validateDate(dateString: any): string | null {
  if (!dateString || dateString === 'null') return null;
  
  const str = String(dateString).trim();
  
  // Проверяем формат YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(str)) {
    const date = new Date(str);
    // Проверяем что дата валидная
    if (!isNaN(date.getTime())) {
      return str;
    }
  }
  
  return null;
}

// Вспомогательная функция для парсинга цены
function parsePrice(priceValue: any): number | null {
  if (!priceValue || priceValue === 'null') return null;
  
  // Если уже число
  if (typeof priceValue === 'number') {
    return priceValue > 0 ? priceValue : null;
  }
  
  // Если строка - пытаемся извлечь число
  if (typeof priceValue === 'string') {
    // Убираем все кроме цифр и точки
    const cleaned = priceValue.replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);
    return !isNaN(num) && num > 0 ? num : null;
  }
  
  return null;
}

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

    // Очищаем HTML - оставляем только текстовое содержимое
    const cleanedHtml = pageContent
      // Удаляем скрипты
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Удаляем стили
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Удаляем комментарии
      .replace(/<!--[\s\S]*?-->/g, '')
      // Удаляем SVG
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      // Удаляем inline стили
      .replace(/\s+style="[^"]*"/gi, '')
      // Удаляем классы (оставляем только контент)
      .replace(/\s+class="[^"]*"/gi, '')
      // Удаляем лишние пробелы
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 25000); // Ограничиваем размер

    // Промпт для ИИ
    const prompt = `Ты - эксперт по парсингу тендеров. Твоя задача - извлечь ТОЛЬКО информацию о тендере.

КРИТИЧЕСКИ ВАЖНО:
- Возвращай ТОЛЬКО JSON объект
- БЕЗ markdown (без \`\`\`json)
- БЕЗ дополнительного текста
- Если не уверен в поле - ставь null

ИЗВЛЕКИ СЛЕДУЮЩИЕ ДАННЫЕ:

1. **name** (ОБЯЗАТЕЛЬНО) - Название тендера/закупки
   Ищи: "Предмет закупки", "Наименование", "Тендер:", "Закупка:"
   Пример: "Строительство школы в Москве"

2. **purchase_number** - Номер закупки/извещения
   Ищи: "Номер извещения", "№", "Реестровый номер"
   Пример: "0373100005423000123"

3. **region** - Регион/адрес поставки
   Ищи: "Регион", "Адрес поставки", "Место поставки"
   Пример: "Москва" или "г. Москва, ул. Ленина"

4. **publication_date** - Дата публикации (формат: YYYY-MM-DD)
   Ищи: "Дата размещения", "Опубликовано", "Дата публикации"
   Пример: "2025-10-20"

5. **submission_deadline** - Дедлайн подачи заявок (формат: YYYY-MM-DD)
   Ищи: "Окончание приёма заявок", "Дата окончания", "Дедлайн"
   Пример: "2025-11-15"

6. **start_price** - Начальная цена (ТОЛЬКО ЧИСЛО, без валюты и пробелов)
   Ищи: "Начальная цена", "НМЦК", "Цена контракта"
   Пример: 15000000 (не "15 000 000 руб")

7. **link** - Ссылка (используй: ${url || 'null'})

СТРОГИЙ ФОРМАТ ОТВЕТА (БЕЗ ЛИШНЕГО ТЕКСТА):
{
  "name": "...",
  "purchase_number": "..." или null,
  "region": "..." или null,
  "publication_date": "YYYY-MM-DD" или null,
  "submission_deadline": "YYYY-MM-DD" или null,
  "start_price": число или null,
  "link": "..." или null
}

HTML СТРАНИЦЫ:
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
        { error: 'ИИ не смог найти название тендера. Убедитесь что HTML содержит информацию о тендере.' },
        { status: 400 }
      );
    }

    // Очистка и валидация данных
    const cleanedData = {
      name: String(parsedData.name || '').trim(),
      purchase_number: parsedData.purchase_number ? String(parsedData.purchase_number).trim() : '',
      link: parsedData.link || url || '',
      region: parsedData.region ? String(parsedData.region).trim() : '',
      publication_date: validateDate(parsedData.publication_date) || '',
      submission_deadline: validateDate(parsedData.submission_deadline) || '',
      start_price: parsePrice(parsedData.start_price),
    };

    // Проверка что хотя бы название есть
    if (!cleanedData.name || cleanedData.name === 'null' || cleanedData.name.length < 5) {
      return NextResponse.json(
        { error: 'Название тендера слишком короткое или некорректное. Проверьте HTML страницы.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cleanedData
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
  let content = result.choices[0]?.message?.content || '';
  
  // Очищаем ответ от markdown
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Извлекаем JSON из ответа (берем первый и последний {})
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('ИИ не вернул JSON объект');
  }
  
  const jsonString = content.substring(firstBrace, lastBrace + 1);
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', jsonString);
    throw new Error('ИИ вернул невалидный JSON');
  }
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
  let content = result.candidates[0]?.content?.parts[0]?.text || '';
  
  // Очищаем ответ от markdown
  content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // Извлекаем JSON из ответа (берем первый и последний {})
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('ИИ не вернул JSON объект');
  }
  
  const jsonString = content.substring(firstBrace, lastBrace + 1);
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', jsonString);
    throw new Error('ИИ вернул невалидный JSON');
  }
}
