/**
 * Функции для AI помощника
 * Выполняют реальные действия в CRM
 */

import { supabase } from './supabase';

// Получить тендеры с фильтрацией
export async function getTenders(params: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
} = {}) {
  try {
    let query = supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.dateFrom) {
      query = query.gte('publication_date', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('publication_date', params.dateTo);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Создать тендер
export async function createTender(params: {
  name: string;
  purchase_number?: string;
  region?: string;
  start_price?: number;
  submission_deadline?: string;
  link?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('tenders')
      .insert({
        name: params.name,
        purchase_number: params.purchase_number || null,
        region: params.region || null,
        start_price: params.start_price || null,
        submission_deadline: params.submission_deadline || null,
        link: params.link || null,
        status: 'новый',
        publication_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Обновить тендер
export async function updateTender(params: {
  id: number;
  status?: string;
  win_price?: number;
  submitted_price?: number;
  [key: string]: any;
}) {
  try {
    const { id, ...updates } = params;
    
    const { data, error } = await supabase
      .from('tenders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Удалить тендер
export async function deleteTender(id: number) {
  try {
    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Получить поставщиков
export async function getSuppliers(params: {
  category?: string;
} = {}) {
  try {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (params.category) {
      query = query.eq('category', params.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Создать поставщика
export async function createSupplier(params: {
  name: string;
  phone?: string;
  email?: string;
  category?: string;
  inn?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(params)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Обновить поставщика
export async function updateSupplier(params: {
  id: number;
  [key: string]: any;
}) {
  try {
    const { id, ...updates } = params;
    
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Удалить поставщика
export async function deleteSupplier(id: number) {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Получить расходы
export async function getExpenses(params: {
  tender_id?: number;
  supplier_id?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select('*, tenders(name), suppliers(name)')
      .order('date', { ascending: false });

    if (params.tender_id) {
      query = query.eq('tender_id', params.tender_id);
    }

    if (params.supplier_id) {
      query = query.eq('supplier_id', params.supplier_id);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.dateFrom) {
      query = query.gte('date', params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte('date', params.dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Создать расход
export async function createExpense(params: {
  amount: number;
  category: string;
  description?: string;
  tender_id?: number;
  supplier_id?: number;
  date?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...params,
        date: params.date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Обновить расход
export async function updateExpense(params: {
  id: number;
  [key: string]: any;
}) {
  try {
    const { id, ...updates } = params;
    
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Удалить расход
export async function deleteExpense(id: number) {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Получить файлы тендера
export async function getTenderFiles(tender_id: number) {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('tender_id', tender_id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Удалить файл
export async function deleteFile(id: number) {
  try {
    // Получаем информацию о файле
    const { data: file } = await supabase
      .from('files')
      .select('url')
      .eq('id', id)
      .single();

    if (file) {
      // Извлекаем путь из URL
      const path = file.url.split('/').pop();
      
      // Удаляем из storage
      await supabase.storage
        .from('tender-files')
        .remove([path!]);
    }

    // Удаляем запись из БД
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Получить финансовую сводку
export async function getFinancialSummary(params: {
  dateFrom?: string;
  dateTo?: string;
} = {}) {
  try {
    // Получаем завершённые тендеры (доходы)
    let tendersQuery = supabase
      .from('tenders')
      .select('win_price, name, publication_date')
      .eq('status', 'завершён');

    if (params.dateFrom) {
      tendersQuery = tendersQuery.gte('publication_date', params.dateFrom);
    }

    if (params.dateTo) {
      tendersQuery = tendersQuery.lte('publication_date', params.dateTo);
    }

    const { data: tenders } = await tendersQuery;

    // Получаем расходы
    let expensesQuery = supabase
      .from('expenses')
      .select('amount, category, date');

    if (params.dateFrom) {
      expensesQuery = expensesQuery.gte('date', params.dateFrom);
    }

    if (params.dateTo) {
      expensesQuery = expensesQuery.lte('date', params.dateTo);
    }

    const { data: expenses } = await expensesQuery;

    // Считаем финансы
    const totalIncome = tenders?.reduce((sum, t) => sum + (t.win_price || 0), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const grossProfit = totalIncome - totalExpenses;
    const tax = grossProfit > 0 ? grossProfit * 0.07 : 0;
    const netProfit = grossProfit - tax;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    // Группируем расходы по категориям
    const expensesByCategory = expenses?.reduce((acc: any, e) => {
      const cat = e.category || 'Прочее';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {}) || {};

    return {
      success: true,
      data: {
        period: {
          from: params.dateFrom || 'начало',
          to: params.dateTo || 'сейчас',
        },
        income: {
          total: totalIncome,
          tenders: tenders?.length || 0,
          list: tenders || [],
        },
        expenses: {
          total: totalExpenses,
          count: expenses?.length || 0,
          byCategory: expensesByCategory,
        },
        profit: {
          gross: grossProfit,
          tax,
          net: netProfit,
          margin: Math.round(margin * 100) / 100,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Поиск тендера по названию или ID
export async function findTender(query: string | number) {
  try {
    if (typeof query === 'number') {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', query)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Поиск поставщика по названию или ID
export async function findSupplier(query: string | number) {
  try {
    if (typeof query === 'number') {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', query)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } else {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) throw error;
      return { success: true, data };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
