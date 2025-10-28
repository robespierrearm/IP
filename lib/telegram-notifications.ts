import { createClient } from '@supabase/supabase-js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8461717103:AAEZl4hs5oXaOtnCsKNexcVGCPdjeG4RvkA';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Отправка сообщения в Telegram
async function sendTelegramMessage(chatId: string, text: string, options: any = {}) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    console.log('📞 Отправляю запрос в Telegram API:');
    console.log('  URL:', url.replace(TELEGRAM_BOT_TOKEN, 'BOT_TOKEN'));
    console.log('  chat_id:', chatId);
    console.log('  text:', text.substring(0, 50) + '...');
    
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

    const result = await response.json();
    
    console.log('📥 Ответ от Telegram API:');
    console.log('  Status:', response.status);
    console.log('  Result:', result);
    
    if (!result.ok) {
      console.error('❌ Telegram API вернул ошибку:', result);
    } else {
      console.log('✅ Сообщение успешно отправлено в Telegram!');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Ошибка при отправке в Telegram:', error);
    throw error;
  }
}

// Форматирование цены для отображения
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' ₽';
}

// Форматирование даты
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Подсчёт дней до дедлайна
function getDaysUntilDeadline(deadlineString: string): number {
  const deadline = new Date(deadlineString);
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Форматирование "осталось дней"
function formatDaysLeft(days: number): string {
  if (days > 1) return `через ${days} дней`;
  if (days === 1) return 'завтра';
  if (days === 0) return '<b>сегодня!</b>';
  if (days === -1) return '<b>вчера (просрочено!)</b>';
  return `<b>просрочено на ${Math.abs(days)} дней!</b>`;
}

// Подсчёт процента экономии
function calculateSavings(startPrice: number, submittedPrice: number): { amount: number; percent: number } {
  const amount = startPrice - submittedPrice;
  const percent = (amount / startPrice) * 100;
  return { amount, percent };
}

// Получение суммы расходов из БД
async function getTenderExpenses(tenderId: number): Promise<number> {
  try {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('tender_id', tenderId);
    
    if (!expenses || expenses.length === 0) return 0;
    
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  } catch (error) {
    console.error('Ошибка получения расходов:', error);
    return 0;
  }
}

// Уведомление о новом тендере
export async function notifyNewTender(tender: any) {
  try {
    // Получаем настройки
    const { data: settings } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!settings || !settings.notify_new_tender || settings.recipients.length === 0) {
      return;
    }

    // Формируем сообщение
    let message = `<b>🆕 Новый тендер</b>\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>📌 ${tender.name}</b>\n\n`;
    
    if (tender.start_price) {
      message += `💰 Начальная цена: <code>${formatPrice(tender.start_price)}</code>\n`;
    }
    
    if (tender.region) {
      message += `📍 Регион: ${tender.region}\n`;
    }
    
    if (tender.submission_deadline) {
      const daysLeft = getDaysUntilDeadline(tender.submission_deadline);
      message += `⏰ Дедлайн: ${formatDate(tender.submission_deadline)}\n`;
      message += `⏳ Осталось: ${formatDaysLeft(daysLeft)}\n`;
    }

    // Отправляем всем получателям
    const sendPromises = settings.recipients.map((telegramId: string) =>
      sendTelegramMessage(telegramId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌐 Открыть в CRM', url: `https://ip-mauve-pi.vercel.app/tenders` }
          ]]
        }
      })
    );

    await Promise.all(sendPromises);
    console.log('✅ Уведомления о новом тендере отправлены');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
  }
}

