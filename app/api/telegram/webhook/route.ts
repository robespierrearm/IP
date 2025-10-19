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
    `/help - Эта справка\n\n` +
    `<b>AI Помощник:</b>\n` +
    `Просто напишите мне:\n` +
    `• "Добавь расход 5000р на материалы"\n` +
    `• "Покажи финансы за месяц"\n` +
    `• "Сколько тендеров в работе?"\n\n` +
    `Я понимаю естественный язык! 🧠`
  );
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

  // Здесь будет интеграция с AI (следующий шаг)
  await sendMessage(chatId, 
    '🤖 AI помощник скоро будет доступен!\n\n' +
    'Пока используйте команды:\n' +
    '/dashboard - Статистика\n' +
    '/tenders - Тендеры\n' +
    '/reminders - Напоминания'
  );
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
