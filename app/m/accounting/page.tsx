'use client';

import { useEffect, useState } from 'react';
import { Tender, Expense } from '@/lib/supabase';
import { offlineSupabase } from '@/lib/offline-supabase';
import { TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface TenderWithExpenses {
  tender: Tender;
  expenses: Expense[];
}

export default function AccountingPage() {
  const [tendersWithExpenses, setTendersWithExpenses] = useState<TenderWithExpenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTenderId, setExpandedTenderId] = useState<number | null>(null);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<number | null>(null);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Загружаем тендеры со статусами "победа", "в работе", "завершён"
    const tenders = await offlineSupabase.getTenders();
    const filteredTenders = tenders.filter(t => 
      ['победа', 'в работе', 'завершён'].includes(t.status)
    ).sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
    const tendersError = null;

    if (tendersError || !filteredTenders || filteredTenders.length === 0) {
      setTendersWithExpenses([]);
      setIsLoading(false);
      return;
    }

    // Загружаем расходы для всех тендеров
    const allExpenses = await offlineSupabase.getExpenses();
    const tenderIds = filteredTenders.map((t: Tender) => t.id);
    const expenses = allExpenses.filter((exp: Expense) => tenderIds.includes(exp.tender_id));

    // Группируем расходы по тендерам
    const result: TenderWithExpenses[] = filteredTenders.map((tender: Tender) => ({
      tender,
      expenses: (expenses || []).filter((exp: Expense) => exp.tender_id === tender.id),
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

  const handleAddExpense = async () => {
    if (!selectedTenderId || !newExpense.category || !newExpense.amount) {
      alert('Заполните обязательные поля');
      return;
    }

    const expense = {
      tender_id: selectedTenderId,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description || null,
      created_at: new Date().toISOString(),
    };

    try {
      await offlineSupabase.createExpense(expense);

    } catch (error) {
      alert('Ошибка при добавлении расхода');
      return;
    }

    setShowAddExpenseModal(false);
    setNewExpense({ category: '', amount: '', description: '' });
    loadData();
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Удалить этот расход?')) return;

    try {
      await offlineSupabase.deleteExpense(expenseId);
    } catch (error) {
      alert('Ошибка при удалении расхода');
      return;
    }

    loadData();
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
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-gray-900">
                              Расходы ({item.expenses.length})
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTenderId(item.tender.id);
                                setShowAddExpenseModal(true);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg flex items-center gap-1 active:bg-green-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Добавить
                            </button>
                          </div>

                          {item.expenses.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Расходов пока нет</p>
                          ) : (
                            <div className="space-y-2">
                              {item.expenses.map((expense) => (
                                <div
                                  key={expense.id}
                                  className="bg-white rounded-xl p-3 flex items-center justify-between gap-2"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm">{expense.category}</div>
                                    {expense.description && (
                                      <div className="text-xs text-gray-600 mt-1">{expense.description}</div>
                                    )}
                                  </div>
                                  <div className="font-semibold text-red-600">
                                    {formatPrice(expense.amount)}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg active:bg-red-100 transition-colors flex-shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

      {/* Модальное окно добавления расхода */}
      {showAddExpenseModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowAddExpenseModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Добавить расход</h2>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория *
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Выберите категорию</option>
                    <option value="Материалы">Материалы</option>
                    <option value="Доставка">Доставка</option>
                    <option value="Работы">Работы</option>
                    <option value="Техника">Техника</option>
                    <option value="Инструменты">Инструменты</option>
                    <option value="Прочее">Прочее</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сумма (₽) *
                  </label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="Введите сумму"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Дополнительная информация"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddExpense}
                  className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-4 rounded-xl font-medium active:scale-95 transition-transform"
                >
                  Добавить расход
                </button>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-6 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium active:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
