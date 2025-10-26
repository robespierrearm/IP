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

  const buildPdf = async () => {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;background:#fff;color:#111827;font-family:Arial;font-size:12px;padding:24px;border:1px solid #e5e7eb;';
    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:16px;margin-bottom:8px;';
    title.textContent = `TenderCRM — Отчёт: ${tender.name}`;
    container.appendChild(title);
    const dateEl = document.createElement('div');
    dateEl.style.cssText = 'color:#374151;margin-bottom:16px;';
    dateEl.textContent = `Дата: ${new Date().toLocaleDateString('ru-RU')}`;
    container.appendChild(dateEl);
    const sTable = document.createElement('table');
    sTable.style.cssText = 'width:100%;border-collapse:collapse;border:1px solid #e5e7eb;margin-bottom:16px;';
    sTable.innerHTML = '<thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Показатель</th><th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Значение</th></tr></thead><tbody>' +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Доход</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.income)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Расходы (безнал)</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.bankExpenses)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Расходы (наличка)</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.cashExpenses)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Расходы всего</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.totalExpenses)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Прибыль</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.profit)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">Налог УСН (7%)</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(formattedSummary.tax)}</td></tr>` +
      `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;"><strong>Чистая прибыль</strong></td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;"><strong>${fmt(formattedSummary.netProfit)}</strong></td></tr>` +
      '</tbody>';
    container.appendChild(sTable);
    const h4 = document.createElement('div');
    h4.style.cssText = 'font-weight:600;margin-bottom:8px;';
    h4.textContent = 'Детализация расходов';
    container.appendChild(h4);
    const eTable = document.createElement('table');
    eTable.style.cssText = 'width:100%;border-collapse:collapse;border:1px solid #e5e7eb;';
    let eRows = '<thead><tr style="background:#f9fafb;"><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Тип</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Категория</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Описание</th><th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Сумма</th></tr></thead><tbody>';
    expenses.forEach((e) => {
      eRows += `<tr><td style="padding:8px;border-top:1px solid #e5e7eb;">${e.is_cash ? 'Наличка' : 'Безнал'}</td><td style="padding:8px;border-top:1px solid #e5e7eb;">${e.category}</td><td style="padding:8px;border-top:1px solid #e5e7eb;">${e.description || '—'}</td><td style="padding:8px;border-top:1px solid #e5e7eb;text-align:right;">${fmt(e.amount)}</td></tr>`;
    });
    eRows += '</tbody>';
    eTable.innerHTML = eRows;
    container.appendChild(eTable);
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#fff', onclone: (clonedDoc) => { clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.parentNode?.removeChild(el)); (clonedDoc.documentElement as HTMLElement).style.backgroundColor = '#fff'; (clonedDoc.body as HTMLElement).style.backgroundColor = '#fff'; } });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > pageHeight - 80) { const w = ((pageHeight - 80) * canvas.width) / canvas.height; doc.addImage(imgData, 'PNG', 40, 40, w, pageHeight - 80); } else { doc.addImage(imgData, 'PNG', 40, 40, imgWidth, imgHeight); }
    } finally { container.remove(); }
    return doc;
  };

  const handleDownloadPdf = async () => {
    try {
      const doc = await buildPdf();
      doc.save(`Отчет_${tender.name}.pdf`);
    } catch (e) { alert('Не удалось скачать PDF'); }
  };

  const handleSharePdf = async () => {
    setIsSharing(true);
    try {
      const doc = await buildPdf();
      const blob = doc.output('blob');
      const file = new File([blob], `Отчет_${tender.name}.pdf`, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Финансовая сводка — ${tender.name}`, text: 'Финансовая сводка' });
      } else { alert('Браузер не поддерживает "Поделиться"'); }
    } catch (e) { alert('Не удалось отправить'); } finally { setIsSharing(false); }
  };

  const saveExpense = async () => {
    if (!formData.category.trim() || !formData.amount) return;
    if (editingId) {
      await supabase.from('expenses').update({ category: formData.category, amount: parseFloat(formData.amount), description: formData.description, is_cash: formData.is_cash }).eq('id', editingId);
      setEditingId(null);
      setAddingNew(false);
    } else {
      await supabase.from('expenses').insert([{ tender_id: tender.id, category: formData.category, amount: parseFloat(formData.amount), description: formData.description, is_cash: formData.is_cash }]);
      // НЕ закрываем форму, только очищаем поля
    }
    setFormData({ category: '', amount: '', description: '', is_cash: false });
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
    <>
      {/* КАРТОЧКА - ОБЫЧНАЯ КОГДА ЗАКРЫТА, СТЕКЛЯННАЯ КОГДА ОТКРЫТА */}
      <div className={cn(
        "rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all",
        isOpen 
          ? "backdrop-blur-xl bg-white/60 border border-white/30" 
          : "bg-white border border-gray-200"
      )}>
        {/* ЗАГОЛОВОК - ОБЫЧНЫЙ */}
        <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-900">{tender.name}</h3>
            <PlatformButton link={tender.link} />
            <span className={cn("text-sm font-semibold px-3 py-1 rounded-lg", 
              netProfit > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
              {fmt(netProfit)}
            </span>
          </div>
          <div>{isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}</div>
        </button>

        {/* СОДЕРЖИМОЕ - СТЕКЛЯННОЕ */}
        {isOpen && (
          <div className="border-t border-white/30 bg-gradient-to-b from-white/30 to-white/20 p-5">
            <div className="grid grid-cols-2 gap-4">
              {/* ЛЕВАЯ КОЛОНКА - ФИНАНСЫ */}
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
                  <div className="border-t border-white/30 pt-2 mt-2">
                    <div className="flex justify-between mb-1"><span className="text-gray-700 font-medium">Расходы:</span></div>
                    <div className="flex justify-between text-xs pl-3"><span className="text-gray-600">💳 Безнал:</span><span className="text-gray-700">{fmt(bankExpenses)}</span></div>
                    <div className="flex justify-between text-xs pl-3"><span className="text-gray-600">💵 Наличка:</span><span className="text-gray-700">{fmt(cashExpenses)}</span></div>
                    <div className="flex justify-between text-xs pl-3"><span className="text-gray-600">🏛️ Налог УСН 7%:</span><span className="text-orange-700">{fmt(tax)}</span></div>
                    <div className="flex justify-between text-xs pl-3 pt-1 border-t border-white/20 mt-1"><span className="text-gray-700 font-medium">Всего расходов:</span><span className="font-semibold text-red-700">{fmt(totalExpenses + tax)}</span></div>
                  </div>
                  <div className="border-t border-white/30 pt-2 flex justify-between"><span className="font-bold text-gray-900">Чистая прибыль:</span><span className={cn("font-bold text-lg", netProfit > 0 ? "text-green-700" : "text-red-700")}>{fmt(netProfit)}</span></div>
                </div>
              </div>

              {/* ПРАВАЯ КОЛОНКА - ТАБЛИЦА РАСХОДОВ */}
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
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.is_cash}
                                onChange={(e) => setFormData({ ...formData, is_cash: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300"
                              />
                              <span className="text-xs text-gray-700">Нал</span>
                            </label>
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
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.is_cash}
                                  onChange={(e) => setFormData({ ...formData, is_cash: e.target.checked })}
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <span className="text-xs text-gray-700">Нал</span>
                              </label>
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
      </div>

      {/* МОДАЛКА ФИНАНСОВОЙ СВОДКИ - FIXED ПОВЕРХ ВСЕГО */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ position: 'fixed' }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsModalOpen(false)} />
          <div ref={modalRef} className="relative backdrop-blur-2xl bg-white/95 border border-white/40 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Финансовая сводка — {tender.name}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"><span className="text-gray-700">Доход</span><span className="font-semibold text-green-600">{fmt(formattedSummary.income)}</span></div>
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3"><span className="text-gray-700">Расходы</span><span className="font-semibold text-red-600">{fmt(formattedSummary.totalExpenses)}</span></div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"><span className="text-gray-600">💳 Безнал</span><span className="font-medium text-gray-700">{fmt(formattedSummary.bankExpenses)}</span></div>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"><span className="text-gray-600">💵 Наличка</span><span className="font-medium text-gray-700">{fmt(formattedSummary.cashExpenses)}</span></div>
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"><span className="text-gray-700">Прибыль</span><span className={cn('font-semibold', formattedSummary.profit > 0 ? 'text-green-600' : 'text-red-600')}>{fmt(formattedSummary.profit)}</span></div>
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg p-3"><span className="text-gray-700">Налог УСН (7%)</span><span className="font-semibold text-orange-600">{fmt(formattedSummary.tax)}</span></div>
                <div className="col-span-2 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3"><span className="font-semibold text-gray-900">Чистая прибыль</span><span className={cn('font-bold', formattedSummary.netProfit > 0 ? 'text-green-700' : 'text-red-700')}>{fmt(formattedSummary.netProfit)}</span></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Детализация расходов</h4>
                {expenses.length === 0 ? <p className="text-sm text-gray-500">Расходы не добавлены</p> : (
                  <div className="max-h-64 overflow-auto bg-white border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left p-2 text-gray-700">Тип</th>
                          <th className="text-left p-2 text-gray-700">Категория</th>
                          <th className="text-left p-2 text-gray-700">Описание</th>
                          <th className="text-right p-2 text-gray-700">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id} className="border-t border-gray-100">
                            <td className="p-2">
                              <span className={cn("px-2 py-0.5 rounded text-xs font-medium", e.is_cash ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                                {e.is_cash ? '💵 Нал' : '💳 Безнал'}
                              </span>
                            </td>
                            <td className="p-2">{e.category}</td>
                            <td className="p-2 text-gray-600">{e.description || '—'}</td>
                            <td className="p-2 text-right font-medium">{fmt(e.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
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

      {/* МОДАЛКА ДОКУМЕНТОВ */}
      {documentsModalOpen && <TenderDocumentsModal open={documentsModalOpen} onOpenChange={setDocumentsModalOpen} tenderId={tender.id} tenderName={tender.name} documentType={selectedDocType} />}
    </>
  );
}
