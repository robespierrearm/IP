'use client';

import { useEffect, useState } from 'react';
import { supabase, Tender, Expense } from '@/lib/supabase';
import { TenderAccounting } from '@/components/TenderAccounting';
import { TenderAccountingV1 } from '@/components/TenderAccountingV1';
import { TenderAccountingV2 } from '@/components/TenderAccountingV2';

interface TenderWithExpenses {
  tender: Tender;
  expenses: Expense[];
}

export default function AccountingVariantsPage() {
  const [data, setData] = useState<TenderWithExpenses[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: t } = await supabase
      .from('tenders')
      .select('*')
      .in('status', ['победа', 'в работе', 'завершён'])
      .order('created_at', { ascending: false })
      .limit(3);

    if (!t) {
      setLoading(false);
      return;
    }

    const { data: e } = await supabase
      .from('expenses')
      .select('*')
      .in('tender_id', t.map(x => x.id));

    setData(t.map(tender => ({ tender, expenses: (e || []).filter(x => x.tender_id === tender.id) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Загрузка...</p>
        </div>
      </div>
    );
  }

  const firstTender = data[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Варианты дизайна карточки тендера</h1>
        <p className="text-gray-600">Сравни все варианты и выбери лучший! 🎨</p>
      </div>

      {!firstTender ? (
        <p className="text-center text-gray-500 py-12">Нет данных для отображения</p>
      ) : (
        <>
          {/* ТЕКУЩИЙ ВАРИАНТ */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">📌 ТЕКУЩИЙ (оригинальный)</h2>
              <span className="text-sm text-gray-500">Твой дизайн сейчас</span>
            </div>
            <TenderAccounting
              tender={firstTender.tender}
              expenses={firstTender.expenses}
              onExpenseAdded={load}
              onExpenseDeleted={load}
            />
            <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-700">
              <p className="font-medium mb-1">Особенности:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>3 большие кнопки (Сводка, Документы)</li>
                <li>Большой блок со статистикой</li>
                <li>Список расходов с итогом</li>
                <li>❌ Повторяется информация (доход, расходы, прибыль показаны 2-3 раза)</li>
              </ul>
            </div>
          </div>

          {/* ВАРИАНТ 1 - SPLIT VIEW ТАБЛИЦА */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">📊 ВАРИАНТ 1: SPLIT-VIEW ТАБЛИЦА</h2>
              <span className="text-sm text-gray-500">Совершенно другой подход</span>
            </div>
            <TenderAccountingV1
              tender={firstTender.tender}
              expenses={firstTender.expenses}
              onExpenseAdded={load}
              onExpenseDeleted={load}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <p className="font-medium mb-1">Особенности:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>📊 ГОРИЗОНТАЛЬНЫЙ split: финансы слева, расходы справа</li>
                <li>📋 ТАБЛИЦА расходов (как в Excel/CRM)</li>
                <li>✏️ Inline редактирование (кликнул - сразу редактируешь)</li>
                <li>⚡ Быстрое добавление (строка в таблице)</li>
                <li>✅ Компактно - всё на одном экране</li>
                <li>✅ Привычный формат для бухгалтера</li>
              </ul>
            </div>
          </div>

          {/* ВАРИАНТ 2 - КОМПАКТНЫЙ ОРИГИНАЛ */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">✂️ ВАРИАНТ 2: КОМПАКТНЫЙ</h2>
              <span className="text-sm text-gray-500">Как оригинал, но аккуратный</span>
            </div>
            <TenderAccountingV2
              tender={firstTender.tender}
              expenses={firstTender.expenses}
              onExpenseAdded={load}
              onExpenseDeleted={load}
            />
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
              <p className="font-medium mb-1">Особенности:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>✂️ КОМПАКТНЫЙ - убраны повторы, меньше места</li>
                <li>🎯 Финансы в 2 колонки (не растянуто)</li>
                <li>⚡ Форма добавления в 3 колонки (быстро заполнить)</li>
                <li>📝 Кнопки в одну строку (не раскиданы)</li>
                <li>✅ Тот же функционал, что у тебя сейчас</li>
                <li>✅ Удобно для бухгалтера - быстро добавить расход</li>
              </ul>
            </div>
          </div>

          {/* ГОЛОСОВАНИЕ */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">🗳️ Какой вариант тебе нравится больше?</h3>
            <div className="space-y-2 text-sm">
              <p><strong>ТЕКУЩИЙ:</strong> Твой оригинал (много повторов, растянут)</p>
              <p><strong>ВАРИАНТ 1 (SPLIT-VIEW):</strong> Таблица как в CRM, горизонтальный, inline редактирование</p>
              <p><strong>ВАРИАНТ 2 (КОМПАКТНЫЙ):</strong> Как твой, но аккуратный и удобный для добавления расходов</p>
            </div>
            <p className="mt-4 text-sm text-gray-700">
              👉 <strong>Скажи номер варианта</strong> и я заменю текущий компонент!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
