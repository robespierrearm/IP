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
        recentTenders: tenders?.slice(0, 10).map(t => ({
          id: t.id,
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

// Поиск тендера по имени или ID
export async function findTender(query: string | number) {
  try {
    if (typeof query === 'number') {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', query)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Ошибка поиска тендера:', error);
    return null;
  }
}

// Выполнение действий AI (добавление, редактирование, удаление)
export async function executeAIAction(action: string, data: any) {
  try {
    const normalizedAction = action.toLowerCase();

    // Добавление тендера
    if (normalizedAction === 'add_tender') {
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

    // Добавление расхода
    } else if (normalizedAction === 'add_expense') {
        const { error: expenseError } = await supabase.from('expenses').insert([{
          tender_id: data.tender_id,
          category: data.category || 'Прочее',
          amount: data.amount,
          description: data.description || null,
        }]);

        if (expenseError) throw new Error(`Ошибка добавления расхода: ${expenseError.message}`);
        return { success: true, message: `Расход на сумму ${data.amount} ₽ успешно добавлен` };

    // Добавление поставщика
    } else if (normalizedAction === 'add_supplier') {
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

    // Редактирование тендера
    } else if (normalizedAction === 'update_tender') {
      const { error: updateError } = await supabase
        .from('tenders')
        .update(data.updates)
        .eq('id', data.id);

      if (updateError) throw new Error(`Ошибка обновления тендера: ${updateError.message}`);
      return { success: true, message: `Тендер #${data.id} успешно обновлён` };

    // Удаление тендера
    } else if (normalizedAction === 'delete_tender') {
      const { error: deleteError } = await supabase
        .from('tenders')
        .delete()
        .eq('id', data.id);

      if (deleteError) throw new Error(`Ошибка удаления тендера: ${deleteError.message}`);
      return { success: true, message: `Тендер #${data.id} успешно удалён` };

    // Удаление расхода
    } else if (normalizedAction === 'delete_expense') {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', data.id);

      if (deleteError) throw new Error(`Ошибка удаления расхода: ${deleteError.message}`);
      return { success: true, message: `Расход #${data.id} успешно удалён` };

    // Удаление поставщика
    } else if (normalizedAction === 'delete_supplier') {
      const { error: deleteError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', data.id);

      if (deleteError) throw new Error(`Ошибка удаления поставщика: ${deleteError.message}`);
      return { success: true, message: `Поставщик #${data.id} успешно удалён` };

    } else {
      throw new Error(`Неизвестное действие: ${action}`);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Ошибка выполнения действия');
  }
}
