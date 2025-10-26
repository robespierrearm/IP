'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase, Tender, Expense } from '@/lib/supabase';
import { TenderAccountingV1 } from '@/components/TenderAccountingV1';
import { TrendingUp, TrendingDown, DollarSign, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenderWithExpenses {
  tender: Tender;
  expenses: Expense[];
}

type Period = 'all' | 'month' | 'quarter' | 'year';

export default function AccountingPage() {
  const [tendersWithExpenses, setTendersWithExpenses] = useState<TenderWithExpenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expensesTableMissing, setExpensesTableMissing] = useState(false);
  const [period, setPeriod] = useState<Period>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Загрузка данных
  const loadData = async () => {
    setIsLoading(true);

    // Загружаем тендеры со статусами "победа", "в работе", "завершён"
    const { data: tenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .in('status', ['победа', 'в работе', 'завершён'])
      .order('created_at', { ascending: false });

    if (tendersError) {
      console.error('Ошибка загрузки тендеров:', tendersError);
      setIsLoading(false);
      return;
    }

    if (!tenders || tenders.length === 0) {
      setTendersWithExpenses([]);
      setIsLoading(false);
      return;
    }

    // Загружаем расходы для всех тендеров
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .in('tender_id', tenders.map(t => t.id));

    if (expensesError) {
      // Если таблица expenses не существует (код PGRST116 или 42P01), это нормально
      if (expensesError.code === 'PGRST116' || expensesError.code === '42P01') {
        console.warn('Таблица expenses не найдена. Создайте её в Supabase (см. SETUP_INSTRUCTIONS.md)');
        setExpensesTableMissing(true);
      } else {
        console.error('Ошибка загрузки расходов:', expensesError);
      }
    }

    // Группируем расходы по тендерам
    const result: TenderWithExpenses[] = tenders.map(tender => ({
      tender,
      expenses: (expenses || []).filter(exp => exp.tender_id === tender.id),
    }));

    setTendersWithExpenses(result);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Фильтрация по периоду
  const filteredData = useMemo(() => {
    if (period === 'all') return tendersWithExpenses;
    
    const now = selectedDate;
    const y = now.getFullYear(), m = now.getMonth();
    let startDate: Date, endDate: Date;
    
    if (period === 'month') {
      startDate = new Date(y, m, 1);
      endDate = new Date(y, m + 1, 0);
    } else if (period === 'quarter') {
      const q = Math.floor(m / 3) * 3;
      startDate = new Date(y, q, 1);
      endDate = new Date(y, q + 3, 0);
    } else {
      startDate = new Date(y, 0, 1);
      endDate = new Date(y, 11, 31);
    }
    
    return tendersWithExpenses.filter(item => {
      const tenderDate = new Date(item.tender.created_at || '');
      return tenderDate >= startDate && tenderDate <= endDate;
    });
  }, [tendersWithExpenses, period, selectedDate]);

  // Общая статистика - доход считаем только по завершённым тендерам
  const totalIncome = filteredData.reduce((sum, item) => {
    if (item.tender.status === 'завершён') {
      return sum + (item.tender.win_price || 0);
    }
    return sum;
  }, 0);
  
  const totalExpenses = filteredData.reduce((sum, item) => 
    sum + item.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );
  
  // УСН: только безнал расходы уменьшают налоговую базу!
  const bankExpenses = filteredData.reduce((sum, item) => 
    sum + item.expenses.filter(e => !e.is_cash).reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );
  const cashExpenses = totalExpenses - bankExpenses;
  
  const grossProfit = totalIncome - totalExpenses;
  const taxableProfit = totalIncome - bankExpenses; // база для УСН (только безнал!)
  const totalTax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const netProfit = grossProfit - totalTax;

  // Форматирование суммы
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPeriodLabel = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    if (period === 'month') return `${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (period === 'quarter') return `Q${Math.floor(selectedDate.getMonth() / 3) + 1} ${selectedDate.getFullYear()}`;
    if (period === 'year') return `${selectedDate.getFullYear()}`;
    return 'Всё время';
  };

  const changeDate = (dir: number) => {
    const d = new Date(selectedDate);
    if (period === 'month') d.setMonth(d.getMonth() + dir);
    else if (period === 'quarter') d.setMonth(d.getMonth() + dir * 3);
    else d.setFullYear(d.getFullYear() + dir);
    setSelectedDate(d);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Заголовок с фильтром */}
      <div className="mb-6 md:mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Бухгалтерия</h1>
          <p className="text-xs text-gray-600">Финансовый учёт</p>
        </div>
        
        {/* Компактный фильтр периодов */}
        <div className="flex items-center gap-2 bg-white border rounded-lg p-2 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={period === 'all' ? 'default' : 'ghost'}
              onClick={() => setPeriod('all')}
              className="h-7 px-2 text-xs"
            >
              Всё
            </Button>
            <Button
              size="sm"
              variant={period === 'month' ? 'default' : 'ghost'}
              onClick={() => setPeriod('month')}
              className="h-7 px-2 text-xs"
            >
              Месяц
            </Button>
            <Button
              size="sm"
              variant={period === 'quarter' ? 'default' : 'ghost'}
              onClick={() => setPeriod('quarter')}
              className="h-7 px-2 text-xs"
            >
              Квартал
            </Button>
            <Button
              size="sm"
              variant={period === 'year' ? 'default' : 'ghost'}
              onClick={() => setPeriod('year')}
              className="h-7 px-2 text-xs"
            >
              Год
            </Button>
          </div>
          {period !== 'all' && (
            <div className="flex items-center gap-1 border-l pl-2 ml-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeDate(-1)}
                className="h-7 w-7 p-0"
              >
                ←
              </Button>
              <span className="text-xs font-medium text-gray-700 min-w-[80px] text-center">
                {getPeriodLabel()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeDate(1)}
                className="h-7 w-7 p-0"
              >
                →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Уведомление об отсутствии таблицы expenses */}
      {expensesTableMissing && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900">Требуется настройка БД</h3>
              <p className="text-sm text-orange-700 mt-1">
                Таблица <code className="bg-orange-100 px-1 rounded">expenses</code> не найдена в Supabase. 
                Функционал добавления расходов будет недоступен.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                📝 Откройте <strong>SETUP_INSTRUCTIONS.md</strong> и выполните Шаг 2 (создание таблицы expenses)
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Загрузка данных...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет данных для отображения</h3>
          <p className="text-gray-600">
            Выигранные тендеры появятся здесь автоматически
          </p>
        </div>
      ) : (
        <>
          {/* Общая статистика */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Всего тендеров</p>
                  <p className="text-2xl font-bold text-gray-900">{tendersWithExpenses.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Общий доход</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Общие расходы</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)}</p>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-gray-600">💳 Безнал: <span className="font-medium">{formatAmount(bankExpenses)}</span></span>
                    <span className="text-gray-600">💵 Наличка: <span className="font-medium">{formatAmount(cashExpenses)}</span></span>
                  </div>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Чистая прибыль</p>
                  <p className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-600' : netProfit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatAmount(netProfit)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    УСН 7%: <span className="font-medium text-orange-600">{formatAmount(totalTax)}</span>
                  </p>
                </div>
                <DollarSign className={`h-8 w-8 ${netProfit > 0 ? 'text-green-600' : netProfit < 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
            </div>
          </div>

          {/* Детальная статистика */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Общая статистика</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Всего тендеров:</span>
                  <span className="font-semibold">{tendersWithExpenses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Общий доход:</span>
                  <span className="font-semibold text-green-600">{formatAmount(totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Общие расходы:</span>
                  <span className="font-semibold text-red-600">{formatAmount(totalExpenses)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Чистая прибыль:</span>
                  <span className={`font-semibold ${grossProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Налоги к уплате (7%):</span>
                  <span className="font-semibold text-orange-600">{formatAmount(totalTax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-900 font-bold">Итого к получению:</span>
                  <span className={`font-bold text-lg ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Список тендеров с accordion */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Детализация по тендерам</h2>
            {filteredData.map((item) => (
              <TenderAccountingV1
                key={item.tender.id}
                tender={item.tender}
                expenses={item.expenses}
                onExpenseAdded={loadData}
                onExpenseDeleted={loadData}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
