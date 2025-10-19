import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, provider = 'intelligence', model } = await request.json();

    // Ключи теперь на сервере - безопасно!
    const intelligenceKey = process.env.INTELLIGENCE_API_KEY;
    const googleKey = process.env.GOOGLE_AI_KEY;

    if (provider === 'intelligence') {
      if (!intelligenceKey) {
        return NextResponse.json(
          { error: 'Intelligence.io API ключ не настроен на сервере' },
          { status: 500 }
        );
      }

      const response = await fetch('https://api.intelligence.io.solutions/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${intelligenceKey}`,
        },
        body: JSON.stringify({
          model: model || 'meta-llama/Llama-3.3-70B-Instruct',
          messages: [
            {
              role: 'system',
              content: 'Ты полезный ИИ-помощник в CRM-системе для управления тендерами. Отвечай кратко, по делу и на русском языке.'
            },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intelligence.io error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return NextResponse.json({
        message: data.choices[0]?.message?.content || 'Нет ответа',
        provider: 'intelligence'
      });

    } else if (provider === 'google') {
      if (!googleKey) {
        return NextResponse.json(
          { error: 'Google AI ключ не настроен на сервере' },
          { status: 500 }
        );
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-exp'}:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.map((msg: any) => ({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }],
            })),
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google AI error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return NextResponse.json({
        message: data.candidates[0]?.content?.parts[0]?.text || 'Нет ответа',
        provider: 'google'
      });
    }

    return NextResponse.json(
      { error: 'Неизвестный провайдер' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
