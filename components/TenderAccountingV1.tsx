'use client';

import { useMemo, useState, useEffect } from 'react';
import { Tender, Expense, ExpenseInsert, supabase, DocumentType } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Trash2, Edit, BarChart3, FileText, Receipt, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { PlatformButton } from '@/components/PlatformButton';

interface Props {
  tender: Tender;
  expenses: Expense[];
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

// ВАРИАНТ 1: SPLIT-VIEW с ТАБЛИЦЕЙ (совершенно другой подход)
export function TenderAccountingV1({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('тендерная документация');
  const [materialCounts, setMaterialCounts] = useState({
    'тендерная документация': 0,
    'закрывающие документы': 0,
  });
  const [formData, setFormData] = useState({ category: '', amount: '', description: '', is_cash: false });

  const income = tender.win_price || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const bankExpenses = expenses.filter(exp => !exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const cashExpenses = expenses.filter(exp => exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const profit = income - totalExpenses;
  const taxableProfit = income - bankExpenses;
  const tax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const netProfit = profit - tax;

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    const loadMaterialCounts = async () => {
      const { data } = await supabase.from('files').select('document_type').eq('tender_id', tender.id);
      if (data) {
        setMaterialCounts({
          'тендерная документация': data.filter(f => f.document_type === 'тендерная документация').length,
          'закрывающие документы': data.filter(f => f.document_type === 'закрывающие документы').length,
        });
      }
    };
    loadMaterialCounts();
  }, [tender.id]);

  const saveExpense = async () => {
    if (!formData.category.trim() || !formData.amount) return;
    
    if (editingId) {
      await supabase.from('expenses').update({
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        is_cash: formData.is_cash,
      }).eq('id', editingId);
    } else {
      await supabase.from('expenses').insert([{
        tender_id: tender.id,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        is_cash: formData.is_cash,
      }]);
    }
    
    setFormData({ category: '', amount: '', description: '', is_cash: false });
    setEditingId(null);
    setAddingNew(false);
    onExpenseAdded();
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description || '',
      is_cash: expense.is_cash || false,
    });
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    onExpenseDeleted();
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* ЗАГОЛОВОК */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900">{tender.name}</h3>
          <PlatformButton link={tender.link} />
          <span className={cn("text-sm font-semibold px-2 py-1 rounded", netProfit > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            {fmt(netProfit)}
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {/* СОДЕРЖИМОЕ - SPLIT VIEW */}
      {isOpen && (
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-12 gap-4 p-4">
            {/* ЛЕВАЯ ПАНЕЛЬ - ФИНАНСЫ (4 колонки) */}
            <div className="col-span-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium flex items-center justify-center gap-1"
                >
                  <BarChart3 className="h-3 w-3" />
                  Сводка
                </button>
                <button
                  onClick={() => { setSelectedDocType('тендерная документация'); setDocumentsModalOpen(true); }}
                  className="flex-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium flex items-center justify-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Док
                  {materialCounts['тендерная документация'] > 0 && (
                    <span className="ml-0.5 px-1 bg-blue-500 text-white text-xs rounded-full">{materialCounts['тендерная документация']}</span>
                  )}
                </button>
                <button
                  onClick={() => { setSelectedDocType('закрывающие документы'); setDocumentsModalOpen(true); }}
                  className="flex-1 px-2 py-2 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium flex items-center justify-center gap-1"
                >
                  <Receipt className="h-3 w-3" />
                  Закр
                  {materialCounts['закрывающие документы'] > 0 && (
                    <span className="ml-0.5 px-1 bg-green-500 text-white text-xs rounded-full">{materialCounts['закрывающие документы']}</span>
                  )}
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Доход:</span>
                  <span className="font-semibold text-green-600">{fmt(income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Расходы:</span>
                  <span className="font-semibold text-red-600">{fmt(totalExpenses)}</span>
                </div>
                <div className="flex justify-between text-xs pl-3">
                  <span className="text-gray-500">💳 Безнал:</span>
                  <span className="text-gray-600">{fmt(bankExpenses)}</span>
                </div>
                <div className="flex justify-between text-xs pl-3">
                  <span className="text-gray-500">💵 Наличка:</span>
                  <span className="text-gray-600">{fmt(cashExpenses)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-600">Прибыль:</span>
                  <span className={cn("font-semibold", profit > 0 ? "text-green-600" : "text-red-600")}>{fmt(profit)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">УСН 7%:</span>
                  <span className="text-orange-600">{fmt(tax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Чистая:</span>
                  <span className={cn("font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>{fmt(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* ПРАВАЯ ПАНЕЛЬ - ТАБЛИЦА РАСХОДОВ (8 колонок) */}
            <div className="col-span-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Расходы ({expenses.length})</h4>
                <Button
                  onClick={() => {
                    setAddingNew(!addingNew);
                    setEditingId(null);
                    setFormData({ category: '', amount: '', description: '', is_cash: false });
                  }}
                  size="sm"
                  variant={addingNew ? "outline" : "default"}
                >
                  {addingNew ? 'Отмена' : '+ Добавить'}
                </Button>
              </div>

              {/* ТАБЛИЦА */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-600 w-8"></th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Категория</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">Описание</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">Сумма</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ФОРМА ДОБАВЛЕНИЯ НОВОЙ СТРОКИ */}
                    {addingNew && (
                      <tr className="bg-blue-50 border-b border-blue-200">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={formData.is_cash}
                            onChange={(e) => setFormData({ ...formData, is_cash: e.target.checked })}
                            className="h-4 w-4 rounded"
                            title="Наличка"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Категория"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Описание"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0"
                            className="h-8 text-sm text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={saveExpense} className="p-1 hover:bg-green-100 rounded text-green-600" title="Сохранить">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setAddingNew(false)} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Отмена">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* СПИСОК РАСХОДОВ */}
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-gray-500">Нет расходов</td>
                      </tr>
                    ) : (
                      expenses.map((expense) => (
                        editingId === expense.id ? (
                          // РЕЖИМ РЕДАКТИРОВАНИЯ
                          <tr key={expense.id} className="bg-yellow-50 border-b border-yellow-200">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={formData.is_cash}
                                onChange={(e) => setFormData({ ...formData, is_cash: e.target.checked })}
                                className="h-4 w-4 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="h-8 text-sm text-right"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                <button onClick={saveExpense} className="p-1 hover:bg-green-100 rounded text-green-600">
                                  <Check className="h-4 w-4" />
                                </button>
                                <button onClick={() => { setEditingId(null); setFormData({ category: '', amount: '', description: '', is_cash: false }); }} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          // ОБЫЧНЫЙ ВИД
                          <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 text-center">{expense.is_cash ? '💵' : '💳'}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{expense.category}</td>
                            <td className="px-3 py-2 text-gray-600">{expense.description || '—'}</td>
                            <td className="px-3 py-2 text-right font-semibold text-red-600">{fmt(expense.amount)}</td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1 justify-end">
                                <button onClick={() => startEdit(expense)} className="p-1 hover:bg-blue-50 rounded text-blue-600">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button onClick={() => deleteExpense(expense.id)} className="p-1 hover:bg-red-50 rounded text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    )}

                    {/* ИТОГО */}
                    {expenses.length > 0 && (
                      <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2" colSpan={2}>ИТОГО</td>
                        <td className="px-3 py-2 text-right text-red-600">{fmt(totalExpenses)}</td>
                        <td className="px-3 py-2"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалки */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold mb-4">Финансовая сводка</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                <span>Доход:</span>
                <span className="font-bold text-green-600">{fmt(income)}</span>
              </div>
              <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                <span>Расходы:</span>
                <span className="font-bold text-red-600">{fmt(totalExpenses)}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span>Прибыль:</span>
                <span className={cn("font-bold", profit > 0 ? "text-blue-600" : "text-red-600")}>{fmt(profit)}</span>
              </div>
              <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                <span>УСН 7%:</span>
                <span className="font-bold text-orange-600">{fmt(tax)}</span>
              </div>
              <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                <span>Чистая:</span>
                <span className={cn("font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>{fmt(netProfit)}</span>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(false)} className="w-full mt-4">Закрыть</Button>
          </div>
        </div>
      )}

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
