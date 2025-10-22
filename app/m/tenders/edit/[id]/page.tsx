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
      const tenders = await apiClient.getTenders();
      const data = tenders.find(t => t.id === parseInt(tenderId));
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

    setIsSaving(true);
    haptics.light();
    
    try {
      await apiClient.updateTender(tender.id, {
        name: tender.name,
        status: tender.status,
        start_price: tender.start_price,
        win_price: tender.win_price,
        region: tender.region,
        purchase_number: tender.purchase_number,
      });
      
      setIsSaving(false);
      haptics.success();
      toast.success('Тендер обновлён!', {
        description: apiClient.getOnlineStatus() 
          ? 'Изменения сохранены' 
          : 'Изменения будут синхронизированы при подключении к сети'
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

      {/* Форма */}
      <div className="px-6 py-6 space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название тендера
          </label>
          <input
            type="text"
            value={tender.name}
            onChange={(e) => setTender({ ...tender, name: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={tender.status}
            onChange={(e) => setTender({ ...tender, status: e.target.value as Tender['status'] })}
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
            value={tender.purchase_number || ''}
            onChange={(e) => setTender({ ...tender, purchase_number: e.target.value })}
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
            value={tender.region || ''}
            onChange={(e) => setTender({ ...tender, region: e.target.value })}
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
            value={tender.start_price || ''}
            onChange={(e) => setTender({ ...tender, start_price: parseFloat(e.target.value) || null })}
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
            value={tender.win_price || ''}
            onChange={(e) => setTender({ ...tender, win_price: parseFloat(e.target.value) || null })}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-br from-primary-500 to-secondary-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
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
