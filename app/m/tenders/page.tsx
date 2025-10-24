'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, ExternalLink, ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { getStatusEmoji } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';
import { useAutoClose } from '@/hooks/useAutoClose';
import { MobileTenderStatusChanger } from '@/components/mobile/TenderStatusChanger';
import { SwipeableTenderCard } from '@/components/mobile/SwipeableTenderCard';
import { TenderCardModern } from '@/components/mobile/TenderCardModern';
import { TenderCardApple } from '@/components/mobile/TenderCardApple';
import { AnimatedTenderCard } from '@/components/mobile/AnimatedTenderCard';
import { TenderCardSkeletonGroup } from '@/components/mobile/TenderCardSkeleton';
import { TenderDetailsModal } from '@/components/mobile/TenderDetailsModal';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

type CardStyle = 'original' | 'modern' | 'apple';

export default function TendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce 300ms
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number>(-1);
  const [cardStyle, setCardStyle] = useState<CardStyle>('modern'); // Стиль карточек

  useEffect(() => {
    // Читаем параметр status из URL
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
    loadTenders();
  }, []);

  // Мемоизированная фильтрация тендеров
  const filteredTenders = useMemo(() => {
    let filtered = [...tenders];

    // Фильтр по поиску
    if (debouncedSearchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'urgent') {
        // Срочные: умные уведомления с priority urgent или high
        filtered = filtered.filter((t) => {
          const notification = getSmartNotification(t);
          return notification && (notification.priority === 'urgent' || notification.priority === 'high');
        });
      } else if (selectedStatus === 'новый') {
        filtered = filtered.filter((t) => t.status === 'новый' || t.status === 'подано');
      } else {
        filtered = filtered.filter((t) => t.status === selectedStatus);
      }
    }

    return filtered;
  }, [tenders, debouncedSearchQuery, selectedStatus]);

  // Автозакрытие карточки через 3 секунды и при клике вне (оптимизировано)
  useAutoClose(openCardId !== -1, () => setOpenCardId(-1), 3000, '[data-card-id]');

  const loadTenders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getTenders();
      if (response.success && response.data) {
        setTenders(response.data as Tender[]);
      } else {
        throw new Error(response.error || 'Не удалось загрузить тендеры');
      }
    } catch (error) {
      console.error('Ошибка загрузки тендеров:', error);
      toast.error('Ошибка загрузки', {
        description: error instanceof Error ? error.message : 'Не удалось загрузить тендеры'
      });
    }
    setIsLoading(false);
  }, []);

  const getStatusColorMobile = useCallback((status: Tender['status']) => {
    switch (status) {
      case 'новый':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'подано':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'на рассмотрении':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'победа':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'в работе':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'завершён':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'проигрыш':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const statusFilters = [
    { value: 'all', label: 'Все' },
    { value: 'urgent', label: '🔥 Срочные' },
    { value: 'новый', label: 'Новые' },
    { value: 'в работе', label: 'В работе' },
    { value: 'на рассмотрении', label: 'Рассмотрение' },
    { value: 'подано', label: 'Подано' },
    { value: 'победа', label: 'Победа' },
    { value: 'проигрыш', label: 'Проигрыш' },
    { value: 'завершён', label: 'Завершённые' },
  ];

  const handleDeleteRequest = (tender: Tender) => {
    haptics.warning(); // Вибрация при открытии диалога удаления
    setTenderToDelete(tender);
  };

  const handleDeleteConfirm = async () => {
    if (!tenderToDelete) return;

    const deletedTender = tenderToDelete;
    
    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: сразу удаляем из UI
    setDeletingId(deletedTender.id);
    haptics.medium();
    
    // Анимация исчезновения
    setTimeout(() => {
      setTenders(prev => prev.filter(t => t.id !== deletedTender.id));
      setTenderToDelete(null);
      setDeletingId(null);
    }, 300);

    // Показываем toast сразу
    haptics.success();
    toast.success('Тендер удалён', {
      description: 'Тендер успешно удалён из списка'
    });

    // В фоне отправляем на сервер
    try {
      await apiClient.deleteTender(deletedTender.id);
    } catch (error) {
      console.error('Ошибка удаления тендера:', error);
      
      // Если ошибка - возвращаем тендер обратно
      setTenders(prev => [...prev, deletedTender].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }));
      
      haptics.error();
      toast.error('Ошибка удаления', {
        description: 'Не удалось удалить тендер. Он был восстановлен.'
      });
    }
  };

  const handleDeleteCancel = () => {
    setTenderToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Тендеры</h1>
          
          {/* Переключатель стилей */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCardStyle('modern')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                cardStyle === 'modern' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Modern
            </button>
            <button
              onClick={() => setCardStyle('apple')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                cardStyle === 'apple' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Apple
            </button>
            <button
              onClick={() => setCardStyle('original')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                cardStyle === 'original' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Old
            </button>
          </div>
        </div>

        {/* Поиск */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск тендеров..."
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Фильтры статусов */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedStatus === filter.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Список тендеров */}
      <div className="px-6 py-4 space-y-3">
        {isLoading ? (
          <TenderCardSkeletonGroup count={5} />
        ) : filteredTenders.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Тендеров не найдено</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTenders.map((tender, index) => (
              <AnimatedTenderCard
                key={tender.id}
                tender={tender}
                index={index}
                onDelete={handleDeleteRequest}
                onClick={setSelectedTender}
                isOpen={openCardId === tender.id}
                onOpen={setOpenCardId}
                getStatusColor={getStatusColorMobile}
                isDeleting={deletingId === tender.id}
                cardStyle={cardStyle}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Модальное окно детального просмотра (оптимизировано - вынесено в компонент) */}
      <TenderDetailsModal
        tender={selectedTender}
        onClose={() => setSelectedTender(null)}
        onUpdate={loadTenders}
      />

      {/* Модальное окно подтверждения удаления */}
      <AnimatePresence>
        {tenderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
            onClick={handleDeleteCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            {/* Иконка предупреждения */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Заголовок */}
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Удалить тендер?
            </h3>

            {/* Описание */}
            <p className="text-gray-600 text-center mb-6">
              Вы уверены, что хотите удалить <span className="font-semibold">{tenderToDelete.name}</span>?
              <br />
              <span className="text-sm text-red-600">Это действие нельзя отменить.</span>
            </p>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium active:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          haptics.light();
          router.push('/m/tenders/add');
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-600 text-white rounded-full shadow-lg flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
