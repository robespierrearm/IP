'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

export default function EditTenderPage() {
  const router = useRouter();
  const params = useParams();
  const tenderId = params.id as string;

  const [tender, setTender] = useState<Tender | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadTender();
  }, [tenderId]);

  const loadTender = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getTenders();
      const tenders = (response.success && response.data) ? response.data as any[] : [];
      const data = tenders.find((t: any) => t.id === parseInt(tenderId));
      if (data) {
        setTender(data);
      }
    } catch (error) {
      console.error('Error loading tender:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!tender) return;

    if (!tender.name.trim()) {
      haptics.warning();
      toast.error('Заполните название', {
        description: 'Название тендера обязательно'
      });
      return;
    }

    setIsSaving(true);
    haptics.light();
    
    try {
      await apiClient.updateTender(tender.id, {
        name: tender.name,
        status: tender.status,
        purchase_number: tender.purchase_number || null,
        link: tender.link || null,
        region: tender.region || null,
        publication_date: tender.publication_date || null,
        submission_date: tender.submission_date || null,
        submission_deadline: tender.submission_deadline || null,
        start_price: tender.start_price,
        submitted_price: tender.submitted_price,
        win_price: tender.win_price,
      });
      
      setIsSaving(false);
      haptics.success();
      toast.success('Тендер обновлён!', {
        description: 'Изменения сохранены'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Тендер не найден</p>
          <button
            onClick={() => router.push('/m/tenders')}
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
            onClick={() => router.push('/m/tenders')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Редактирование тендера</h1>
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
            value={tender.name}
            onChange={(e) => setTender({ ...tender, name: e.target.value })}
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
              value={tender.purchase_number || ''}
              onChange={(e) => setTender({ ...tender, purchase_number: e.target.value })}
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
              value={tender.region || ''}
              onChange={(e) => setTender({ ...tender, region: e.target.value })}
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
            value={tender.link || ''}
            onChange={(e) => setTender({ ...tender, link: e.target.value })}
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
              value={tender.publication_date || ''}
              onChange={(e) => setTender({ ...tender, publication_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ⏰ Дедлайн
            </label>
            <input
              type="date"
              value={tender.submission_deadline || ''}
              onChange={(e) => setTender({ ...tender, submission_deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Дата подачи */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            📤 Дата подачи заявки
          </label>
          <input
            type="date"
            value={tender.submission_date || ''}
            onChange={(e) => setTender({ ...tender, submission_date: e.target.value })}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Разделитель */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Цены: Начальная + Подачи */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              💵 Начальная
            </label>
            <input
              type="number"
              value={tender.start_price || ''}
              onChange={(e) => setTender({ ...tender, start_price: parseFloat(e.target.value) || null })}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              📊 Подачи
            </label>
            <input
              type="number"
              value={tender.submitted_price || ''}
              onChange={(e) => setTender({ ...tender, submitted_price: parseFloat(e.target.value) || null })}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Цена победы */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            🏆 Цена победы
          </label>
          <input
            type="number"
            value={tender.win_price || ''}
            onChange={(e) => setTender({ ...tender, win_price: parseFloat(e.target.value) || null })}
            placeholder="0"
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Разделитель */}
        <div className="border-t border-gray-200 my-3"></div>

        {/* Статус */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            🏷️ Статус
          </label>
          <select
            value={tender.status}
            onChange={(e) => setTender({ ...tender, status: e.target.value as Tender['status'] })}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Кнопки */}
        <div className="flex gap-2.5 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
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
