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

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price);
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
      return; // Уведомления выключены или нет получателей
    }

    // Формируем сообщение
    let message = `📋 <b>Новый тендер добавлен!</b>\n\n`;
    message += `✅ <b>${tender.name}</b>\n\n`;
    
    if (tender.purchase_number) {
      message += `📝 Номер: ${tender.purchase_number}\n`;
    }
    
    if (tender.region) {
      message += `📍 Регион: ${tender.region}\n`;
    }
    
    if (tender.start_price) {
      message += `💰 Цена: ${formatPrice(tender.start_price)}\n`;
    }
    
    if (tender.submission_deadline) {
      message += `⏰ Дедлайн: ${formatDate(tender.submission_deadline)}\n`;
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

    let message = `🎉 <b>ПОБЕДА В ТЕНДЕРЕ!</b>\n\n`;
    message += `✅ <b>${tender.name}</b>\n\n`;
    
    if (tender.win_price) {
      message += `💰 Сумма: ${formatPrice(tender.win_price)}\n`;
    }

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

    let message = `😔 <b>Проигрыш в тендере</b>\n\n`;
    message += `${tender.name}\n\n`;
    message += `Не расстраивайтесь, впереди новые возможности!`;

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

    // Отправляем обычное уведомление об изменении статуса
    console.log('📤 Отправляю общее уведомление об изменении');
    let message = `🔄 <b>Изменение статуса тендера</b>\n\n`;
    message += `${tender.name}\n\n`;
    message += `Было: ${oldStatus}\n`;
    message += `Стало: <b>${newStatus}</b>`;

    const sendPromises = settings.recipients.map((telegramId: string) =>
      sendTelegramMessage(telegramId, message)
    );

    await Promise.all(sendPromises);
    console.log('✅ Уведомления об изменении статуса отправлены');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомлений:', error);
  }
}
