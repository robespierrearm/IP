import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSmartNotification } from '@/lib/tender-notifications';

// GET /api/dashboard - получить все данные для dashboard
export async function GET() {
  try {
    // Загружаем ВСЕ тендеры и файлы
    const [tendersResult, filesResult] = await Promise.all([
      supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('files')
        .select('*')
        .eq('show_on_dashboard', true)
        .order('uploaded_at', { ascending: false })
        .limit(5)
    ]);

    const { data: allTenders, error: tendersError } = tendersResult;
    const { data: files, error: filesError } = filesResult;

    if (tendersError) {
      console.error('Ошибка загрузки тендеров:', tendersError);
    }

    if (filesError) {
      console.error('Ошибка загрузки файлов:', filesError);
    }

    const tenders = allTenders || [];

    // МЕТРИКИ
    
    // 1. Срочные (urgent + high priority)
    const urgentCount = tenders.filter(t => {
      const notification = getSmartNotification(t);
      return notification && (notification.priority === 'urgent' || notification.priority === 'high');
    }).length;

    // 2. В работе
    const inWorkCount = tenders.filter(t => t.status === 'в работе').length;

    // 3. Выручка за месяц (sum win_price где created_at > начало месяца)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthRevenue = tenders
      .filter(t => {
        if (!t.created_at || !t.win_price) return false;
        const createdDate = new Date(t.created_at);
        return createdDate >= startOfMonth && t.status === 'победа';
      })
      .reduce((sum, t) => sum + (t.win_price || 0), 0);

    // Подсчёт для остальных полей
    const underReviewCount = tenders.filter(t => t.status === 'на рассмотрении').length;
    const newCount = tenders.filter(t => t.status === 'новый').length;
    const submittedCount = tenders.filter(t => t.status === 'подано').length;
    const wonCount = tenders.filter(t => t.status === 'победа').length;
    const lostCount = tenders.filter(t => t.status === 'проигрыш').length;
    
    // Общая выручка (все победы)
    const totalRevenue = tenders
      .filter(t => t.win_price && t.status === 'победа')
      .reduce((sum, t) => sum + (t.win_price || 0), 0);

    // Напоминания: тендеры с дедлайном в ближайшие 3 дня
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const reminders = tenders.filter(t => {
      if (!t.submission_deadline) return false;
      const deadline = new Date(t.submission_deadline);
      const now = new Date();
      return deadline >= now && deadline <= threeDaysFromNow;
    }).map(t => ({
      id: t.id,
      name: t.name,
      deadline: t.submission_deadline
    }));

    return NextResponse.json({
      data: {
        tenders: tenders.slice(0, 10), // Последние 10 для списка
        files: files || [],
        stats: {
          urgent: urgentCount,
          inWork: inWorkCount,
          monthRevenue: monthRevenue,
          underReview: underReviewCount,
          reminders: reminders.length,
          total: tenders.length,
          new: newCount,
          submitted: submittedCount,
          won: wonCount,
          lost: lostCount,
          totalRevenue: totalRevenue,
        },
        reminderTenders: reminders,
      },
      error: null
    });
  } catch (error) {
    console.error('Критическая ошибка dashboard:', error);
    return NextResponse.json(
      { 
        data: null,
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    );
  }
}
