'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

export default function AddSupplierPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    contact_person: '',
    category: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      haptics.warning();
      toast.error('Введите название поставщика');
      return;
    }

    setIsSaving(true);
    haptics.light();
    
    try {
      await apiClient.createSupplier({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        contact_person: formData.contact_person || null,
        category: formData.category || null,
        notes: formData.notes || null,
      });
      
      setIsSaving(false);
      haptics.success();
      toast.success('Поставщик добавлен!', {
        description: apiClient.getOnlineStatus() 
          ? 'Поставщик сохранён' 
          : 'Поставщик будет синхронизирован при подключении к сети'
      });
      router.push('/m/suppliers');
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
            onClick={() => router.push('/m/suppliers')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Новый поставщик</h1>
        </div>
      </div>

      {/* Форма */}
      <div className="px-6 py-6 space-y-4">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название компании *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: ООО 'СтройМатериалы'"
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
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            placeholder="Иванов Иван Иванович"
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
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+7 (999) 123-45-67"
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
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@company.ru"
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
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Дополнительная информация о поставщике"
            rows={3}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
            {isSaving ? 'Создание...' : 'Создать поставщика'}
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
