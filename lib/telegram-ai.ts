import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const AI_API_KEY = process.env.AI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Получение контекста для AI
async function getContext() {
  // Получаем последние тендеры
  const { data: tenders } = await supabase
    .from('tenders')
    .select('id, name, status, start_price, submitted_price, win_price')
    .order('created_at', { ascending: false })
    .limit(10);

  // Получаем статистику
  const { data: allTenders } = await supabase.from('tenders').select('*');
  const { data: expenses } = await supabase.from('expenses').select('*');

  const stats = {
    total: allTenders?.length || 0,
    inWork: allTenders?.filter(t => t.status === 'в работе').length || 0,
    underReview: allTenders?.filter(t => t.status === 'на рассмотрении').length || 0,
    totalExpenses: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
  };

  return { tenders, stats };
}

// Обработка AI команды
export async function processAICommand(userMessage: string, userId: number) {
  try {
    const context = await getContext();

    // Системный промпт для AI
    const systemPrompt = `Ты полезный ИИ-помощник в CRM-системе для управления тендерами строительной компании. Отвечай кратко, по делу и на русском языке.

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

2. Для добавления ТЕНДЕРА:
[ACTION:ADD_TENDER]
{
  "name": "Название тендера",
  "start_price": 1000000,
  "publication_date": "2025-10-20",
  "status": "новый"
}
[/ACTION]

3. Для добавления ПОСТАВЩИКА:
[ACTION:ADD_SUPPLIER]
{
  "name": "Название поставщика",
  "phone": "+7...",
  "email": "email@example.com",
  "category": "Категория"
}
[/ACTION]

КРИТИЧЕСКИ ВАЖНО для расходов: 
- tender_id ОБЯЗАТЕЛЕН! Если пользователь не указал к какому тендеру относится расход, СПРОСИ у него номер или название тендера.
- Не придумывай tender_id сам!

Текущий контекст системы:
- Всего тендеров: ${context.stats.total}
- В работе: ${context.stats.inWork}
- На рассмотрении: ${context.stats.underReview}
- Общие расходы: ${context.stats.totalExpenses} ₽

Последние тендеры:
${context.tenders?.map(t => `- ID: ${t.id}, Название: "${t.name}", Статус: ${t.status}`).join('\n')}

Отвечай полезно и помогай пользователю управлять тендерами.`;

    // Вызов AI API
    const response = await fetch('https://intelligence.io.solutions/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('AI API error');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Проверяем есть ли команда для выполнения
    const actionMatch = aiResponse.match(/\[ACTION:(ADD_TENDER|ADD_EXPENSE|ADD_SUPPLIER)\]([\s\S]*?)\[\/ACTION\]/);
    
    if (actionMatch) {
      const actionType = actionMatch[1].toLowerCase();
      const actionData = JSON.parse(actionMatch[2].trim());

      // Выполняем действие
      const result = await executeAction(actionType, actionData, userId);
      
      // Убираем команду из ответа и добавляем результат
      const cleanResponse = aiResponse.replace(/\[ACTION:[\s\S]*?\[\/ACTION\]/, '').trim();
      
      return {
        text: cleanResponse + '\n\n' + result.message,
        action: result.success ? actionType : null,
      };
    }

    return { text: aiResponse, action: null };
  } catch (error) {
    console.error('AI processing error:', error);
    return { 
      text: '❌ Произошла ошибка при обработке запроса. Попробуйте позже или используйте команды:\n/dashboard - Статистика\n/tenders - Тендеры\n/reminders - Напоминания',
      action: null 
    };
  }
}

// Выполнение действия
async function executeAction(actionType: string, data: any, userId: number) {
  try {
    if (actionType === 'add_tender') {
      const { error } = await supabase.from('tenders').insert([{
        name: data.name,
        start_price: data.start_price,
        publication_date: data.publication_date,
        status: data.status || 'новый',
      }]);

      if (error) throw error;
      return { success: true, message: `✅ Тендер "${data.name}" успешно добавлен!` };
    }

    if (actionType === 'add_expense') {
      if (!data.tender_id) {
        return { success: false, message: '❌ Не указан ID тендера для расхода' };
      }

      const { error } = await supabase.from('expenses').insert([{
        tender_id: data.tender_id,
        category: data.category,
        amount: data.amount,
        description: data.description || null,
      }]);

      if (error) throw error;
      return { success: true, message: `✅ Расход на сумму ${data.amount} ₽ успешно добавлен!` };
    }

    if (actionType === 'add_supplier') {
      const { error } = await supabase.from('suppliers').insert([{
        name: data.name,
        phone: data.phone,
        email: data.email,
        category: data.category,
      }]);

      if (error) throw error;
      return { success: true, message: `✅ Поставщик "${data.name}" успешно добавлен!` };
    }

    return { success: false, message: '❌ Неизвестное действие' };
  } catch (error) {
    console.error('Action execution error:', error);
    return { success: false, message: '❌ Ошибка при выполнении действия' };
  }
}
