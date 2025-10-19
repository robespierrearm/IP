import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8461717103:AAEZl4hs5oXaOtnCsKNexcVGCPdjeG4RvkA';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });

  return response.json();
}

// Проверка авторизации пользователя
async function checkAuth(telegramId: string) {
  const { data } = await supabase
    .from('telegram_connections')
    .select('*, users(*)')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .single();

  return data;
}

// Обработка команды /start
async function handleStart(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();
  const text = message.text;
  
  // Проверяем есть ли код авторизации
  const parts = text.split(' ');
  
  if (parts.length < 2) {
    await sendMessage(chatId, 
      '👋 Привет! Я бот TenderCRM.\n\n' +
      'Для подключения:\n' +
      '1. Откройте веб-версию CRM\n' +
      '2. Перейдите в Админка → Telegram\n' +
      '3. Сгенерируйте код подключения\n' +
      '4. Отправьте мне команду: /start ВАШ_КОД'
    );
    return;
  }

  const authCode = parts[1];

  // Ищем код в базе
  const { data: connection, error } = await supabase
    .from('telegram_connections')
    .select('*, users(*)')
    .eq('auth_code', authCode)
    .eq('is_active', false)
    .single();

  if (error || !connection) {
    await sendMessage(chatId, 
      '❌ Неверный код подключения.\n\n' +
      'Проверьте код в веб-версии и попробуйте снова.'
    );
    return;
  }

  // Обновляем подключение
  const { error: updateError } = await supabase
    .from('telegram_connections')
    .update({
      telegram_id: telegramId,
      telegram_username: message.from.username || null,
      telegram_first_name: message.from.first_name || null,
      telegram_last_name: message.from.last_name || null,
      is_active: true,
      connected_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
    })
    .eq('id', connection.id);

  if (updateError) {
    await sendMessage(chatId, '❌ Ошибка подключения. Попробуйте позже.');
    return;
  }

  // Успешное подключение
  await sendMessage(chatId, 
    `✅ <b>Подключение успешно!</b>\n\n` +
    `Привет, ${message.from.first_name}! 👋\n\n` +
    `Теперь вы можете:\n` +
    `• Получать уведомления о дедлайнах\n` +
    `• Управлять тендерами через AI\n` +
    `• Просматривать статистику\n\n` +
    `<b>Доступные команды:</b>\n` +
    `/dashboard - Статистика\n` +
    `/tenders - Список тендеров\n` +
    `/reminders - Напоминания\n` +
    `/help - Справка\n\n` +
    `Или просто напишите мне что-нибудь, и AI помощник вам поможет! 🤖`
  );
}

// Обработка команды /dashboard
async function handleDashboard(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  // Получаем статистику
  const { data: tenders } = await supabase
    .from('tenders')
    .select('*');

  const inWork = tenders?.filter(t => t.status === 'в работе').length || 0;
  const underReview = tenders?.filter(t => t.status === 'на рассмотрении').length || 0;
  const total = tenders?.length || 0;

  // Финансы
  const totalIncome = tenders?.reduce((sum, t) => {
    if (t.status === 'завершён') return sum + (t.win_price || 0);
    return sum;
  }, 0) || 0;

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount');

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const profit = totalIncome - totalExpenses;

  await sendMessage(chatId,
    `📊 <b>Статистика TenderCRM</b>\n\n` +
    `<b>Тендеры:</b>\n` +
    `• Всего: ${total}\n` +
    `• В работе: ${inWork}\n` +
    `• На рассмотрении: ${underReview}\n\n` +
    `<b>Финансы:</b>\n` +
    `• Доход: ${formatPrice(totalIncome)}\n` +
    `• Расходы: ${formatPrice(totalExpenses)}\n` +
    `• Прибыль: ${formatPrice(profit)}`
  );
}

