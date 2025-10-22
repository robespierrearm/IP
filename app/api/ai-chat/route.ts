import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function POST(request: NextRequest) {
  try {
    const { messages, provider = 'intelligence', model, userId } = await request.json();

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
              content: `Ты полезный ИИ-помощник в CRM-системе для управления тендерами строительной компании. Отвечай кратко, по делу и на русском языке.

ВАЖНО: Ты можешь выполнять действия в системе! Когда пользователь просит добавить тендер, расход или поставщика, ты должен вернуть специальный JSON с командой.

Формат ответа для выполнения действий:

1. Для добавления РАСХОДА (всегда требуется tender_id):
[ACTION:ADD_EXPENSE]
{
  "tender_id": 123,
  "category": "Доставка",
  "amount": 8000,
  "description": "Доставка материалов"
}
[/ACTION]

Затем добавь текст: "Я подготовил расход для добавления. Нажмите кнопку 'Подтвердить и выполнить' чтобы добавить его в базу."

2. Для добавления ТЕНДЕРА:
[ACTION:ADD_TENDER]
{
  "name": "Название тендера",
  "start_price": 1000000,
  "publication_date": "2025-10-20",
  "status": "новый"
}
[/ACTION]

Затем добавь текст: "Я подготовил тендер для добавления. Нажмите кнопку 'Подтвердить и выполнить' чтобы добавить его в базу."

3. Для добавления ПОСТАВЩИКА:
[ACTION:ADD_SUPPLIER]
{
  "name": "Название поставщика",
  "phone": "+7...",
  "email": "email@example.com",
  "category": "Категория"
}
[/ACTION]

Затем добавь текст: "Я подготовил поставщика для добавления. Нажмите кнопку 'Подтвердить и выполнить' чтобы добавить его в базу."

КРИТИЧЕСКИ ВАЖНО для расходов: 
- tender_id ОБЯЗАТЕЛЕН! Если пользователь не указал к какому тендеру относится расход, СПРОСИ у него номер или название тендера.
- Не придумывай tender_id сам!
- Если в контексте есть список тендеров, используй их ID.

Примеры правильных ответов:

Пользователь: "Добавь расход на доставку 8000 рублей для тендера номер 5"
Ты: 
[ACTION:ADD_EXPENSE]
{"tender_id": 5, "category": "Доставка", "amount": 8000, "description": "Доставка материалов"}
[/ACTION]
Я подготовил расход для добавления. Нажмите кнопку 'Подтвердить и выполнить' чтобы добавить его в базу.

Пользователь: "Добавь расход на материалы 50000"
Ты: К какому тендеру относится этот расход? Укажите номер или название тендера.`
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
      const aiMessage = data.choices[0]?.message?.content || 'Нет ответа';
      
      // Сохраняем историю в базу (последнее сообщение пользователя + ответ AI)
      if (userId) {
        try {
          const userMessage = messages[messages.length - 1];
          await supabase.from('chat_history').insert([
            { user_id: userId, role: 'user', content: userMessage.content },
            { user_id: userId, role: 'assistant', content: aiMessage },
          ]);
          console.log('✅ Web AI: History saved for user', userId);
        } catch (e) {
          console.error('❌ Web AI: Failed to save history:', e);
        }
      }
      
      return NextResponse.json({
        message: aiMessage,
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
      const aiMessage = data.candidates[0]?.content?.parts[0]?.text || 'Нет ответа';
      
      // Сохраняем историю в базу (последнее сообщение пользователя + ответ AI)
      if (userId) {
        try {
          const userMessage = messages[messages.length - 1];
          await supabase.from('chat_history').insert([
            { user_id: userId, role: 'user', content: userMessage.content },
            { user_id: userId, role: 'assistant', content: aiMessage },
          ]);
          console.log('✅ Web AI: History saved for user', userId);
        } catch (e) {
          console.error('❌ Web AI: Failed to save history:', e);
        }
      }
      
      return NextResponse.json({
        message: aiMessage,
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