// Уведомление о победе
export async function notifyTenderWon(tender: any) {
  try {
    console.log('🎉 notifyTenderWon вызвана для:', tender?.name);
    
    const { data: settings } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('id', 1)
      .single();

    console.log('⚙️ Настройки для победы:', settings);

    if (!settings) {
      console.log('❌ Настроек нет!');
      return;
    }

    if (!settings.notify_won) {
      console.log('❌ Галочка "Победа" выключена!');
      return;
    }

    if (settings.recipients.length === 0) {
      console.log('❌ Нет получателей!');
      return;
    }

    console.log('👥 Отправляю победу для:', settings.recipients);

    let message = `<b>🎉🎉🎉 ПОБЕДА! 🎉🎉🎉</b>\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>✅ ${tender.name}</b>\n\n`;
    
    const winPrice = tender.win_price || tender.submitted_price;
    
    if (winPrice) {
      message += `💰 Сумма контракта: <code>${formatPrice(winPrice)}</code>\n`;
    }
    
    // Показываем экономию если есть начальная цена
    if (tender.start_price && winPrice && winPrice < tender.start_price) {
      const savings = calculateSavings(tender.start_price, winPrice);
      message += `<b>📊 Экономия: ${formatPrice(savings.amount)}</b> (-${savings.percent.toFixed(1)}%)\n`;
    }
    
    message += `\n🔥 ПОЗДРАВЛЯЕМ! 🔥`;

    console.log('📨 Текст сообщения:', message);

    const sendPromises = settings.recipients.map((telegramId: string) => {
      console.log('📤 Отправляю в telegram_id:', telegramId);
      return sendTelegramMessage(telegramId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌐 Открыть в CRM', url: `https://ip-mauve-pi.vercel.app/tenders` }
          ]]
        }
      });
    });

    await Promise.all(sendPromises);
    console.log('✅ Уведомления о победе отправлены');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
  }
}

