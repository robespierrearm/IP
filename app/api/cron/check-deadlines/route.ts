import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Этот endpoint будет вызываться Vercel Cron Job каждый день
export async function GET(request: Request) {
  try {
    // Проверяем секретный ключ для безопасности
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Находим все тендеры со статусом "подано" и дедлайном <= сегодня
    const { data: expiredTenders, error: fetchError } = await supabase
      .from('tenders')
      .select('*')
      .eq('status', 'подано')
      .lte('submission_deadline', today);

    if (fetchError) {
      console.error('Ошибка получения тендеров:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredTenders || expiredTenders.length === 0) {
      return NextResponse.json({ 
        message: 'Нет тендеров для обновления',
        count: 0 
      });
    }

    // Обновляем статус каждого тендера на "на рассмотрении"
    const updates = expiredTenders.map(async (tender) => {
      // Обновляем статус
      const { error: updateError } = await supabase
        .from('tenders')
        .update({ status: 'на рассмотрении' })
        .eq('id', tender.id);

      if (updateError) {
        console.error(`Ошибка обновления тендера ${tender.id}:`, updateError);
        return { id: tender.id, success: false, error: updateError.message };
      }

      // Создаём напоминание (если есть таблица reminders)
      // Если таблицы нет - просто пропускаем этот шаг
      try {
        await supabase
          .from('reminders')
          .insert({
            user_id: tender.user_id,
            message: `Тендер "${tender.name}" перешёл в статус "На рассмотрении"`,
            tender_id: tender.id,
            type: 'status_change',
            is_read: false
          });
      } catch (reminderError) {
        // Если таблицы reminders нет - игнорируем ошибку
        console.log('Напоминание не создано (таблица может отсутствовать)');
      }

      return { id: tender.id, success: true, name: tender.name };
    });

    const results = await Promise.all(updates);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Обновлено ${successCount} из ${expiredTenders.length} тендеров`,
      results,
      count: successCount
    });

  } catch (error: any) {
    console.error('Ошибка в cron job:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
