'use client';

import { useMemo, useState } from 'react';
import { Tender, Expense, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tender: Tender;
  expenses: Expense[];
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

// ВАРИАНТ 2: МОЁ ВИДЕНИЕ - АКЦЕНТ НА ВАЖНОМ
export function TenderAccountingVariant2({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ category: '', amount: 0, description: '', is_cash: false });

  const income = tender.win_price || 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const bankExpenses = expenses.filter(e => !e.is_cash).reduce((sum, e) => sum + e.amount, 0);
  const cashExpenses = totalExpenses - bankExpenses;
  const profit = income - totalExpenses;
  const taxableProfit = income - bankExpenses;
  const tax = taxableProfit > 0 ? taxableProfit * 0.07 : 0;
  const netProfit = profit - tax;

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(n);
  const fmtShort = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}М` : n >= 1e3 ? `${(n/1e3).toFixed(0)}К` : n.toString();

  // Группировка по категориям
  const categories = useMemo(() => {
    const cats: Record<string, { total: number; items: Expense[] }> = {};
    expenses.forEach(e => {
      if (!cats[e.category]) cats[e.category] = { total: 0, items: [] };
      cats[e.category].total += e.amount;
      cats[e.category].items.push(e);
    });
    return Object.entries(cats).sort(([, a], [, b]) => b.total - a.total);
  }, [expenses]);

  const save = async () => {
    if (!form.category.trim() || form.amount <= 0) return;
    
    if (editing) {
      await supabase.from('expenses').update(form).eq('id', editing.id);
    } else {
      await supabase.from('expenses').insert([{ tender_id: tender.id, ...form }]);
    }
    
    setForm({ category: '', amount: 0, description: '', is_cash: false });
    setEditing(null);
    setAdding(false);
    onExpenseAdded();
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    onExpenseDeleted();
  };

  const edit = (e: Expense) => {
    setEditing(e);
    setForm({ category: e.category, amount: e.amount, description: e.description || '', is_cash: e.is_cash || false });
    setAdding(true);
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-all">
      {/* ЗАГОЛОВОК - АКЦЕНТ НА ПРИБЫЛИ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{tender.name}</h3>
          <div className="flex items-center gap-6">
            {/* ГЛАВНОЕ - ПРИБЫЛЬ (крупно) */}
            <div>
              <span className="text-xs text-gray-500">Чистая прибыль</span>
              <div className="flex items-center gap-1">
                {netProfit > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                <span className={cn("text-xl font-bold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
                  {fmt(netProfit)}
                </span>
              </div>
            </div>
            
            {/* Дополнительно */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Доход: <span className="font-medium">{fmtShort(income)}</span></span>
              <span>Расходы: <span className="font-medium text-red-600">{fmtShort(totalExpenses)}</span></span>
              <span className="text-xs text-gray-500">УСН: {fmtShort(tax)}</span>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">{expenses.length} расходов</span>
          {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </div>
      </button>

      {/* СОДЕРЖИМОЕ - ОРГАНИЗОВАННОЕ */}
      {isOpen && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* ФИНАНСОВАЯ ПАНЕЛЬ - 3 КАРТОЧКИ */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-green-700 mb-1">Доход</p>
              <p className="text-lg font-bold text-green-700">{fmt(income)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 p-3 rounded-lg border border-red-100">
              <p className="text-xs text-red-700 mb-1">Расходы</p>
              <p className="text-lg font-bold text-red-700">{fmt(totalExpenses)}</p>
              <div className="flex gap-2 mt-1 text-xs text-red-600">
                <span>💳 {fmtShort(bankExpenses)}</span>
                <span>💵 {fmtShort(cashExpenses)}</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
              <p className="text-xs text-orange-700 mb-1">Налог УСН 7%</p>
              <p className="text-lg font-bold text-orange-700">{fmt(tax)}</p>
              <p className="text-xs text-orange-600 mt-1">База: {fmtShort(taxableProfit)}</p>
            </div>
          </div>

          {/* РАСХОДЫ ПО КАТЕГОРИЯМ */}
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Расходы по категориям</h4>
              <Button size="sm" onClick={() => { setAdding(!adding); setEditing(null); }}>
                <Plus className="h-4 w-4 mr-1" />
                {adding ? 'Отмена' : 'Добавить'}
              </Button>
            </div>

            {/* Форма добавления */}
            {adding && (
              <div className="mb-3 p-3 bg-gray-50 rounded border space-y-2">
                {editing && <p className="text-xs text-blue-600 font-medium">Редактирование расхода</p>}
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Категория" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="h-9" />
                  <Input type="number" placeholder="Сумма" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-9" />
                  <Input placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-9" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.is_cash} onChange={e => setForm({ ...form, is_cash: e.target.checked })} className="h-4 w-4" />
                    <span>💵 Наличка</span>
                  </label>
                  <Button size="sm" onClick={save}>{editing ? 'Обновить' : 'Сохранить'}</Button>
                </div>
              </div>
            )}

            {/* Список по категориям */}
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Расходы не добавлены</p>
            ) : (
              <div className="space-y-3">
                {categories.map(([cat, data]) => (
                  <div key={cat} className="space-y-1">
                    {/* Заголовок категории */}
                    <div className="flex items-center justify-between py-1 border-b">
                      <span className="font-medium text-gray-700">{cat}</span>
                      <span className="font-semibold text-gray-900">{fmt(data.total)}</span>
                    </div>
                    
                    {/* Элементы категории */}
                    <div className="space-y-1 pl-2">
                      {data.items.map(e => (
                        <div key={e.id} className="flex items-center justify-between py-1 text-sm hover:bg-gray-50 rounded px-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-base">{e.is_cash ? '💵' : '💳'}</span>
                            {e.description && <span className="text-gray-600 truncate">{e.description}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-red-600">{fmt(e.amount)}</span>
                            <Button variant="ghost" size="sm" onClick={() => edit(e)} className="h-7 w-7 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => del(e.id)} className="h-7 w-7 p-0 text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
