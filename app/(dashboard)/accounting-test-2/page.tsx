'use client';

import { useEffect, useState } from 'react';
import { supabase, Tender, Expense } from '@/lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, FileText, Plus, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TenderWithExpenses {
  tender: Tender;
  expenses: Expense[];
}

export default function AccountingTest2Page() {
  const [tendersWithExpenses, setTendersWithExpenses] = useState<TenderWithExpenses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTender, setExpandedTender] = useState<number | null>(null);
  const [addingExpenseFor, setAddingExpenseFor] = useState<number | null>(null);
  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: 0,
    description: '',
    is_cash: false,
  });

  // Загрузка данных
  const loadData = async () => {
    setIsLoading(true);

    const { data: tenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .in('status', ['победа', 'в работе', 'завершён'])
      .order('created_at', { ascending: false });

    if (tendersError) {
      console.error('Ошибка:', tendersError);
      setIsLoading(false);
      return;
    }

    if (!tenders || tenders.length === 0) {
      setTendersWithExpenses([]);
      setIsLoading(false);
      return;
    }

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .in('tender_id', tenders.map(t => t.id));

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

  // Общая статистика - доход только по завершённым
  const totalIncome = tendersWithExpenses.reduce((sum, item) => {
    if (item.tender.status === 'завершён') {
      return sum + (item.tender.win_price || 0);
    }
    return sum;
  }, 0);
  
  const totalExpenses = tendersWithExpenses.reduce((sum, item) => 
    sum + item.expenses.reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );
  
  const totalCashExpenses = tendersWithExpenses.reduce((sum, item) => 
    sum + item.expenses.filter(e => e.is_cash).reduce((expSum, exp) => expSum + exp.amount, 0), 0
  );
  
  const totalBankExpenses = totalExpenses - totalCashExpenses;
  
  const grossProfit = totalIncome - totalExpenses;
  const totalTax = grossProfit > 0 ? grossProfit * 0.07 : 0;
  const netProfit = grossProfit - totalTax;

  // Форматирование
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Добавление расхода
  const handleAddExpense = async (tenderId: number) => {
    if (!newExpense.category.trim()) {
      alert('Введите категорию');
      return;
    }

    if (newExpense.amount <= 0) {
      alert('Сумма должна быть больше 0');
      return;
    }

    const { error } = await supabase.from('expenses').insert([{
      tender_id: tenderId,
      category: newExpense.category,
      amount: newExpense.amount,
      description: newExpense.description,
      is_cash: newExpense.is_cash,
    }]);

    if (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при добавлении');
    } else {
      setNewExpense({ category: '', amount: 0, description: '', is_cash: false });
      setAddingExpenseFor(null);
      loadData();
    }
  };

  // Удаление расхода
  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Удалить?')) return;

    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

    if (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при удалении');
    } else {
      loadData();
    }
  };

  // Расчет для тендера
  const calculateTenderStats = (item: TenderWithExpenses) => {
    const income = item.tender.win_price || 0;
    const expenses = item.expenses.reduce((sum, e) => sum + e.amount, 0);
    const profit = income - expenses;
    const marginPercent = income > 0 ? (profit / income) * 100 : 0;
    const tax = profit > 0 ? profit * 0.07 : 0;
    const netProfit = profit - tax;
    
    return { income, expenses, profit, marginPercent, tax, netProfit };
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Бухгалтерия - Вариант 2 (ACCORDION)</h1>
        <p className="text-sm text-gray-600">Тестовая версия с аккордеоном (улучшенная)</p>
      </div>

      {/* Финансовая панель */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Проектов</p>
                <p className="text-2xl font-bold text-gray-900">{tendersWithExpenses.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Доход (завершён)</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Расходы</p>
              <p className="text-2xl font-bold text-red-600">{formatAmount(totalExpenses)}</p>
              <div className="flex gap-2 mt-1 text-xs">
                <span className="text-gray-600">💳 {formatAmount(totalBankExpenses)}</span>
                <span className="text-gray-600">💵 {formatAmount(totalCashExpenses)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 border shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Чистая прибыль</p>
                <p className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatAmount(netProfit)}
                </p>
                <p className="text-xs text-gray-500">После УСН 7%</p>
              </div>
              <DollarSign className={`h-8 w-8 ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACCORDION ПРОЕКТОВ */}
      <div className="space-y-3">
        {tendersWithExpenses.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Нет данных</p>
            </CardContent>
          </Card>
        ) : (
          tendersWithExpenses.map((item) => {
            const stats = calculateTenderStats(item);
            const isExpanded = expandedTender === item.tender.id;

            return (
              <Card key={item.tender.id} className="backdrop-blur-xl bg-white/80 border shadow-lg overflow-hidden">
                {/* ЗАГОЛОВОК АККОРДЕОНА */}
                <button
                  onClick={() => setExpandedTender(isExpanded ? null : item.tender.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{item.tender.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.tender.status === 'завершён' ? 'bg-green-100 text-green-800' :
                        item.tender.status === 'в работе' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.tender.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-600">
                        Доход: <span className="font-medium text-green-600">{formatAmount(stats.income)}</span>
                      </span>
                      <span className="text-gray-600">
                        Расходы: <span className="font-medium text-red-600">{formatAmount(stats.expenses)}</span>
                      </span>
                      <span className="text-gray-600">
                        Прибыль: <span className={`font-bold ${stats.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(stats.netProfit)}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Маржа: <span className={`font-bold ${stats.marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stats.marginPercent.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* СОДЕРЖИМОЕ АККОРДЕОНА */}
                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    {/* Детальная финансовая сводка */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-xs text-gray-600">Доход</p>
                        <p className="text-lg font-bold text-green-600">{formatAmount(stats.income)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-xs text-gray-600">Расходы</p>
                        <p className="text-lg font-bold text-red-600">{formatAmount(stats.expenses)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-xs text-gray-600">Прибыль</p>
                        <p className={`text-lg font-bold ${stats.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(stats.profit)}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-xs text-gray-600">Налог УСН 7%</p>
                        <p className="text-lg font-bold text-orange-600">{formatAmount(stats.tax)}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <p className="text-xs text-gray-600">Чистая прибыль</p>
                        <p className={`text-lg font-bold ${stats.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatAmount(stats.netProfit)}
                        </p>
                      </div>
                    </div>

                    {/* Маржа отдельно */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-900 mb-2">💹 Рентабельность</h4>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Маржа (%)</p>
                          <p className={`text-3xl font-bold ${stats.marginPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stats.marginPercent.toFixed(1)}%
                          </p>
                        </div>
                        <div className="h-12 w-px bg-gray-300"></div>
                        <div>
                          <p className="text-sm text-gray-600">Маржа (₽)</p>
                          <p className={`text-3xl font-bold ${stats.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(stats.profit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Аналитика по категориям */}
                    {item.expenses.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold text-gray-900 mb-3">📊 Аналитика расходов</h4>
                        <div className="space-y-2">
                          {(() => {
                            const categories = item.expenses.reduce((acc, exp) => {
                              acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            return Object.entries(categories)
                              .sort(([, a], [, b]) => b - a)
                              .map(([category, amount]) => {
                                const percent = (amount / stats.expenses) * 100;
                                return (
                                  <div key={category} className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{category}</span>
                                        <span className="text-gray-900">{formatAmount(amount)} ({percent.toFixed(0)}%)</span>
                                      </div>
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-500 h-2 rounded-full transition-all" 
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Список расходов */}
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Детализация расходов</h4>
                        <Button
                          size="sm"
                          onClick={() => setAddingExpenseFor(addingExpenseFor === item.tender.id ? null : item.tender.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Добавить
                        </Button>
                      </div>

                      {/* Форма добавления */}
                      {addingExpenseFor === item.tender.id && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <Label>Категория</Label>
                              <Input
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                placeholder="Материалы, Работы..."
                              />
                            </div>
                            <div>
                              <Label>Сумма</Label>
                              <Input
                                type="number"
                                value={newExpense.amount || ''}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                            <div>
                              <Label>Описание</Label>
                              <Input
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                placeholder="Опционально"
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newExpense.is_cash}
                                  onChange={(e) => setNewExpense({ ...newExpense, is_cash: e.target.checked })}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <span className="text-sm">💵 Наличка</span>
                              </label>
                            </div>
                          </div>
                          <Button onClick={() => handleAddExpense(item.tender.id)} size="sm" className="w-full">
                            Сохранить
                          </Button>
                        </div>
                      )}

                      {/* Таблица расходов */}
                      {item.expenses.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Расходы не добавлены</p>
                      ) : (
                        <div className="space-y-2">
                          {item.expenses.map((exp) => (
                            <div key={exp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{exp.category}</span>
                                  {exp.description && <span className="text-sm text-gray-500">— {exp.description}</span>}
                                  <span className="text-xs">{exp.is_cash ? '💵' : '💳'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-red-600">{formatAmount(exp.amount)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Уведомление */}
      <Card className="mt-4 backdrop-blur-xl bg-yellow-500/10 border-l-4 border-l-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <span className="font-bold">🧪 Тестовая версия:</span> Вариант с аккордеоном (улучшенный). 
                Основная версия на <a href="/accounting" className="underline">/accounting</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
