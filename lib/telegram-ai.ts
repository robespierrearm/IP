import { createClient } from '@supabase/supabase-js';
import { AI_SYSTEM_PROMPT } from './ai-system-prompt';
import * as AIFunctions from './ai-functions';

// Используем серверные переменные для API route
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Для серверных API routes используем обычные env переменные
function getAIKey() {
  return process.env.AI_API_KEY || process.env.NEXT_PUBLIC_AI_API_KEY || 'io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjNmMzg4Yzc0LWYzZjItNDI0ZC04MmExLTFlNzhhMzUxY2NjNiIsImV4cCI6NDkxNDQxMTI2MH0.TDGo9AQD2jWlIj56dy8Vk0_EMq7jQX6bcTWgsfyZLmr-vTyv2ygvOIb03CNJWtAE6jecQyNPB2YMvRap9fqs-A';
}

function getGoogleKey() {
  return process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyB4q--whZbW0GpezMXfJncEQibZayhRbaA';
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Доступные AI модели
export const AI_MODELS = {
  // Intelligence.io
  'llama': { provider: 'intelligence', model: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B' },
  'mistral': { provider: 'intelligence', model: 'mistralai/Mistral-Nemo-Instruct-2407', name: 'Mistral Nemo' },
  'qwen': { provider: 'intelligence', model: 'Intel/Qwen3-Coder-480B-A35B-Instruct-int4-mixed-ar', name: 'Qwen3 Coder' },
  
  // Google Gemini
  'gemini': { provider: 'google', model: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
  'gemini-pro': { provider: 'google', model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  'gemini-flash': { provider: 'google', model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
};

// Модель по умолчанию (используем Gemini - он точно работает)
let currentModel = 'gemini';

// Смена модели
export function setAIModel(modelKey: string): string {
  if (AI_MODELS[modelKey as keyof typeof AI_MODELS]) {
    currentModel = modelKey;
    return `✅ AI модель изменена на: ${AI_MODELS[modelKey as keyof typeof AI_MODELS].name}`;
  }
  return '❌ Неизвестная модель';
}

// Получить текущую модель
export function getCurrentModel(): string {
  return AI_MODELS[currentModel as keyof typeof AI_MODELS].name;
}

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

// Обработка AI команды с историей
export async function processAICommand(userMessage: string, userId: number, telegramId: string) {
  try {
    const context = await getContext();
    
    // Получаем историю последних 20 сообщений
    const { data: history, error: historyError } = await supabase
      .from('chat_history')
      .select('role, content')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: true })
      .limit(20);
    
    if (historyError) {
      console.error('❌ ERROR loading chat history:', historyError);
      console.error('Table might not exist or RLS policy is blocking access');
    } else {
      console.log('✅ Chat history loaded:', history?.length || 0, 'messages for user:', telegramId);
      if (history && history.length > 0) {
        console.log('Last message:', history[history.length - 1]);
      }
    }

    // Используем расширенный системный промпт
    const systemPrompt = AI_SYSTEM_PROMPT + `

ВАЖНО: Когда пользователь просит выполнить действие (добавить, обновить, удалить), ты должен вернуть специальный JSON с командой.

Формат ответа для выполнения действий:

1. Для добавления РАСХОДА:
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

4. Для УДАЛЕНИЯ РАСХОДА:
[ACTION:DELETE_EXPENSE]
{
  "expense_id": 123
}
[/ACTION]

5. Для ОБНОВЛЕНИЯ СТАТУСА ТЕНДЕРА:
[ACTION:UPDATE_TENDER_STATUS]
{
  "tender_id": 123,
  "status": "победа"
}
[/ACTION]

КРИТИЧЕСКИ ВАЖНО: 
- Для расходов tender_id ОБЯЗАТЕЛЕН! Если пользователь не указал к какому тендеру, СПРОСИ.
- Не придумывай ID сам!
- Перед удалением ВСЕГДА уточни у пользователя подтверждение.
- При изменении статуса проверяй что новый статус корректный.

Текущий контекст системы:
- Всего тендеров: ${context.stats.total}
- В работе: ${context.stats.inWork}
- На рассмотрении: ${context.stats.underReview}
- Общие расходы: ${context.stats.totalExpenses} ₽

Последние тендеры:
${context.tenders?.map(t => `- ID: ${t.id}, Название: "${t.name}", Статус: ${t.status}`).join('\n')}

Отвечай полезно и помогай пользователю управлять тендерами.`;

    // Получаем настройки текущей модели
    const modelConfig = AI_MODELS[currentModel as keyof typeof AI_MODELS];
    
    console.log('Using AI model:', currentModel, modelConfig);
    
    let response;
    
    if (modelConfig.provider === 'google') {
      // Google Gemini
      const googleKey = getGoogleKey();
      if (!googleKey) {
        console.error('Google API key is not set');
        return {
          text: '⚠️ Google AI временно недоступен. Переключитесь на другую модель командой /ai',
          action: null
        };
      }

      // Формируем историю для Gemini в правильном формате
      const contents = [];
      
      // Добавляем системный промпт как первое сообщение пользователя
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
      
      // Добавляем фейковый ответ ассистента
      contents.push({
        role: 'model',
        parts: [{ text: 'Понял! Я готов помогать с управлением тендерами.' }]
      });
      
      // Добавляем историю диалога
      if (history && history.length > 0) {
        history.forEach(h => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        });
      }
      
      // Добавляем текущее сообщение пользователя
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const requestBody = {
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      };
      
      console.log('📝 Gemini request with', contents.length, 'messages (including', history?.length || 0, 'from history)');
      
      console.log('Gemini request:', JSON.stringify(requestBody, null, 2));
      
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.model}:generateContent?key=${googleKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );
      
      console.log('Gemini response status:', response.status);
    } else {
      // Intelligence.io
      const aiKey = getAIKey();
      if (!aiKey) {
        console.error('AI_API_KEY is not set');
        return {
          text: '⚠️ AI помощник временно недоступен.\n\nИспользуйте команды:\n/dashboard - Статистика\n/tenders - Тендеры\n/reminders - Напоминания',
          action: null
        };
      }

      // Формируем сообщения с историей
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userMessage },
      ];

      response = await fetch('https://intelligence.io.solutions/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiKey}`,
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      return {
        text: `❌ Ошибка AI API (${response.status})\n\n${errorText.substring(0, 200)}\n\nПопробуйте /ai для смены модели`,
        action: null
      };
    }

    const data = await response.json();
    console.log('AI response data:', JSON.stringify(data, null, 2));
    
    let aiResponse: string;
    
    if (modelConfig.provider === 'google') {
      // Парсинг ответа Gemini
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response:', data);
        throw new Error('Invalid Gemini response');
      }
      aiResponse = data.candidates[0].content.parts[0].text;
    } else {
      // Парсинг ответа Intelligence.io
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid AI response:', data);
        throw new Error('Invalid AI response');
      }
      aiResponse = data.choices[0].message.content;
    }

    // Проверяем есть ли команда для выполнения
    const actionMatch = aiResponse.match(/\[ACTION:(ADD_TENDER|ADD_EXPENSE|ADD_SUPPLIER|DELETE_EXPENSE|UPDATE_TENDER_STATUS)\]([\s\S]*?)\[\/ACTION\]/);
    
    if (actionMatch) {
      const actionType = actionMatch[1].toLowerCase();
      const actionData = JSON.parse(actionMatch[2].trim());

      // Выполняем действие
      const result = await executeAction(actionType, actionData, userId);
      
      // Убираем команду из ответа
      const cleanResponse = aiResponse.replace(/\[ACTION:[\s\S]*?\[\/ACTION\]/, '').trim();
      
      // Формируем финальный ответ с РЕАЛЬНЫМ результатом
      let finalResponse = '';
      
      if (result.success) {
        // Успех - показываем что AI сказал + подтверждение
        finalResponse = cleanResponse ? cleanResponse + '\n\n' + result.message : result.message;
      } else {
        // Ошибка - показываем ТОЛЬКО ошибку, убираем оптимистичный ответ AI
        finalResponse = result.message;
      }
      
      // Сохраняем в историю РЕАЛЬНЫЙ результат
      const { error: saveError } = await supabase.from('chat_history').insert([
        { telegram_id: telegramId, role: 'user', content: userMessage },
        { telegram_id: telegramId, role: 'assistant', content: finalResponse },
      ]);
      
      if (saveError) {
        console.error('❌ ERROR saving to chat_history:', saveError);
      } else {
        console.log('✅ Saved 2 messages to chat_history for user:', telegramId);
      }
      
      return {
        text: finalResponse,
        action: result.success ? actionType : null,
      };
    }

    // Сохраняем сообщения в историю
    const { error: saveError2 } = await supabase.from('chat_history').insert([
      { telegram_id: telegramId, role: 'user', content: userMessage },
      { telegram_id: telegramId, role: 'assistant', content: aiResponse },
    ]);
    
    if (saveError2) {
      console.error('❌ ERROR saving to chat_history (normal flow):', saveError2);
    } else {
      console.log('✅ Saved 2 messages to chat_history (normal flow) for user:', telegramId);
    }

    return { text: aiResponse, action: null };
  } catch (error: any) {
    console.error('AI processing error:', error);
    console.error('Error details:', error.message, error.stack);
    
    // Возвращаем более информативное сообщение
    let errorMsg = '❌ Произошла ошибка при обработке запроса.\n\n';
    
    if (error.message) {
      errorMsg += `Детали: ${error.message}\n\n`;
    }
    
    errorMsg += 'Попробуйте:\n';
    errorMsg += '/dashboard - Статистика\n';
    errorMsg += '/tenders - Тендеры\n';
    errorMsg += '/ai - Сменить AI модель';
    
    return { 
      text: errorMsg,
      action: null 
    };
  }
}

