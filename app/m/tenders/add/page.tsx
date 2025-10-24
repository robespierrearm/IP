'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenderInsert, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

export default function AddTenderPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<TenderInsert>({
    name: '',
    status: 'новый',
    purchase_number: '',
    link: '',
    region: '',
    publication_date: new Date().toISOString().split('T')[0],
    submission_date: '',
    submission_deadline: '',
    start_price: null,
    submitted_price: null,
    win_price: null,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      haptics.warning();
      toast.error('Заполните название', {
        description: 'Введите название тендера для продолжения'
      });
      return;
    }

    setIsSaving(true);
    haptics.light();
    
    const payload = {
      ...formData,
      purchase_number: formData.purchase_number || null,
      link: formData.link || null,
      submission_date: formData.submission_date || null,
      submission_deadline: formData.submission_deadline || null,
    };
    
    try {
      await apiClient.createTender(payload);
      setIsSaving(false);
      
      haptics.success();
      toast.success('Тендер добавлен!', {
        description: 'Тендер успешно сохранён'
      });
      router.push('/m/tenders');
    } catch (error) {
      setIsSaving(false);
      haptics.error();
      toast.error('Ошибка сохранения', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
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

      {/* Форма - компактная */}
      <div className="px-4 py-4 space-y-3">
        {/* Название */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Название *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Введите название"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Номер закупки + Регион */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              № закупки
            </label>
            <input
              type="text"
              value={formData.purchase_number || ''}
              onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })}
              placeholder="№ 123..."
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              📍 Регион
            </label>
            <input
              type="text"
              value={formData.region || ''}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="Москва"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Ссылка */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            🔗 Ссылка на тендер
          </label>
          <input
            type="url"
            value={formData.link || ''}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Разделитель */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Даты: Публикация + Дедлайн */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              📅 Публикация
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={formData.publication_date}
              onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
              required
              className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ⏰ Дедлайн
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={formData.submission_deadline || ''}
              onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
              className="w-full px-2 py-2.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Разделитель */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Начальная цена */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            💵 Начальная цена
          </label>
          <input
            type="number"
            value={formData.start_price || ''}
            onChange={(e) => setFormData({ ...formData, start_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-2.5 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Создать тендер
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/m/tenders')}
            className="px-5 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium text-sm active:bg-gray-200 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
