// Клиентские функции для AI - работают на GitHub Pages
import { supabase } from './supabase';

// Получение контекста из базы данных для AI
export async function getAIContext() {
  try {
    // Загружаем тендеры
    const { data: tenders } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    // Загружаем поставщиков
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*');

    // Загружаем расходы
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*');

    // Формируем статистику
    const stats = {
      tenders: {
        total: tenders?.length || 0,
        byStatus: {
          новый: tenders?.filter(t => t.status === 'новый').length || 0,
          подано: tenders?.filter(t => t.status === 'подано').length || 0,
          'на рассмотрении': tenders?.filter(t => t.status === 'на рассмотрении').length || 0,
          победа: tenders?.filter(t => t.status === 'победа').length || 0,
          'в работе': tenders?.filter(t => t.status === 'в работе').length || 0,
          завершён: tenders?.filter(t => t.status === 'завершён').length || 0,
          проигрыш: tenders?.filter(t => t.status === 'проигрыш').length || 0,
        },
        totalStartPrice: tenders?.reduce((sum, t) => sum + (t.start_price || 0), 0) || 0,
        totalWinPrice: tenders?.reduce((sum, t) => sum + (t.win_price || 0), 0) || 0,
        recentTenders: tenders?.slice(0, 5).map(t => ({
          name: t.name,
          status: t.status,
          start_price: t.start_price,
          win_price: t.win_price,
          publication_date: t.publication_date,
        })) || [],
      },
      suppliers: {
        total: suppliers?.length || 0,
        byCategory: suppliers?.reduce((acc: any, s) => {
          const cat = s.category || 'Без категории';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {}) || {},
      },
      expenses: {
        total: expenses?.length || 0,
        totalAmount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
        byCategory: expenses?.reduce((acc: any, e) => {
          const cat = e.category || 'Прочее';
          acc[cat] = (acc[cat] || 0) + (e.amount || 0);
          return acc;
        }, {}) || {},
      },
      financial: {
        totalIncome: tenders?.filter(t => t.status === 'завершён').reduce((sum, t) => sum + (t.win_price || 0), 0) || 0,
        totalExpenses: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
      },
    };

    // Вычисляем прибыль и налог
    const grossProfit = stats.financial.totalIncome - stats.financial.totalExpenses;
    const tax = grossProfit > 0 ? grossProfit * 0.07 : 0;
    const netProfit = grossProfit - tax;

    stats.financial = {
      ...stats.financial,
      grossProfit,
      tax,
      netProfit,
    } as any;

    return stats;
  } catch (error) {
    console.error('Ошибка получения контекста:', error);
    return null;
  }
}

// Выполнение действий AI (добавление тендеров, расходов, поставщиков)
export async function executeAIAction(action: string, data: any) {
  try {
    const normalizedAction = action.toLowerCase().replace('add_', '');

    switch (normalizedAction) {
      case 'tender':
        const { error: tenderError } = await supabase.from('tenders').insert([{
          name: data.name,
          purchase_number: data.purchase_number || null,
          link: data.link || null,
          region: data.region || null,
          publication_date: data.publication_date || new Date().toISOString().split('T')[0],
          submission_date: data.submission_date || null,
          submission_deadline: data.submission_deadline || null,
          start_price: data.start_price || null,
          submitted_price: data.submitted_price || null,
          win_price: data.win_price || null,
          status: data.status || 'новый',
        }]);

        if (tenderError) throw new Error(`Ошибка добавления тендера: ${tenderError.message}`);
        return { success: true, message: `Тендер "${data.name}" успешно добавлен` };

      case 'expense':
        const { error: expenseError } = await supabase.from('expenses').insert([{
          tender_id: data.tender_id,
          category: data.category || 'Прочее',
          amount: data.amount,
          description: data.description || null,
        }]);

        if (expenseError) throw new Error(`Ошибка добавления расхода: ${expenseError.message}`);
        return { success: true, message: `Расход на сумму ${data.amount} ₽ успешно добавлен` };

      case 'supplier':
        const { error: supplierError } = await supabase.from('suppliers').insert([{
          name: data.name,
          contact_person: data.contact_person || null,
          phone: data.phone || null,
          email: data.email || null,
          category: data.category || null,
          notes: data.notes || null,
        }]);

        if (supplierError) throw new Error(`Ошибка добавления поставщика: ${supplierError.message}`);
        return { success: true, message: `Поставщик "${data.name}" успешно добавлен` };

      default:
        throw new Error(`Неизвестное действие: ${action}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Ошибка выполнения действия');
  }
}