// Выполнение действия
async function executeAction(actionType: string, data: any, userId: number) {
  try {
    if (actionType === 'add_tender') {
      // Проверяем обязательные поля
      if (!data.name || !data.name.trim()) {
        return { success: false, message: '❌ Не указано название тендера' };
      }

      const { error } = await supabase.from('tenders').insert([{
        name: data.name.trim(),
        start_price: data.start_price || null,
        publication_date: data.publication_date || null,
        status: data.status || 'новый',
      }]);

      if (error) {
        return { success: false, message: `❌ Ошибка при добавлении тендера: ${error.message}` };
      }
      
      return { success: true, message: `✅ Тендер "${data.name}" успешно добавлен со статусом "${data.status || 'новый'}"!` };
    }

    if (actionType === 'add_expense') {
      if (!data.tender_id) {
        return { success: false, message: '❌ Не указан ID тендера для расхода' };
      }

      // Проверяем существует ли тендер
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select('id, name, status')
        .eq('id', data.tender_id)
        .single();

      if (tenderError || !tender) {
        return { success: false, message: `❌ Тендер с ID ${data.tender_id} не найден` };
      }

      // Проверяем можно ли добавлять расходы к этому тендеру
      const allowedStatuses = ['победа', 'в работе', 'завершён'];
      if (!allowedStatuses.includes(tender.status)) {
        return { 
          success: false, 
          message: `❌ Нельзя добавить расход к тендеру "${tender.name}"\n\nПричина: Статус тендера "${tender.status}". Расходы можно добавлять только к выигранным тендерам (статусы: победа, в работе, завершён).` 
        };
      }

      const { error } = await supabase.from('expenses').insert([{
        tender_id: data.tender_id,
        category: data.category,
        amount: data.amount,
        description: data.description || null,
      }]);

      if (error) {
        return { success: false, message: `❌ Ошибка при добавлении расхода: ${error.message}` };
      }
      
      return { success: true, message: `✅ Расход на сумму ${data.amount} ₽ успешно добавлен к тендеру "${tender.name}"!` };
    }

    if (actionType === 'add_supplier') {
      // Проверяем обязательные поля
      if (!data.name || !data.name.trim()) {
        return { success: false, message: '❌ Не указано название поставщика' };
      }

      // Проверяем есть ли хоть один контакт
      if (!data.phone && !data.email) {
        return { success: false, message: '❌ Укажите хотя бы один контакт поставщика (телефон или email)' };
      }

      const { error } = await supabase.from('suppliers').insert([{
        name: data.name.trim(),
        phone: data.phone || null,
        email: data.email || null,
        category: data.category || 'Прочее',
      }]);

      if (error) {
        return { success: false, message: `❌ Ошибка при добавлении поставщика: ${error.message}` };
      }
      
      let contactInfo = '';
      if (data.phone) contactInfo += `Телефон: ${data.phone}`;
      if (data.email) contactInfo += (contactInfo ? ', ' : '') + `Email: ${data.email}`;
      
      return { success: true, message: `✅ Поставщик "${data.name}" успешно добавлен!\n${contactInfo}` };
    }

    if (actionType === 'delete_expense') {
      if (!data.expense_id) {
        return { success: false, message: '❌ Не указан ID расхода для удаления' };
      }

      // Проверяем существует ли расход
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('id, amount, category, tender_id, tenders(name)')
        .eq('id', data.expense_id)
        .single();

      if (expenseError || !expense) {
        return { success: false, message: `❌ Расход с ID ${data.expense_id} не найден` };
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', data.expense_id);

      if (error) {
        return { success: false, message: `❌ Ошибка при удалении расхода: ${error.message}` };
      }

      return { 
        success: true, 
        message: `✅ Расход удалён!\n\nСумма: ${expense.amount} ₽\nКатегория: ${expense.category}\nТендер: ${(expense.tenders as any)?.name || 'Неизвестно'}` 
      };
    }

    if (actionType === 'update_tender_status') {
      if (!data.tender_id) {
        return { success: false, message: '❌ Не указан ID тендера' };
      }

      if (!data.status) {
        return { success: false, message: '❌ Не указан новый статус' };
      }

      // Проверяем валидность статуса
      const validStatuses = ['новый', 'подано', 'на рассмотрении', 'победа', 'проигрыш', 'в работе', 'завершён'];
      if (!validStatuses.includes(data.status)) {
        return { 
          success: false, 
          message: `❌ Неверный статус "${data.status}"\n\nДоступные статусы: ${validStatuses.join(', ')}` 
        };
      }

      // Проверяем существует ли тендер
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select('id, name, status')
        .eq('id', data.tender_id)
        .single();

      if (tenderError || !tender) {
        return { success: false, message: `❌ Тендер с ID ${data.tender_id} не найден` };
      }

      const oldStatus = tender.status;

      const { error } = await supabase
        .from('tenders')
        .update({ status: data.status })
        .eq('id', data.tender_id);

      if (error) {
        return { success: false, message: `❌ Ошибка при обновлении статуса: ${error.message}` };
      }

      return { 
        success: true, 
        message: `✅ Статус тендера "${tender.name}" изменён!\n\n${oldStatus} → ${data.status}` 
      };
    }

    return { success: false, message: '❌ Неизвестное действие' };
  } catch (error: any) {
    console.error('Action execution error:', error);
    return { success: false, message: `❌ Ошибка при выполнении действия: ${error.message || 'Неизвестная ошибка'}` };
  }
}
https://github.com/robespierrearm/new