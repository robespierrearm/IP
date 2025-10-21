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
    
    const result = await apiClient.createTender(payload);

    setIsSaving(false);

    if (!result.error) {
      haptics.success();
      toast.success('Тендер добавлен!', {
        description: 'Вы можете найти его во вкладке "Новые"'
      });
      router.push('/m/tenders');
    } else {
      haptics.error();
      toast.error('Ошибка сохранения', {
        description: result.error || 'Не удалось создать тендер. Попробуйте ещё раз.'
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

        {/* Статус скрыт - автоматически "новый" */}

        {/* Номер закупки */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Номер гос закупки
          </label>
          <input
            type="text"
            value={formData.purchase_number || ''}
            onChange={(e) => setFormData({ ...formData, purchase_number: e.target.value })}
            placeholder="№ 0123456789012345678901"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Ссылка */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на тендер
          </label>
          <input
            type="url"
            value={formData.link || ''}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Регион */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Регион / Адрес
          </label>
          <input
            type="text"
            value={formData.region || ''}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="Москва, Россия"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Дата публикации */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата публикации *
          </label>
          <input
            type="date"
            value={formData.publication_date}
            onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
            required
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Дата подачи скрыта - устанавливается автоматически при смене статуса */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Срок подачи заявок
          </label>
          <input
            type="date"
            value={formData.submission_deadline || ''}
            onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
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
            value={formData.start_price || ''}
            onChange={(e) => setFormData({ ...formData, start_price: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="0"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Цена подачи и цена победы скрыты - появятся при смене статуса */}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Создать тендер
              </>
            )}
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
