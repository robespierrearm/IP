'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Tender, Expense, ExpenseInsert, supabase, DocumentType } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit, BarChart3, FileText, Receipt, X, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { PlatformButton } from '@/components/PlatformButton';

interface Props {
  tender: Tender;
  expenses: Expense[];
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

// ВАРИАНТ 2: MODERN DASHBOARD - ПРОФЕССИОНАЛЬНЫЙ МИНИМАЛИСТИЧНЫЙ
export function TenderAccountingModern({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('тендерная документация');
  const [materialCounts, setMaterialCounts] = useState({
    'тендерная документация': 0,
    'закрывающие документы': 0,
  });
  const [newExpense, setNewExpense] = useState<ExpenseInsert>({
    tender_id: tender.id,
    category: '',
    amount: 0,
    description: '',
    is_cash: false,
  });

  const income = tender.win_price || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const bankExpenses = expenses.filter(exp => !exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const cashExpenses = expenses.filter(exp => exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const profit = income - totalExpenses;
  const taxableProfit = income - bankExpenses;
  const tax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const netProfit = profit - tax;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const fmtShort = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}М` : n >= 1e3 ? `${(n/1e3).toFixed(0)}К` : n.toString();

  useEffect(() => {
    const loadMaterialCounts = async () => {
      const { data } = await supabase
        .from('files')
        .select('document_type')
        .eq('tender_id', tender.id);
      
      if (data) {
        const counts = {
          'тендерная документация': data.filter(f => f.document_type === 'тендерная документация').length,
          'закрывающие документы': data.filter(f => f.document_type === 'закрывающие документы').length,
        };
        setMaterialCounts(counts);
      }
    };
    
    loadMaterialCounts();
  }, [tender.id]);

  const handleAddExpense = async () => {
    if (!newExpense.category.trim() || newExpense.amount <= 0) {
      alert('Заполните категорию и сумму');
      return;
    }

    const { error } = await supabase.from('expenses').insert([newExpense]);
    if (error) {
      alert('Ошибка при добавлении расхода');
    } else {
      setNewExpense({
        tender_id: tender.id,
        category: '',
        amount: 0,
        description: '',
        is_cash: false,
      });
      setIsAddingExpense(false);
      onExpenseAdded();
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    if (!newExpense.category.trim() || newExpense.amount <= 0) {
      alert('Заполните категорию и сумму');
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        category: newExpense.category,
        amount: newExpense.amount,
        description: newExpense.description,
        is_cash: newExpense.is_cash,
      })
      .eq('id', editingExpense.id);

    if (error) {
      alert('Ошибка при обновлении расхода');
    } else {
      setNewExpense({
        tender_id: tender.id,
        category: '',
        amount: 0,
        description: '',
        is_cash: false,
      });
      setEditingExpense(null);
      setIsAddingExpense(false);
      onExpenseAdded();
    }
  };

  const startEditing = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      tender_id: tender.id,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || '',
      is_cash: expense.is_cash || false,
    });
    setIsAddingExpense(true);
  };

  const cancelEditing = () => {
    setEditingExpense(null);
    setNewExpense({
      tender_id: tender.id,
      category: '',
      amount: 0,
      description: '',
      is_cash: false,
    });
    setIsAddingExpense(false);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Удалить этот расход?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      alert('Ошибка при удалении расхода');
    } else {
      onExpenseDeleted();
    }
  };

  // Группировка расходов по категориям
  const categorizedExpenses = useMemo(() => {
    const cats: Record<string, Expense[]> = {};
    expenses.forEach(e => {
      if (!cats[e.category]) cats[e.category] = [];
      cats[e.category].push(e);
    });
    return Object.entries(cats).sort(([,a], [,b]) => {
      const sumA = a.reduce((s, e) => s + e.amount, 0);
      const sumB = b.reduce((s, e) => s + e.amount, 0);
      return sumB - sumA;
    });
  }, [expenses]);

  return (
    <div className="border-l-4 border-blue-500 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* ЗАГОЛОВОК - АКЦЕНТ НА ЧИСТОЙ ПРИБЫЛИ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-bold text-gray-900">{tender.name}</h3>
            <PlatformButton link={tender.link} />
          </div>
          
          <div className="flex items-center gap-8">
            {/* ЧИСТАЯ ПРИБЫЛЬ - ГЛАВНОЕ */}
            <div className="flex items-center gap-2">
              {netProfit > 0 ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Чистая прибыль</div>
                <div className={cn("text-2xl font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
                  {formatAmount(netProfit)}
                </div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-gray-500">Доход</div>
                <div className="font-semibold text-gray-900">{fmtShort(income)}</div>
              </div>
              <div>
                <div className="text-gray-500">Расходы</div>
                <div className="font-semibold text-gray-900">{fmtShort(totalExpenses)}</div>
              </div>
              <div>
                <div className="text-gray-500">УСН 7%</div>
                <div className="font-semibold text-orange-600">{fmtShort(tax)}</div>
              </div>
              <div className="text-xs text-gray-400">
                {expenses.length} расходов
              </div>
            </div>
          </div>
        </div>

        <div className="ml-4">
          {isOpen ? (
            <ChevronUp className="h-6 w-6 text-gray-400" />
          ) : (
            <ChevronDown className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </button>

      {/* РАСКРЫВАЮЩЕЕСЯ СОДЕРЖИМОЕ */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-5">
          {/* ДЕЙСТВИЯ - компактная панель */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <BarChart3 className="h-4 w-4" />
                Сводка
              </button>
              
              <button
                onClick={() => {
                  setSelectedDocType('тендерная документация');
                  setDocumentsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Документация
                {materialCounts['тендерная документация'] > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {materialCounts['тендерная документация']}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedDocType('закрывающие документы');
                  setDocumentsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center gap-1.5"
              >
                <Receipt className="h-4 w-4" />
                Закрывающие
                {materialCounts['закрывающие документы'] > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    {materialCounts['закрывающие документы']}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ФИНАНСОВЫЕ КАРТОЧКИ - 4 колонки */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <div className="text-xs text-green-700 font-medium mb-1">ДОХОД</div>
              <div className="text-lg font-bold text-green-700">{formatAmount(income)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
              <div className="text-xs text-red-700 font-medium mb-1">РАСХОДЫ</div>
              <div className="text-lg font-bold text-red-700">{formatAmount(totalExpenses)}</div>
              <div className="flex gap-2 mt-1 text-xs text-red-600">
                <span>💳 {fmtShort(bankExpenses)}</span>
                <span>💵 {fmtShort(cashExpenses)}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
              <div className="text-xs text-orange-700 font-medium mb-1">УСН 7%</div>
              <div className="text-lg font-bold text-orange-700">{formatAmount(tax)}</div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-700 font-medium mb-1">ПРИБЫЛЬ</div>
              <div className={cn("text-lg font-bold", profit > 0 ? "text-blue-700" : "text-red-700")}>
                {formatAmount(profit)}
              </div>
            </div>
          </div>

          {/* РАСХОДЫ - группировка по категориям */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">Расходы по категориям</h4>
              <Button
                onClick={() => {
                  if (isAddingExpense && !editingExpense) {
                    setIsAddingExpense(false);
                  } else if (editingExpense) {
                    cancelEditing();
                  } else {
                    setIsAddingExpense(true);
                  }
                }}
                size="sm"
                className={isAddingExpense ? "bg-gray-200 text-gray-700" : ""}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddingExpense ? 'Отмена' : 'Добавить расход'}
              </Button>
            </div>

            {/* Форма добавления */}
            {isAddingExpense && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                {editingExpense && (
                  <div className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Редактирование расхода
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <Input
                      id="category"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      placeholder="Например: Материалы"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Сумма (₽)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Input
                      id="description"
                      value={newExpense.description || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="Опционально"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExpense.is_cash}
                      onChange={(e) => setNewExpense({ ...newExpense, is_cash: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">💵 Наличка (не учитывается в УСН)</span>
                  </label>
                  <Button 
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense} 
                    size="sm"
                  >
                    {editingExpense ? 'Обновить' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            )}

            {/* Список расходов по категориям */}
            {categorizedExpenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Расходы не добавлены</p>
            ) : (
              <div className="space-y-4">
                {categorizedExpenses.map(([category, items]) => {
                  const categoryTotal = items.reduce((s, e) => s + e.amount, 0);
                  return (
                    <div key={category} className="space-y-2">
                      {/* Заголовок категории */}
                      <div className="flex items-center justify-between py-2 border-b-2 border-gray-200">
                        <span className="font-bold text-gray-900">{category}</span>
                        <span className="font-bold text-gray-900">{formatAmount(categoryTotal)}</span>
                      </div>
                      
                      {/* Элементы категории */}
                      <div className="space-y-1.5 pl-3">
                        {items.map(expense => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg flex-shrink-0">{expense.is_cash ? '💵' : '💳'}</span>
                              <div className="min-w-0">
                                {expense.description && (
                                  <div className="text-sm text-gray-700 truncate">{expense.description}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-semibold text-red-600">{formatAmount(expense.amount)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(expense)}
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модалка финансовой сводки */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Финансовая сводка</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <div className="text-sm text-green-700 font-medium mb-1">Доход из контракта</div>
                <div className="text-4xl font-bold text-green-700">{formatAmount(income)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-5">
                <div className="text-sm text-red-700 font-medium mb-1">Расходы всего</div>
                <div className="text-4xl font-bold text-red-700">{formatAmount(totalExpenses)}</div>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-red-600">💳 Безнал: {formatAmount(bankExpenses)}</span>
                  <span className="text-red-600">💵 Наличка: {formatAmount(cashExpenses)}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="text-sm text-blue-700 font-medium mb-1">Прибыль</div>
                <div className={cn("text-4xl font-bold", profit > 0 ? "text-blue-700" : "text-red-700")}>
                  {formatAmount(profit)}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
                <div className="text-sm text-orange-700 font-medium mb-1">Налог УСН (7%)</div>
                <div className="text-4xl font-bold text-orange-700">{formatAmount(tax)}</div>
                <div className="text-sm text-orange-600 mt-2">База: {formatAmount(taxableProfit)}</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
                <div className="text-sm text-purple-700 font-medium mb-1">Чистая прибыль</div>
                <div className={cn("text-4xl font-bold", netProfit > 0 ? "text-green-700" : "text-red-700")}>
                  {formatAmount(netProfit)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка документов */}
      {documentsModalOpen && (
        <TenderDocumentsModal
          open={documentsModalOpen}
          onOpenChange={setDocumentsModalOpen}
          tenderId={tender.id}
        tenderName={tender.name}
          documentType={selectedDocType}
        />
      )}
    </div>
  );
}
