'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, STATUS_LABELS } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function AddTenderPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    status: 'новый' as const,
    purchase_number: '',
    region: '',
    start_price: '',
    win_price: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Введите название тендера');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('tenders')
      .insert({
        name: formData.name,
        status: formData.status,
        purchase_number: formData.purchase_number || null,
        region: formData.region || null,
        start_price: formData.start_price ? parseFloat(formData.start_price) : null,
        win_price: formData.win_price ? parseFloat(formData.win_price) : null,
      });

    setIsSaving(false);

    if (!error) {
      router.push('/m/tenders');
    } else {
      alert('Ошибка при создании тендера');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Шапка */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white px-6 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/m/tenders')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Новый тендер</h1>
        </div>
      </div>

      {/* Форма */}
      <div className="px-6 py-6 space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название тендера *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Введите название"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Номер закупки */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Номер закупки
          </label>
          <input
            type="text"
            value={formData.purchase_number}
            onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })}
            placeholder="Например: T-2025-001"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Регион */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Регион
          </label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="Например: Москва"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Начальная цена */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Начальная цена (₽)
          </label>
          <input
            type="number"
            value={formData.start_price}
            onChange={(e) => setFormData({ ...formData, start_price: e.target.value })}
            placeholder="0"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Цена победы */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Цена победы (₽)
          </label>
          <input
            type="number"
            value={formData.win_price}
            onChange={(e) => setFormData({ ...formData, win_price: e.target.value })}
            placeholder="0"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Создание...' : 'Создать тендер'}
          </button>
          <button
            onClick={() => router.push('/m/tenders')}
            className="px-6 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium active:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
