import { NextRequest, NextResponse } from 'next/server';

// API для bookmarklet - парсинг через ИИ

export async function POST(request: NextRequest) {
  try {
    const { html, url } = await request.json();

    if (!html) {
      return NextResponse.json(
        { error: 'HTML обязателен' },
        { status: 400 }
      );
    }

    // Очищаем HTML
    const cleanedHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20000);

    // Промпт для ИИ
    const prompt = `Извлеки данные тендера из HTML. Возвращай ТОЛЬКО JSON без текста.

Нужные поля:
1. name - название/предмет закупки
2. purchase_number - номер извещения (20+ цифр)
3. region - регион/адрес
4. publication_date - дата публикации (YYYY-MM-DD)
5. submission_deadline - дедлайн подачи (YYYY-MM-DD)
6. start_price - начальная цена (только число)

Формат ответа:
{
  "name": "...",
  "purchase_number": "..." или null,
  "region": "..." или null,
  "publication_date": "YYYY-MM-DD" или null,
  "submission_deadline": "YYYY-MM-DD" или null,
  "start_price": число или null,
  "link": "${url || ''}"
}

HTML:
${cleanedHtml}`;

    // Используем Intelligence.io
    const response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjNmMzg4Yzc0LWYzZjItNDI0ZC04MmExLTFlNzhhMzUxY2NjNiIsImV4cCI6NDkxNDQxMTI2MH0.TDGo9AQD2jWlIj56dy8Vk0_EMq7jQX6bcTWgsfyZLmr-vTyv2ygvOIb03CNJWtAE6jecQyNPB2YMvRap9fqs-A',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по извлечению данных. Возвращай ТОЛЬКО валидный JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('ИИ не ответил');
    }

    const result = await response.json();
    let content = result.choices[0]?.message?.content || '';

    // Извлекаем JSON
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('ИИ не вернул JSON');
    }

    const jsonString = content.substring(firstBrace, lastBrace + 1);
    const parsedData = JSON.parse(jsonString);

    // Валидация
    if (!parsedData.name) {
      throw new Error('Не найдено название тендера');
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
    console.error('Bookmarklet parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка парсинга' },
      { status: 500 }
    );
  }
}
