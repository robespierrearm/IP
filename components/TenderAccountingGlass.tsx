'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Tender, Expense, ExpenseInsert, supabase, DocumentType } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit, BarChart3, FileText, Receipt, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { PlatformButton } from '@/components/PlatformButton';

interface Props {
  tender: Tender;
  expenses: Expense[];
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

// ВАРИАНТ 1: GLASSMORPHISM - СТЕКЛЯННЫЙ СТИЛЬ
export function TenderAccountingGlass({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
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

  return (
    <div className="relative group">
      {/* СТЕКЛЯННАЯ КАРТОЧКА */}
      <div className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden transition-all hover:shadow-2xl hover:shadow-gray-300/50">
        {/* ЗАГОЛОВОК - градиентный оверлей */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-5 flex items-center justify-between hover:bg-white/30 transition-all relative overflow-hidden group"
        >
          {/* Градиентный акцент */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex-1 text-left relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-lg text-gray-900">{tender.name}</h3>
              <PlatformButton link={tender.link} />
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Доход:</span>
                <span className="font-semibold text-green-600">{formatAmount(income)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Расходы:</span>
                <span className="font-semibold text-red-600">{formatAmount(totalExpenses)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Чистая:</span>
                <span className={cn("font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
                  {formatAmount(netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="ml-4 relative z-10">
            {isOpen ? (
              <ChevronUp className="h-6 w-6 text-gray-400" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-400" />
            )}
          </div>
        </button>

        {/* РАСКРЫВАЮЩЕЕСЯ СОДЕРЖИМОЕ */}
        {isOpen && (
          <div className="border-t border-white/20 bg-gradient-to-b from-white/20 to-white/40 p-5 space-y-4">
            {/* КНОПКИ ДЕЙСТВИЙ - стеклянные */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 backdrop-blur-xl bg-indigo-500/20 border border-indigo-300/30 rounded-xl text-indigo-700 font-medium hover:bg-indigo-500/30 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Финансовая сводка</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedDocType('тендерная документация');
                  setDocumentsModalOpen(true);
                }}
                className="px-4 py-2.5 backdrop-blur-xl bg-blue-500/20 border border-blue-300/30 rounded-xl text-blue-700 font-medium hover:bg-blue-500/30 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10"
              >
                <FileText className="h-4 w-4" />
                <span>Тендерная документация</span>
                {materialCounts['тендерная документация'] > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                    {materialCounts['тендерная документация']}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setSelectedDocType('закрывающие документы');
                  setDocumentsModalOpen(true);
                }}
                className="px-4 py-2.5 backdrop-blur-xl bg-green-500/20 border border-green-300/30 rounded-xl text-green-700 font-medium hover:bg-green-500/30 transition-all flex items-center gap-2 shadow-lg shadow-green-500/10"
              >
                <Receipt className="h-4 w-4" />
                <span>Закрывающие документы</span>
                {materialCounts['закрывающие документы'] > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                    {materialCounts['закрывающие документы']}
                  </span>
                )}
              </button>
            </div>

            {/* ФИНАНСОВЫЙ БЛОК - стеклянная карточка */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/60 to-white/40 border border-white/30 rounded-xl p-4 shadow-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Доход:</span>
                    <span className="font-semibold text-green-700">{formatAmount(income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Расходы всего:</span>
                    <span className="font-semibold text-red-700">{formatAmount(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs pl-3">
                    <span className="text-gray-600">💳 Безнал:</span>
                    <span className="text-gray-700">{formatAmount(bankExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs pl-3">
                    <span className="text-gray-600">💵 Наличка:</span>
                    <span className="text-gray-700">{formatAmount(cashExpenses)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Прибыль:</span>
                    <span className={cn("font-semibold", profit > 0 ? "text-green-700" : "text-red-700")}>
                      {formatAmount(profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Налог УСН (7%):</span>
                    <span className="font-semibold text-orange-700">{formatAmount(tax)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/30">
                    <span className="font-bold text-gray-900">Чистая прибыль:</span>
                    <span className={cn("font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
                      {formatAmount(netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* РАСХОДЫ - стеклянная карточка */}
            <div className="backdrop-blur-xl bg-white/50 border border-white/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">Расходы</h4>
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
                  className="backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {isAddingExpense ? 'Отмена' : 'Добавить'}
                </Button>
              </div>

              {/* Форма добавления */}
              {isAddingExpense && (
                <div className="mb-4 p-4 backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 border border-white/40 rounded-xl space-y-3 shadow-lg">
                  {editingExpense && (
                    <div className="text-sm text-blue-700 font-semibold">✏️ Редактирование расхода</div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="category" className="text-gray-700">Категория</Label>
                      <Input
                        id="category"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        placeholder="Например: Материалы"
                        className="backdrop-blur-xl bg-white/60 border-white/40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-gray-700">Сумма (₽)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        className="backdrop-blur-xl bg-white/60 border-white/40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-gray-700">Описание</Label>
                      <Input
                        id="description"
                        value={newExpense.description || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        placeholder="Опционально"
                        className="backdrop-blur-xl bg-white/60 border-white/40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_cash"
                      checked={newExpense.is_cash}
                      onChange={(e) => setNewExpense({ ...newExpense, is_cash: e.target.checked })}
                      className="h-4 w-4 rounded border-white/40"
                    />
                    <Label htmlFor="is_cash" className="cursor-pointer text-gray-700">
                      💵 Наличка (не учитывается в УСН)
                    </Label>
                  </div>
                  <Button 
                    onClick={editingExpense ? handleUpdateExpense : handleAddExpense} 
                    size="sm" 
                    className="w-full backdrop-blur-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 text-white shadow-lg"
                  >
                    {editingExpense ? 'Обновить расход' : 'Сохранить расход'}
                  </Button>
                </div>
              )}

              {/* Список расходов */}
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Расходы не добавлены</p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="backdrop-blur-xl bg-white/60 border border-white/30 rounded-lg p-3 hover:bg-white/80 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-xl">{expense.is_cash ? '💵' : '💳'}</span>
                          <div>
                            <div className="font-semibold text-gray-900">{expense.category}</div>
                            {expense.description && (
                              <div className="text-sm text-gray-600">{expense.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-600">{formatAmount(expense.amount)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(expense)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t border-white/30 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Итого расходов:</span>
                      <span className="text-red-600">{formatAmount(totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>💳 Безнал:</span>
                      <span>{formatAmount(bankExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>💵 Наличка:</span>
                      <span>{formatAmount(cashExpenses)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Модалка финансовой сводки */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative backdrop-blur-2xl bg-white/80 border border-white/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Финансовая сводка</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 border border-white/40 rounded-xl p-4">
                <div className="text-sm text-green-700 mb-1">Доход из контракта</div>
                <div className="text-3xl font-bold text-green-700">{formatAmount(income)}</div>
              </div>
              
              <div className="backdrop-blur-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 border border-white/40 rounded-xl p-4">
                <div className="text-sm text-red-700 mb-1">Расходы всего</div>
                <div className="text-3xl font-bold text-red-700">{formatAmount(totalExpenses)}</div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-red-600">💳 Безнал: {formatAmount(bankExpenses)}</span>
                  <span className="text-red-600">💵 Наличка: {formatAmount(cashExpenses)}</span>
                </div>
              </div>
              
              <div className="backdrop-blur-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-white/40 rounded-xl p-4">
                <div className="text-sm text-blue-700 mb-1">Прибыль</div>
                <div className={cn("text-3xl font-bold", profit > 0 ? "text-blue-700" : "text-red-700")}>
                  {formatAmount(profit)}
                </div>
              </div>
              
              <div className="backdrop-blur-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 border border-white/40 rounded-xl p-4">
                <div className="text-sm text-orange-700 mb-1">Налог УСН (7%)</div>
                <div className="text-3xl font-bold text-orange-700">{formatAmount(tax)}</div>
              </div>
              
              <div className="backdrop-blur-xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 border border-white/40 rounded-xl p-4">
                <div className="text-sm text-purple-700 mb-1">Чистая прибыль</div>
                <div className={cn("text-3xl font-bold", netProfit > 0 ? "text-green-700" : "text-red-700")}>
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
