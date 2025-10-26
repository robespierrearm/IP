'use client';

import { useMemo, useState } from 'react';
import { Tender, Expense, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tender: Tender;
  expenses: Expense[];
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

// ВАРИАНТ 1: УЛЬТРА-КОМПАКТНЫЙ (стиль как карточки тендеров)
export function TenderAccountingVariant1({ tender, expenses, onExpenseAdded, onExpenseDeleted }: Props) {
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
    <div className="border rounded-lg bg-white shadow-sm hover:shadow transition-shadow">
      {/* ЗАГОЛОВОК - КОМПАКТНЫЙ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">{tender.name}</h3>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
            <span>💰 {fmt(income)}</span>
            <span className="text-red-600">-{fmt(totalExpenses)}</span>
            <span className={cn("font-semibold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
              = {fmt(netProfit)}
            </span>
            <span className="text-gray-500">УСН: {fmt(tax)}</span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {/* СОДЕРЖИМОЕ - УЛЬТРА КОМПАКТНОЕ */}
      {isOpen && (
        <div className="border-t bg-gray-50 p-3 space-y-2">
          {/* Финансы одной строкой */}
          <div className="flex items-center justify-between text-xs bg-white p-2 rounded border">
            <span className="text-gray-600">💳 {fmt(bankExpenses)} + 💵 {fmt(cashExpenses)}</span>
            <span className="text-gray-600">Налог: <span className="font-medium text-orange-600">{fmt(tax)}</span></span>
            <span className={cn("font-semibold", netProfit > 0 ? "text-green-600" : "text-red-600")}>
              Чистая: {fmt(netProfit)}
            </span>
          </div>

          {/* Кнопка добавить */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Расходы ({expenses.length})</span>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(!adding); setEditing(null); }} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              {adding ? 'Отмена' : 'Добавить'}
            </Button>
          </div>

          {/* Форма - компактная */}
          {adding && (
            <div className="bg-white p-2 rounded border space-y-2">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Input placeholder="Категория" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="h-8" />
                <Input type="number" placeholder="Сумма" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-8" />
                <Input placeholder="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="h-8" />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.is_cash} onChange={e => setForm({ ...form, is_cash: e.target.checked })} className="h-3 w-3" />
                  <span>💵 Наличка</span>
                </label>
                <Button size="sm" onClick={save} className="h-7 text-xs">{editing ? 'Обновить' : 'Сохранить'}</Button>
              </div>
            </div>
          )}

          {/* Список расходов - компактный */}
          {expenses.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-2">Нет расходов</p>
          ) : (
            <div className="space-y-1">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-white rounded text-xs hover:bg-gray-50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span>{e.is_cash ? '💵' : '💳'}</span>
                    <span className="font-medium truncate">{e.category}</span>
                    {e.description && <span className="text-gray-500 truncate">— {e.description}</span>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="font-semibold text-red-600">{fmt(e.amount)}</span>
                    <Button variant="ghost" size="sm" onClick={() => edit(e)} className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => del(e.id)} className="h-6 w-6 p-0 text-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
