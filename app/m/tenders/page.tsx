'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { useTenders, useDeleteTender } from '@/hooks/useQueries';
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, ExternalLink, ArrowRight, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
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
  
  // React Query - автоматическое кэширование!
  const { data: tenders = [], isLoading, error, refetch } = useTenders();
  const deleteTenderMutation = useDeleteTender();
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce 300ms
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number>(-1);
  const [cardStyle, setCardStyle] = useState<CardStyle>('modern'); // Стиль карточек

  useEffect(() => {
    // Читаем параметр status из URL
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setSelectedStatus(statusFromUrl);
    }
  }, [searchParams]);

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
    { value: 'all', label: '📋 Все' },
    { value: 'urgent', label: '🔥 Срочные' },
    { value: 'новый', label: '✨ Новые' },
    { value: 'в работе', label: '💼 В работе' },
    { value: 'на рассмотрении', label: '👀 Рассмотрение' },
    { value: 'завершён', label: '✅ Завершённые' },
  ];

  const handleDeleteRequest = (tender: Tender) => {
    haptics.warning(); // Вибрация при открытии диалога удаления
    setTenderToDelete(tender);
  };

  const handleDeleteConfirm = async () => {
    if (!tenderToDelete) return;

    const deletedTender = tenderToDelete;
    setDeletingId(deletedTender.id);
    haptics.medium();
    
    try {
      await deleteTenderMutation.mutateAsync(deletedTender.id);
      
      // Успех
      setTenderToDelete(null);
      setDeletingId(null);
      haptics.success();
      toast.success('Тендер удалён', {
        description: 'Тендер успешно удалён из списка'
      });
      // Кэш обновится автоматически!
    } catch (error) {
      console.error('Ошибка удаления тендера:', error);
      setDeletingId(null);
      haptics.error();
      toast.error('Ошибка удаления', {
        description: 'Не удалось удалить тендер'
      });
    }
  };

  const handleDeleteCancel = () => {
    setTenderToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка - КОМПАКТНАЯ */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Тендеры</h1>
          
          <div className="flex items-center gap-2">
            {/* Кнопка обновить */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-700 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
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
        </div>

        {/* Поиск - КОМПАКТНЫЙ */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск тендеров..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Свайпабельный фильтр - КОМПАКТНЫЙ */}
        <div className="relative overflow-hidden py-1 h-10">
          {/* Карусель фильтров - можно тянуть */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 600, bounceDamping: 30 }}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              const currentIndex = statusFilters.findIndex(f => f.value === selectedStatus);
              
              if (swipe > 300 || offset.x > 50) {
                // Свайп вправо - предыдущий (по кругу)
                const prevIndex = currentIndex === 0 ? statusFilters.length - 1 : currentIndex - 1;
                setSelectedStatus(statusFilters[prevIndex].value);
                haptics.light();
              } else if (swipe < -300 || offset.x < -50) {
                // Свайп влево - следующий (по кругу)
                const nextIndex = currentIndex === statusFilters.length - 1 ? 0 : currentIndex + 1;
                setSelectedStatus(statusFilters[nextIndex].value);
                haptics.light();
              }
            }}
            className="flex items-center justify-center gap-8 h-full cursor-grab active:cursor-grabbing"
          >
            {(() => {
              const currentIndex = statusFilters.findIndex(f => f.value === selectedStatus);
              const prevIndex = currentIndex === 0 ? statusFilters.length - 1 : currentIndex - 1;
              const nextIndex = currentIndex === statusFilters.length - 1 ? 0 : currentIndex + 1;
              
              const visibleFilters = [
                statusFilters[prevIndex],
                statusFilters[currentIndex],
                statusFilters[nextIndex],
              ];
              
              const textColors = {
                'all': 'text-blue-400',
                'urgent': 'text-red-400',
                'новый': 'text-purple-400',
                'в работе': 'text-green-400',
                'на рассмотрении': 'text-orange-400',
                'завершён': 'text-gray-400',
              };
              
              const bgColors = {
                'all': 'bg-blue-500/20 shadow-blue-500/50',
                'urgent': 'bg-red-500/20 shadow-red-500/50',
                'новый': 'bg-purple-500/20 shadow-purple-500/50',
                'в работе': 'bg-green-500/20 shadow-green-500/50',
                'на рассмотрении': 'bg-orange-500/20 shadow-orange-500/50',
                'завершён': 'bg-gray-500/20 shadow-gray-500/50',
              };
              
              return visibleFilters.map((filter, index) => {
                const isCenter = index === 1;
                
                return (
                  <motion.button
                    key={filter.value}
                    layout
                    onClick={() => {
                      if (!isCenter) {
                        setSelectedStatus(filter.value);
                        haptics.light();
                      }
                    }}
                    initial={false}
                    animate={{
                      scale: isCenter ? 1 : 0.8,
                      opacity: isCenter ? 1 : 0.4,
                    }}
                    transition={{
                      layout: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      },
                      scale: {
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      },
                      opacity: {
                        duration: 0.15,
                      },
                    }}
                    className="flex-shrink-0 relative pointer-events-auto"
                  >
                    <span className={`px-4 py-1.5 block font-medium text-sm whitespace-nowrap transition-all duration-150 ${
                      isCenter 
                        ? `${textColors[filter.value as keyof typeof textColors]} font-bold scale-110` 
                        : 'text-gray-400'
                    }`}>
                      {filter.label.replace(/[📋🔥✨💼👀✅]/g, '').trim()}
                    </span>
                  </motion.button>
                );
              });
            })()}
          </motion.div>
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
        onUpdate={refetch}
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
                disabled={deletingId !== null}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-medium active:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId !== null ? (
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

      {/* Floating Action Button - СТЕКЛЯННАЯ */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          haptics.light();
          router.push('/m/tenders/add');
        }}
        className="fixed bottom-24 right-6 w-14 h-14 backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border border-white/20 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
