'use client';

import { useEffect, useState } from 'react';
import { supabase, Tender, Expense } from '@/lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface TenderWithExpenses {
  tender: Tender;
  expenses: Expense[];
}

export default function AccountingPage() {
  const [tendersWithExpenses, setTendersWithExpenses] = useState<TenderWithExpenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTenderId, setExpandedTenderId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Загружаем тендеры со статусами "победа", "в работе", "завершён"
    const { data: tenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .in('status', ['победа', 'в работе', 'завершён'])
      .order('created_at', { ascending: false });

    if (tendersError || !tenders || tenders.length === 0) {
      setTendersWithExpenses([]);
      setIsLoading(false);
      return;
    }

    // Загружаем расходы для всех тендеров
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .in('tender_id', tenders.map((t) => t.id));

    // Группируем расходы по тендерам
    const result: TenderWithExpenses[] = tenders.map((tender) => ({
      tender,
      expenses: (expenses || []).filter((exp) => exp.tender_id === tender.id),
    }));

    setTendersWithExpenses(result);
    setIsLoading(false);
  };

  // Общая статистика - доход считаем только по завершённым тендерам
  const totalIncome = tendersWithExpenses.reduce((sum, item) => {
    if (item?.tender?.status === 'завершён') {
      return sum + (item.tender.win_price || 0);
    }
    return sum;
  }, 0);

  const totalExpenses = tendersWithExpenses.reduce(
    (sum, item) => sum + (item?.expenses || []).reduce((expSum, exp) => expSum + (exp?.amount || 0), 0),
    0
  );

  const grossProfit = totalIncome - totalExpenses;
  const totalTax = grossProfit > 0 ? grossProfit * 0.07 : 0;
  const netProfit = grossProfit - totalTax;

  const toggleTender = (tenderId: number) => {
    setExpandedTenderId(expandedTenderId === tenderId ? null : tenderId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Бухгалтерия</h1>
        <p className="text-sm text-gray-600 mt-1">Финансовый учёт по тендерам</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Общая статистика */}
          <div className="px-6 py-6">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-3xl p-6 text-white mb-6">
              <div className="text-sm opacity-80 mb-2">Чистая прибыль</div>
              <div className="text-4xl font-bold mb-4">{formatPrice(netProfit)}</div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-xs opacity-80 mb-1">Доход</div>
                  <div className="text-lg font-bold">{formatPrice(totalIncome)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                  <div className="text-xs opacity-80 mb-1">Расходы</div>
                  <div className="text-lg font-bold">{formatPrice(totalExpenses)}</div>
                </div>
              </div>
            </div>

            {/* Карточки статистики */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Общий доход</div>
                <div className="text-xl font-bold text-gray-900">{formatPrice(totalIncome)}</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Расходы</div>
                <div className="text-xl font-bold text-gray-900">{formatPrice(totalExpenses)}</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Налог УСН 7%</div>
                <div className="text-xl font-bold text-gray-900">{formatPrice(totalTax)}</div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-1">Тендеров</div>
                <div className="text-xl font-bold text-gray-900">{tendersWithExpenses.length}</div>
              </div>
            </div>

            {/* Список тендеров */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Детализация по тендерам</h2>

              {tendersWithExpenses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Нет данных для отображения</p>
                </div>
              ) : (
                tendersWithExpenses.map((item) => {
                  const income = item.tender.status === 'завершён' ? item.tender.win_price || 0 : 0;
                  const expenses = item.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                  const profit = income - expenses;
                  const isExpanded = expandedTenderId === item.tender.id;

                  return (
                    <div key={item.tender.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div
                        onClick={() => toggleTender(item.tender.id)}
                        className="p-4 active:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-2 pr-2">
                            {item.tender.name}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-600 mb-1">Доход</div>
                            <div className="font-semibold text-green-600">{formatPrice(income)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Расходы</div>
                            <div className="font-semibold text-red-600">{formatPrice(expenses)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Прибыль</div>
                            <div
                              className={`font-semibold ${
                                profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}
                            >
                              {formatPrice(profit)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Раскрывающийся список расходов */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900 mb-3">
                            Расходы ({item.expenses.length})
                          </div>

                          {item.expenses.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Расходов пока нет</p>
                          ) : (
                            <div className="space-y-2">
                              {item.expenses.map((expense) => (
                                <div
                                  key={expense.id}
                                  className="bg-white rounded-xl p-3 flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900 text-sm">{expense.category}</div>
                                    {expense.description && (
                                      <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
                                    )}
                                  </div>
                                  <div className="font-semibold text-red-600 ml-3">
                                    {formatPrice(expense.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