// Обработка команды /tenders
async function handleTenders(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  const { data: tenders } = await supabase
    .from('tenders')
    .select('*')
    .in('status', ['новый', 'подано', 'на рассмотрении', 'в работе'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (!tenders || tenders.length === 0) {
    await sendMessage(chatId, '📋 Нет активных тендеров');
    return;
  }

  let text = '📋 <b>Активные тендеры:</b>\n\n';
  
  tenders.forEach((tender, index) => {
    const statusEmoji = getStatusEmoji(tender.status);
    text += `${index + 1}. ${statusEmoji} <b>${tender.name}</b>\n`;
    text += `   Статус: ${tender.status}\n`;
    if (tender.start_price) {
      text += `   Цена: ${formatPrice(tender.start_price)}\n`;
    }
    text += '\n';
  });

  await sendMessage(chatId, text);
}

// Обработка команды /reminders
async function handleReminders(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  const { data: tenders } = await supabase
    .from('tenders')
    .select('*')
    .not('submission_deadline', 'is', null);

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const reminders = tenders?.filter(t => {
    if (!t.submission_deadline) return false;
    const deadline = new Date(t.submission_deadline);
    const now = new Date();
    return deadline >= now && deadline <= threeDaysFromNow;
  }) || [];

  if (reminders.length === 0) {
    await sendMessage(chatId, '✅ Нет напоминаний. Все дедлайны под контролем!');
    return;
  }

  let text = '⚠️ <b>Напоминания о дедлайнах:</b>\n\n';
  
  reminders.forEach((tender, index) => {
    const deadline = new Date(tender.submission_deadline!);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const urgentEmoji = daysLeft <= 1 ? '🔥' : '⏰';
    text += `${index + 1}. ${urgentEmoji} <b>${tender.name}</b>\n`;
    text += `   Дедлайн: ${formatDate(tender.submission_deadline!)}\n`;
    text += `   Осталось: ${daysLeft === 0 ? 'СЕГОДНЯ!' : daysLeft === 1 ? 'Завтра' : `${daysLeft} дн.`}\n\n`;
  });

  await sendMessage(chatId, text);
}

// Обработка команды /ai (выбор модели)
async function handleAI(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  const { AI_MODELS, getCurrentModel } = await import('@/lib/telegram-ai');
  const currentModel = getCurrentModel();

  let text = `🤖 <b>Выбор AI модели</b>\n\n`;
  text += `Текущая модель: <b>${currentModel}</b>\n\n`;
  text += `<b>Доступные модели:</b>\n\n`;
  text += `<b>Intelligence.io:</b>\n`;
  text += `/ai_llama - Llama 3.3 70B (умная)\n`;
  text += `/ai_mistral - Mistral Nemo (быстрая)\n`;
  text += `/ai_qwen - Qwen3 Coder (для кода)\n\n`;
  text += `<b>Google Gemini:</b>\n`;
  text += `/ai_gemini - Gemini 2.0 Flash (новая)\n`;
  text += `/ai_gemini_pro - Gemini 1.5 Pro (мощная)\n`;
  text += `/ai_gemini_flash - Gemini 1.5 Flash (быстрая)\n\n`;
  text += `💡 Для распознавания чеков автоматически используется Gemini`;

  await sendMessage(chatId, text);
}

// Обработка смены модели
async function handleModelChange(message: any, modelKey: string) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  const { setAIModel } = await import('@/lib/telegram-ai');
  const result = setAIModel(modelKey);
  
  await sendMessage(chatId, result);
}

// Обработка команды /help
async function handleHelp(message: any) {
  const chatId = message.chat.id;

  await sendMessage(chatId,
    `🤖 <b>Справка по боту TenderCRM</b>\n\n` +
    `<b>Команды:</b>\n` +
    `/start - Подключение к системе\n` +
    `/dashboard - Статистика\n` +
    `/tenders - Список активных тендеров\n` +
    `/reminders - Напоминания о дедлайнах\n` +
    `/ai - Выбор AI модели\n` +
    `/help - Эта справка\n\n` +
    `<b>AI Помощник:</b>\n` +
    `Просто напишите мне:\n` +
    `• "Добавь расход 5000р на материалы"\n` +
    `• "Покажи финансы за месяц"\n` +
    `• "Сколько тендеров в работе?"\n\n` +
    `<b>Распознавание чеков:</b>\n` +
    `Отправьте фото чека, и я автоматически:\n` +
    `• Распознаю сумму\n` +
    `• Определю категорию\n` +
    `• Предложу добавить расход\n\n` +
    `Я понимаю естественный язык! 🧠`
  );
}

// Обработка фото (распознавание чеков)
async function handlePhoto(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  await sendMessage(chatId, '🔍 Анализирую чек через Gemini Vision...');

  try {
    // Получаем самое большое фото
    const photos = message.photo;
    const largestPhoto = photos[photos.length - 1];

    // Получаем URL фото
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`
    );
    const fileData = await fileResponse.json();
    const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;

    // Распознаём чек
    const { recognizeReceipt } = await import('@/lib/telegram-ocr');
    const receiptData = await recognizeReceipt(photoUrl);

    if (!receiptData) {
      await sendMessage(chatId, '❌ Не удалось распознать чек. Попробуйте сфотографировать чётче.');
      return;
    }

    // Формируем сообщение с результатом
    let text = `✅ <b>Чек распознан!</b>\n\n`;
    text += `💰 Сумма: <b>${formatPrice(receiptData.amount)}</b>\n`;
    if (receiptData.date) text += `📅 Дата: ${receiptData.date}\n`;
    if (receiptData.store) text += `🏪 Магазин: ${receiptData.store}\n`;
    if (receiptData.category) text += `📦 Категория: ${receiptData.category}\n`;
    if (receiptData.description) text += `📝 Описание: ${receiptData.description}\n`;
    text += `\n<b>К какому тендеру добавить расход?</b>`;

    await sendMessage(chatId, text);

    // Получаем активные тендеры для выбора
    const { data: tenders } = await supabase
      .from('tenders')
      .select('id, name')
      .in('status', ['новый', 'подано', 'на рассмотрении', 'победа', 'в работе'])
      .order('created_at', { ascending: false})
      .limit(5);

    if (tenders && tenders.length > 0) {
      let tendersText = '\n<b>Выберите тендер:</b>\n\n';
      tenders.forEach((tender, index) => {
        tendersText += `${index + 1}. ${tender.name} (ID: ${tender.id})\n`;
      });
      tendersText += `\nОтветьте номером тендера или ID`;

      await sendMessage(chatId, tendersText);

      // Сохраняем данные чека для последующего добавления
      // TODO: Реализовать state management для хранения данных между сообщениями
    } else {
      await sendMessage(chatId, '⚠️ Нет активных тендеров. Создайте тендер сначала.');
    }

  } catch (error) {
    console.error('Photo processing error:', error);
    await sendMessage(chatId, '❌ Ошибка при обработке фото. Попробуйте ещё раз.');
  }
}

// Обработка текстовых сообщений (AI)
async function handleTextMessage(message: any) {
  const chatId = message.chat.id;
  const telegramId = message.from.id.toString();
  const text = message.text;

  const auth = await checkAuth(telegramId);
  if (!auth) {
    await sendMessage(chatId, '❌ Вы не авторизованы. Используйте /start КОД');
    return;
  }

  // Отправляем "печатает..."
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  });

  try {
    // Импортируем AI функцию динамически
    const { processAICommand } = await import('@/lib/telegram-ai');
    
    console.log('Processing AI command:', text);
    
    const result = await processAICommand(text, auth.user_id);
    
    console.log('AI result:', result);
    
    // Отправляем ответ
    await sendMessage(chatId, result.text);
    
    // Если было выполнено действие, добавляем эмодзи
    if (result.action) {
      await sendMessage(chatId, '✨ Действие выполнено успешно!');
    }
  } catch (error: any) {
    console.error('AI error:', error);
    console.error('Error stack:', error.stack);
    
    await sendMessage(chatId, 
      '❌ Произошла ошибка при обработке запроса.\n\n' +
      `Ошибка: ${error.message || 'Неизвестная ошибка'}\n\n` +
      'Попробуйте использовать команды:\n' +
      '/dashboard - Статистика\n' +
      '/tenders - Тендеры\n' +
      '/reminders - Напоминания'
    );
  }
}

// Вспомогательные функции
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'новый': '🆕',
    'подано': '📤',
    'на рассмотрении': '👀',
    'победа': '🎉',
    'в работе': '🔧',
    'завершён': '✅',
    'проигрыш': '❌',
  };
  return emojis[status] || '📋';
}

// Главный обработчик
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Telegram отправляет обновления в поле "message"
    const message = body.message;
    
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    // Обновляем last_activity
    if (message.from) {
      await supabase
        .from('telegram_connections')
        .update({ last_activity: new Date().toISOString() })
        .eq('telegram_id', message.from.id.toString());
    }

    // Обработка фото
    if (message.photo) {
      await handlePhoto(message);
      return NextResponse.json({ ok: true });
    }

    // Обработка команд
    if (message.text) {
      const text = message.text.trim();
      
      if (text.startsWith('/start')) {
        await handleStart(message);
      } else if (text === '/dashboard') {
        await handleDashboard(message);
      } else if (text === '/tenders') {
        await handleTenders(message);
      } else if (text === '/reminders') {
        await handleReminders(message);
      } else if (text === '/ai') {
        await handleAI(message);
      } else if (text.startsWith('/ai_')) {
        const modelKey = text.substring(4); // Убираем '/ai_'
        await handleModelChange(message, modelKey);
      } else if (text === '/help') {
        await handleHelp(message);
      } else {
        await handleTextMessage(message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Всегда возвращаем ok для Telegram
  }
}

// GET для проверки
export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram webhook is running',
    timestamp: new Date().toISOString()
  });
}