// Уведомление о проигрыше
export async function notifyTenderLost(tender: any) {
  try {
    const { data: settings } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!settings || !settings.notify_lost || settings.recipients.length === 0) {
      return;
    }

    let message = `<b>😔 Не выиграли тендер</b>\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `<b>📌 ${tender.name}</b>\n\n`;
    
    if (tender.submitted_price) {
      message += `💸 Наша цена: <code>${formatPrice(tender.submitted_price)}</code>\n\n`;
    }
    
    message += `Не расстраивайтесь!\nВпереди новые возможности 💪`;

    const sendPromises = settings.recipients.map((telegramId: string) =>
      sendTelegramMessage(telegramId, message)
    );

    await Promise.all(sendPromises);
    console.log('✅ Уведомления о проигрыше отправлены');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
  }
}

// Уведомление об изменении статуса
export async function notifyStatusChange(tender: any, oldStatus: string, newStatus: string) {
  try {
    console.log('📨 notifyStatusChange вызвана');
    console.log('  Тендер:', tender?.name);
    console.log('  Старый статус:', oldStatus);
    console.log('  Новый статус:', newStatus);
    
    const { data: settings } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('id', 1)
      .single();

    console.log('⚙️ Настройки загружены:', settings);

    if (!settings) {
      console.log('❌ Настроек нет!');
      return;
    }

    if (settings.recipients.length === 0) {
      console.log('❌ Нет получателей!');
      return;
    }

    console.log('👥 Получатели:', settings.recipients);

    // ПРИОРИТЕТ 1: Специфичные уведомления (Победа/Проигрыш)
    // Если есть специальная галочка для этого статуса - используем её
    if (newStatus === 'победа' && settings.notify_won) {
      console.log('🎉 Отправляю уведомление о ПОБЕДЕ');
      return notifyTenderWon(tender);
    }
    
    if (newStatus === 'проигрыш' && settings.notify_lost) {
      console.log('😔 Отправляю уведомление о ПРОИГРЫШЕ');
      return notifyTenderLost(tender);
    }

    console.log('🔄 Проверяю галочку "Другие изменения":', settings.notify_status_change);

    // ПРИОРИТЕТ 2: Общее уведомление об изменении
    // Если нет специальной галочки, проверяем общую
    if (!settings.notify_status_change) {
      console.log('❌ Галочка "Другие изменения" выключена, не отправляю');
      return; // Общие уведомления выключены
    }

    // Отправляем умное уведомление в зависимости от статуса
    console.log('📤 Отправляю уведомление для статуса:', newStatus);
    
    let message = '';
    
    // Умные уведомления для каждого статуса
    if (newStatus === 'подано') {
      message = `<b>📤 Заявка подана!</b>\n\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>📌 ${tender.name}</b>\n\n`;
      
      if (tender.start_price && tender.submitted_price) {
        const savings = calculateSavings(tender.start_price, tender.submitted_price);
        message += `💵 Начальная: <code>${formatPrice(tender.start_price)}</code>\n`;
        message += `💸 Наша цена: <code>${formatPrice(tender.submitted_price)}</code>\n`;
        message += `<b>📊 Экономия: ${formatPrice(savings.amount)}</b> (-${savings.percent.toFixed(1)}%)\n\n`;
      } else if (tender.submitted_price) {
        message += `💸 Наша цена: <code>${formatPrice(tender.submitted_price)}</code>\n\n`;
      }
      
      if (tender.submission_deadline) {
        const daysLeft = getDaysUntilDeadline(tender.submission_deadline);
        message += `⏰ Дедлайн: ${formatDate(tender.submission_deadline)} (${formatDaysLeft(daysLeft)})\n\n`;
      }
      
      message += `Ждём результатов! 🤞`;
      
    } else if (newStatus === 'на рассмотрении') {
      message = `<b>🔍 Тендер на рассмотрении</b>\n\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>📌 ${tender.name}</b>\n\n`;
      
      if (tender.submission_date) {
        message += `📅 Подано: ${formatDate(tender.submission_date)}\n`;
      }
      
      if (tender.submission_deadline) {
        const daysLeft = getDaysUntilDeadline(tender.submission_deadline);
        message += `⏰ Дедлайн: ${formatDate(tender.submission_deadline)} (${formatDaysLeft(daysLeft)})\n`;
      }
      
      if (tender.submitted_price) {
        message += `💸 Наша цена: <code>${formatPrice(tender.submitted_price)}</code>\n`;
      }
      
      message += `\nОжидаем решения заказчика...`;
      
    } else if (newStatus === 'в работе') {
      message = `<b>⚙️ Работы начались</b>\n\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>📌 ${tender.name}</b>\n\n`;
      
      const contractPrice = tender.win_price || tender.submitted_price;
      if (contractPrice) {
        message += `💰 Сумма контракта: <code>${formatPrice(contractPrice)}</code>\n`;
      }
      
      if (tender.submission_date) {
        message += `📅 Начало: ${formatDate(tender.submission_date)}\n`;
      }
      
      message += `\nУдачи команде! 🚀`;
      
    } else if (newStatus === 'завершён') {
      message = `<b>✅ Проект завершён!</b>\n\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>📌 ${tender.name}</b>\n\n`;
      
      const contractPrice = tender.win_price || tender.submitted_price;
      if (contractPrice) {
        message += `💰 Контракт: <code>${formatPrice(contractPrice)}</code>\n`;
        
        // Получаем расходы из БД
        if (tender.id) {
          const expenses = await getTenderExpenses(tender.id);
          if (expenses > 0) {
            const profit = contractPrice - expenses;
            const profitPercent = (profit / contractPrice) * 100;
            message += `💸 Расходы: <code>${formatPrice(expenses)}</code>\n`;
            message += `<b>💵 Прибыль: ${formatPrice(profit)}</b> (${profitPercent.toFixed(1)}%)\n`;
          }
        }
      }
      
      message += `\n🎊 ОТЛИЧНАЯ РАБОТА! 🎊`;
      
    } else {
      // Для остальных статусов - обычное уведомление
      message = `<b>🔄 Изменение статуса</b>\n\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
      message += `<b>📌 ${tender.name}</b>\n\n`;
      message += `Было: ${oldStatus}\n`;
      message += `Стало: <b>${newStatus}</b>`;
    }

    const sendPromises = settings.recipients.map((telegramId: string) =>
      sendTelegramMessage(telegramId, message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌐 Открыть в CRM', url: `https://ip-mauve-pi.vercel.app/tenders` }
          ]]
        }
      })
    );

    await Promise.all(sendPromises);
    console.log('✅ Уведомления об изменении статуса отправлены');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
  }
}
