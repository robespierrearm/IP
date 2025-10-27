import { NextRequest, NextResponse } from 'next/server';

// API endpoint для парсинга тендеров через ИИ

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, html } = body;

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

    // Получаем API ключ из переменных окружения
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!openaiKey && !anthropicKey) {
      return NextResponse.json(
        { error: 'API ключ не настроен. Добавьте OPENAI_API_KEY или ANTHROPIC_API_KEY в .env' },
        { status: 500 }
      );
    }

    // Очищаем HTML от скриптов и стилей для экономии токенов
    const cleanedHtml = pageContent
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .substring(0, 50000); // Ограничиваем размер

    // Промпт для ИИ
    const prompt = `Ты - эксперт по извлечению данных из веб-страниц тендеров.

Проанализируй следующую HTML страницу тендера и извлеки информацию в JSON формате.

ВАЖНО: Возвращай ТОЛЬКО JSON, без дополнительного текста.

Нужно найти и извлечь следующие поля:
1. name - название тендера/закупки (обязательно)
2. purchase_number - номер закупки/извещения (если есть)
3. region - регион/адрес поставки (если есть)
4. publication_date - дата публикации в формате YYYY-MM-DD (если есть)
5. submission_deadline - срок подачи заявок в формате YYYY-MM-DD (если есть)
6. start_price - начальная/максимальная цена (только число без валюты, если есть)
7. link - ссылка на тендер (используй URL из запроса: ${url || 'не указана'})

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

    // Пробуем сначала OpenAI (если есть ключ)
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Быстрая и дешёвая модель
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
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'OpenAI API error');
        }

        const result = await response.json();
        const content = result.choices[0].message.content;
        
        // Извлекаем JSON из ответа (на случай если ИИ добавил markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('ИИ не вернул валидный JSON');
        }
        
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (error: any) {
        console.error('OpenAI parsing error:', error);
        
        // Если OpenAI не сработал, пробуем Anthropic
        if (anthropicKey) {
          parsedData = await parseWithAnthropic(anthropicKey, prompt);
        } else {
          throw error;
        }
      }
    } else if (anthropicKey) {
      parsedData = await parseWithAnthropic(anthropicKey, prompt);
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

// Функция парсинга через Anthropic Claude
async function parseWithAnthropic(apiKey: string, prompt: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Быстрая и дешёвая модель
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const result = await response.json();
  const content = result.content[0].text;
  
  // Извлекаем JSON из ответа
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('ИИ не вернул валидный JSON');
  }
  
  return JSON.parse(jsonMatch[0]);
}
