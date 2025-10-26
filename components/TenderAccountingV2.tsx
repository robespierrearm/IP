'use client';

import { useMemo, useState, useEffect } from 'react';
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

// ВАРИАНТ 2: КАК ОРИГИНАЛ, НО КОМПАКТНЫЙ И УДОБНЫЙ
export function TenderAccountingV2({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* ЗАГОЛОВОК - КОМПАКТНЫЙ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{tender.name}</h3>
            <PlatformButton link={tender.link} />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>💰 {formatAmount(income)}</span>
            <span className="text-red-600">📉 {formatAmount(totalExpenses)}</span>
            <span className={cn("font-semibold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
              ✓ {formatAmount(netProfit)}
            </span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {/* СОДЕРЖИМОЕ - КОМПАКТНОЕ */}
      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          {/* КНОПКИ - В ОДНУ СТРОКУ КОМПАКТНО */}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsModalOpen(true)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Сводка
            </Button>
            
            <Button
              onClick={() => {
                setSelectedDocType('тендерная документация');
                setDocumentsModalOpen(true);
              }}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              Документы
              {materialCounts['тендерная документация'] > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {materialCounts['тендерная документация']}
                </span>
              )}
            </Button>
            
            <Button
              onClick={() => {
                setSelectedDocType('закрывающие документы');
                setDocumentsModalOpen(true);
              }}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Receipt className="h-4 w-4 mr-1" />
              Закрывающие
              {materialCounts['закрывающие документы'] > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {materialCounts['закрывающие документы']}
                </span>
              )}
            </Button>
          </div>

          {/* ФИНАНСЫ - КОМПАКТНО В 2 КОЛОНКИ */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Доход:</span>
                <span className="font-semibold text-green-600">{formatAmount(income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Расходы:</span>
                <span className="font-semibold text-red-600">{formatAmount(totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pl-2">
                <span>💳 Безнал:</span>
                <span>{formatAmount(bankExpenses)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 pl-2">
                <span>💵 Наличка:</span>
                <span>{formatAmount(cashExpenses)}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">Прибыль:</span>
                <span className={cn("font-semibold", profit > 0 ? "text-green-600" : "text-red-600")}>
                  {formatAmount(profit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">УСН 7%:</span>
                <span className="font-semibold text-orange-600">{formatAmount(tax)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="font-bold text-gray-900">Чистая:</span>
                <span className={cn("font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
                  {formatAmount(netProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* РАСХОДЫ - КОМПАКТНО */}
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Расходы</h4>
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
                variant={isAddingExpense ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddingExpense ? 'Отмена' : 'Добавить'}
              </Button>
            </div>

            {/* ФОРМА - КОМПАКТНАЯ В 3 КОЛОНКИ */}
            {isAddingExpense && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                {editingExpense && (
                  <div className="text-sm text-blue-700 font-medium">✏️ Редактирование</div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    placeholder="Категория"
                    className="h-9"
                  />
                  <Input
                    type="number"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Сумма"
                    className="h-9"
                  />
                  <Input
                    value={newExpense.description || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Описание"
                    className="h-9"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newExpense.is_cash}
                      onChange={(e) => setNewExpense({ ...newExpense, is_cash: e.target.checked })}
                      className="h-4 w-4 rounded"
                    />
                    💵 Наличка
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

            {/* СПИСОК - КОМПАКТНЫЙ */}
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Расходы не добавлены</p>
            ) : (
              <div className="space-y-1.5">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-base flex-shrink-0">{expense.is_cash ? '💵' : '💳'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-gray-900">{expense.category}</div>
                        {expense.description && (
                          <div className="text-xs text-gray-600">{expense.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-red-600 text-sm">{formatAmount(expense.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(expense)}
                        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* ИТОГО - КОМПАКТНО */}
                <div className="pt-2 mt-2 border-t border-gray-200 space-y-1 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span>Итого:</span>
                    <span className="text-red-600">{formatAmount(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>💳 {formatAmount(bankExpenses)}</span>
                    <span>💵 {formatAmount(cashExpenses)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модалка сводки */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-gray-900">Финансовая сводка</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Доход из контракта</div>
                <div className="text-3xl font-bold text-green-700">{formatAmount(income)}</div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Расходы всего</div>
                <div className="text-3xl font-bold text-red-700">{formatAmount(totalExpenses)}</div>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-red-600">💳 Безнал: {formatAmount(bankExpenses)}</span>
                  <span className="text-red-600">💵 Наличка: {formatAmount(cashExpenses)}</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Прибыль</div>
                <div className={cn("text-3xl font-bold", profit > 0 ? "text-blue-700" : "text-red-700")}>
                  {formatAmount(profit)}
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm text-orange-700 mb-1">Налог УСН (7%)</div>
                <div className="text-3xl font-bold text-orange-700">{formatAmount(tax)}</div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
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
