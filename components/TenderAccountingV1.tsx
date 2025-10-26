'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Tender, Expense, supabase, DocumentType } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Trash2, Edit, BarChart3, FileText, Receipt, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TenderDocumentsModal } from '@/components/TenderDocumentsModal';
import { PlatformButton } from '@/components/PlatformButton';

interface Props { tender: Tender; expenses: Expense[]; onExpenseAdded: () => void; onExpenseDeleted: () => void; }

export function TenderAccountingV1({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('тендерная документация');
  const [materialCounts, setMaterialCounts] = useState({ 'тендерная документация': 0, 'закрывающие документы': 0 });
  const [formData, setFormData] = useState({ category: '', amount: '', description: '', is_cash: false });
  const modalRef = useRef<HTMLDivElement>(null);

  const income = tender.win_price || 0;
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const bankExpenses = expenses.filter(exp => !exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const cashExpenses = expenses.filter(exp => exp.is_cash).reduce((sum, exp) => sum + exp.amount, 0);
  const profit = income - totalExpenses;
  const taxableProfit = income - bankExpenses;
  const tax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const netProfit = profit - tax;

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);

  const formattedSummary = useMemo(() => ({ income, totalExpenses, bankExpenses, cashExpenses, profit, tax, netProfit }), 
    [income, totalExpenses, bankExpenses, cashExpenses, profit, tax, netProfit]);

  useEffect(() => {
    const loadCounts = async () => {
      const { data } = await supabase.from('files').select('document_type').eq('tender_id', tender.id);
      if (data) setMaterialCounts({ 
        'тендерная документация': data.filter(f => f.document_type === 'тендерная документация').length, 
        'закрывающие документы': data.filter(f => f.document_type === 'закрывающие документы').length 
      });
    };
    loadCounts();
  }, [tender.id]);

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tender, expenses, summary: formattedSummary }) });
      if (!res.ok) throw new Error('Ошибка');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Сводка_${tender.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) { alert('Не удалось скачать PDF'); }
  };

  const handleSharePdf = async () => {
    setIsSharing(true);
    try {
      const res = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tender, expenses, summary: formattedSummary }) });
      if (!res.ok) throw new Error('Ошибка');
      const blob = await res.blob();
      const file = new File([blob], `Сводка_${tender.name}.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Финансовая сводка — ${tender.name}`, text: 'Финансовая сводка' });
      } else { alert('Браузер не поддерживает "Поделиться"'); }
    } catch (e) { alert('Не удалось отправить'); } finally { setIsSharing(false); }
  };

  const saveExpense = async () => {
    if (!formData.category.trim() || !formData.amount) return;
    if (editingId) {
      await supabase.from('expenses').update({ category: formData.category, amount: parseFloat(formData.amount), description: formData.description, is_cash: formData.is_cash }).eq('id', editingId);
    } else {
      await supabase.from('expenses').insert([{ tender_id: tender.id, category: formData.category, amount: parseFloat(formData.amount), description: formData.description, is_cash: formData.is_cash }]);
    }
    setFormData({ category: '', amount: '', description: '', is_cash: false });
    setEditingId(null);
    setAddingNew(false);
    onExpenseAdded();
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({ category: expense.category, amount: expense.amount.toString(), description: expense.description || '', is_cash: expense.is_cash || false });
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    onExpenseDeleted();
  };

  return (
    <div className="backdrop-blur-xl bg-white/60 border border-white/30 rounded-2xl shadow-lg overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/40 transition-all relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3 relative z-10">
          <h3 className="font-bold text-gray-900">{tender.name}</h3>
          <PlatformButton link={tender.link} />
          <span className={cn("text-sm font-semibold px-3 py-1 rounded-lg backdrop-blur-sm", netProfit > 0 ? "bg-green-500/20 text-green-700 border border-green-300/30" : "bg-red-500/20 text-red-700 border border-red-300/30")}>
            {fmt(netProfit)}
          </span>
        </div>
        <div className="relative z-10">{isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}</div>
      </button>

      {isOpen && (
        <div className="border-t border-white/30 bg-gradient-to-b from-white/30 to-white/20 p-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(true)} className="flex-1 px-3 py-2 backdrop-blur-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-300/30 rounded-xl text-indigo-700 text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-lg">
                  <BarChart3 className="h-4 w-4" />Сводка
                </button>
                <button onClick={() => { setSelectedDocType('тендерная документация'); setDocumentsModalOpen(true); }} className="flex-1 px-3 py-2 backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 rounded-xl text-blue-700 text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-lg">
                  <FileText className="h-4 w-4" />Док{materialCounts['тендерная документация'] > 0 && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{materialCounts['тендерная документация']}</span>}
                </button>
                <button onClick={() => { setSelectedDocType('закрывающие документы'); setDocumentsModalOpen(true); }} className="flex-1 px-3 py-2 backdrop-blur-xl bg-green-500/20 hover:bg-green-500/30 border border-green-300/30 rounded-xl text-green-700 text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-lg">
                  <Receipt className="h-4 w-4" />Закр{materialCounts['закрывающие документы'] > 0 && <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">{materialCounts['закрывающие документы']}</span>}
                </button>
              </div>
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/70 to-white/50 border border-white/40 rounded-xl p-4 shadow-lg space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-700">Доход:</span><span className="font-semibold text-green-700">{fmt(income)}</span></div>
                <div className="flex justify-between"><span className="text-gray-700">Расходы:</span><span className="font-semibold text-red-700">{fmt(totalExpenses)}</span></div>
                <div className="flex justify-between text-xs pl-3"><span className="text-gray-600">💳 Безнал:</span><span className="text-gray-700">{fmt(bankExpenses)}</span></div>
                <div className="flex justify-between text-xs pl-3"><span className="text-gray-600">💵 Наличка:</span><span className="text-gray-700">{fmt(cashExpenses)}</span></div>
                <div className="border-t border-white/30 pt-2 flex justify-between"><span className="text-gray-700">Прибыль:</span><span className={cn("font-semibold", profit > 0 ? "text-green-700" : "text-red-700")}>{fmt(profit)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-600">УСН 7%:</span><span className="text-orange-700">{fmt(tax)}</span></div>
                <div className="border-t border-white/30 pt-2 flex justify-between"><span className="font-bold text-gray-900">Чистая:</span><span className={cn("font-bold", netProfit > 0 ? "text-green-700" : "text-red-700")}>{fmt(netProfit)}</span></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Расходы ({expenses.length})</h4>
                <Button onClick={() => { setAddingNew(!addingNew); setEditingId(null); setFormData({ category: '', amount: '', description: '', is_cash: false }); }} size="sm" className="backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-300/30 text-blue-700">
                  {addingNew ? 'Отмена' : '+ Добавить'}
                </Button>
              </div>
              <div className="backdrop-blur-xl bg-white/50 border border-white/40 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-sm">
                  <thead className="backdrop-blur-xl bg-white/60 border-b border-white/40">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-gray-700">Тип</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-700">Категория</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-700">Сумма</th>
                      <th className="text-right px-3 py-2 font-medium text-gray-700 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {addingNew && (
                      <tr className="backdrop-blur-xl bg-blue-500/10 border-b border-blue-300/30">
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => setFormData({ ...formData, is_cash: false })} className={cn("px-2 py-1 text-xs rounded transition-all", !formData.is_cash ? "bg-blue-500 text-white shadow-sm" : "bg-white/50 text-gray-600 hover:bg-white/80")}>💳</button>
                            <button onClick={() => setFormData({ ...formData, is_cash: true })} className={cn("px-2 py-1 text-xs rounded transition-all", formData.is_cash ? "bg-green-500 text-white shadow-sm" : "bg-white/50 text-gray-600 hover:bg-white/80")}>💵</button>
                          </div>
                        </td>
                        <td className="px-3 py-2"><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Категория" className="h-8 text-sm backdrop-blur-xl bg-white/60" /></td>
                        <td className="px-3 py-2"><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0" className="h-8 text-sm text-right backdrop-blur-xl bg-white/60" /></td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            <button onClick={saveExpense} className="p-1 hover:bg-green-100 rounded text-green-600"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setAddingNew(false)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {expenses.length === 0 ? <tr><td colSpan={4} className="text-center py-6 text-gray-500">Нет расходов</td></tr> : expenses.map((expense) => (
                      editingId === expense.id ? (
                        <tr key={expense.id} className="backdrop-blur-xl bg-yellow-500/10 border-b border-yellow-300/30">
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button onClick={() => setFormData({ ...formData, is_cash: false })} className={cn("px-2 py-1 text-xs rounded", !formData.is_cash ? "bg-blue-500 text-white" : "bg-white/50 text-gray-600")}>💳</button>
                              <button onClick={() => setFormData({ ...formData, is_cash: true })} className={cn("px-2 py-1 text-xs rounded", formData.is_cash ? "bg-green-500 text-white" : "bg-white/50 text-gray-600")}>💵</button>
                            </div>
                          </td>
                          <td className="px-3 py-2"><Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="h-8 text-sm backdrop-blur-xl bg-white/60" /></td>
                          <td className="px-3 py-2"><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="h-8 text-sm text-right backdrop-blur-xl bg-white/60" /></td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button onClick={saveExpense} className="p-1 hover:bg-green-100 rounded text-green-600"><Check className="h-4 w-4" /></button>
                              <button onClick={() => { setEditingId(null); setFormData({ category: '', amount: '', description: '', is_cash: false }); }} className="p-1 hover:bg-gray-100 rounded text-gray-600"><X className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={expense.id} className="border-b border-white/20 hover:bg-white/30 transition-colors">
                          <td className="px-3 py-2"><span className={cn("px-2 py-1 rounded text-xs font-medium", expense.is_cash ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{expense.is_cash ? '💵 Нал' : '💳 Безнал'}</span></td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">{expense.category}</div>
                            {expense.description && <div className="text-xs text-gray-600">{expense.description}</div>}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-red-600">{fmt(expense.amount)}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => startEdit(expense)} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => deleteExpense(expense.id)} className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                    {expenses.length > 0 && (
                      <tr className="backdrop-blur-xl bg-white/70 border-t-2 border-white/50 font-semibold">
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 text-gray-900">ИТОГО</td>
                        <td className="px-3 py-2 text-right text-red-700">{fmt(totalExpenses)}</td>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div ref={modalRef} className="relative backdrop-blur-2xl bg-white/90 border border-white/40 rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Финансовая сводка — {tender.name}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between backdrop-blur-xl bg-green-50/80 border border-green-200/50 rounded-lg p-3"><span className="text-gray-700">Доход</span><span className="font-semibold text-green-600">{fmt(formattedSummary.income)}</span></div>
                <div className="flex items-center justify-between backdrop-blur-xl bg-red-50/80 border border-red-200/50 rounded-lg p-3"><span className="text-gray-700">Расходы</span><span className="font-semibold text-red-600">{fmt(formattedSummary.totalExpenses)}</span></div>
                <div className="flex items-center justify-between backdrop-blur-xl bg-gray-50/80 border border-gray-200/50 rounded-lg p-3 text-sm"><span className="text-gray-600">💳 Безнал</span><span className="font-medium text-gray-700">{fmt(formattedSummary.bankExpenses)}</span></div>
                <div className="flex items-center justify-between backdrop-blur-xl bg-gray-50/80 border border-gray-200/50 rounded-lg p-3 text-sm"><span className="text-gray-600">💵 Наличка</span><span className="font-medium text-gray-700">{fmt(formattedSummary.cashExpenses)}</span></div>
                <div className="flex items-center justify-between backdrop-blur-xl bg-blue-50/80 border border-blue-200/50 rounded-lg p-3"><span className="text-gray-700">Прибыль</span><span className={cn('font-semibold', formattedSummary.profit > 0 ? 'text-green-600' : 'text-red-600')}>{fmt(formattedSummary.profit)}</span></div>
                <div className="flex items-center justify-between backdrop-blur-xl bg-orange-50/80 border border-orange-200/50 rounded-lg p-3"><span className="text-gray-700">Налог УСН (7%)</span><span className="font-semibold text-orange-600">{fmt(formattedSummary.tax)}</span></div>
                <div className="col-span-2 flex items-center justify-between backdrop-blur-xl bg-gradient-to-r from-purple-50/80 to-pink-50/80 border border-purple-200/50 rounded-lg p-3"><span className="font-semibold text-gray-900">Чистая прибыль</span><span className={cn('font-bold', formattedSummary.netProfit > 0 ? 'text-green-700' : 'text-red-700')}>{fmt(formattedSummary.netProfit)}</span></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Детализация расходов</h4>
                {expenses.length === 0 ? <p className="text-sm text-gray-500">Расходы не добавлены</p> : (
                  <div className="max-h-64 overflow-auto backdrop-blur-xl bg-white/50 border border-white/40 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="backdrop-blur-xl bg-white/70 border-b border-white/40"><tr><th className="text-left p-2 text-gray-700">Тип</th><th className="text-left p-2 text-gray-700">Категория</th><th className="text-left p-2 text-gray-700">Описание</th><th className="text-right p-2 text-gray-700">Сумма</th></tr></thead>
                      <tbody>{expenses.map((e) => (<tr key={e.id} className="border-t border-white/20"><td className="p-2"><span className={cn("px-2 py-0.5 rounded text-xs font-medium", e.is_cash ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{e.is_cash ? '💵' : '💳'}</span></td><td className="p-2">{e.category}</td><td className="p-2 text-gray-600">{e.description || '—'}</td><td className="p-2 text-right font-medium">{fmt(e.amount)}</td></tr>))}</tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button onClick={handleDownloadPdf} variant="default">Скачать PDF</Button>
                <Button onClick={handleSharePdf} variant="outline" disabled={isSharing}>{isSharing ? 'Подготовка…' : 'Переслать'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {documentsModalOpen && <TenderDocumentsModal open={documentsModalOpen} onOpenChange={setDocumentsModalOpen} tenderId={tender.id} tenderName={tender.name} documentType={selectedDocType} />}
    </div>
  );
}
