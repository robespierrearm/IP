import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/dashboard - получить все данные для dashboard
export async function GET() {
  try {
    // Параллельно загружаем тендеры и файлы
    const [tendersResult, filesResult] = await Promise.all([
      supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('files')
        .select('*')
        .eq('show_on_dashboard', true)
        .order('uploaded_at', { ascending: false })
        .limit(5)
    ]);

    const { data: tenders, error: tendersError } = tendersResult;
    const { data: files, error: filesError } = filesResult;

    if (tendersError) {
      console.error('Ошибка загрузки тендеров:', tendersError);
    }

    if (filesError) {
      console.error('Ошибка загрузки файлов:', filesError);
    }

    // Подсчёт статистики
    const inWorkCount = (tenders || []).filter(t => t.status === 'в работе').length;
    const underReviewCount = (tenders || []).filter(t => t.status === 'на рассмотрении').length;

    // Напоминания: тендеры с дедлайном в ближайшие 3 дня
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const reminders = (tenders || []).filter(t => {
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
        tenders: tenders || [],
        files: files || [],
        stats: {
          inWork: inWorkCount,
          underReview: underReviewCount,
          reminders: reminders.length,
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
