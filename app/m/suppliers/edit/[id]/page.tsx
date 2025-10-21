'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Supplier } from '@/lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSupplier();
  }, [supplierId]);

  const loadSupplier = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (!error && data) {
      setSupplier(data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!supplier) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        contact_person: supplier.contact_person,
        category: supplier.category,
        notes: supplier.notes,
      })
      .eq('id', supplierId);

    setIsSaving(false);

    if (!error) {
      router.push('/m/suppliers');
    } else {
      alert('Ошибка при сохранении');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Поставщик не найден</p>
          <button
            onClick={() => router.push('/m/suppliers')}
            className="text-primary-500 font-medium"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Шапка */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600 text-white px-6 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/m/suppliers')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Редактирование поставщика</h1>
        </div>
      </div>

      {/* Форма */}
      <div className="px-6 py-6 space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название компании
          </label>
          <input
            type="text"
            value={supplier.name}
            onChange={(e) => setSupplier({ ...supplier, name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Контактное лицо */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Контактное лицо
          </label>
          <input
            type="text"
            value={supplier.contact_person || ''}
            onChange={(e) => setSupplier({ ...supplier, contact_person: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Телефон */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон
          </label>
          <input
            type="tel"
            value={supplier.phone || ''}
            onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={supplier.email || ''}
            onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Категория */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Категория
          </label>
          <input
            type="text"
            value={supplier.category || ''}
            onChange={(e) => setSupplier({ ...supplier, category: e.target.value })}
            placeholder="Например: Стройматериалы, Инструменты"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Примечания */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Примечания
          </label>
          <textarea
            value={supplier.notes || ''}
            onChange={(e) => setSupplier({ ...supplier, notes: e.target.value })}
            placeholder="Дополнительная информация о поставщике"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            onClick={() => router.push('/m/suppliers')}
            className="px-6 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium active:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
