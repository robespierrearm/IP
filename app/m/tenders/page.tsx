'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, ExternalLink, ArrowRight, AlertTriangle, FileText } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { MobileTenderStatusChanger } from '@/components/mobile/TenderStatusChanger';
import { SwipeableTenderCard } from '@/components/mobile/SwipeableTenderCard';
import { AnimatedTenderCard } from '@/components/mobile/AnimatedTenderCard';
import { TenderCardSkeletonGroup } from '@/components/mobile/TenderCardSkeleton';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

export default function TendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce 300ms
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [editingSubmissionDate, setEditingSubmissionDate] = useState(false);
  const [editingSubmittedPrice, setEditingSubmittedPrice] = useState(false);
  const [tempSubmissionDate, setTempSubmissionDate] = useState('');
  const [tempSubmittedPrice, setTempSubmittedPrice] = useState('');
  const [tenderToDelete, setTenderToDelete] = useState<Tender | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<number>(-1);

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
      if (selectedStatus === 'новый') {
        filtered = filtered.filter((t) => t.status === 'новый' || t.status === 'подано');
      } else {
        filtered = filtered.filter((t) => t.status === selectedStatus);
      }
    }

    return filtered;
  }, [tenders, debouncedSearchQuery, selectedStatus]);

  // Автозакрытие открытой карточки через 3 секунды
  useEffect(() => {
    if (openCardId !== -1) {
      const timer = setTimeout(() => {
        setOpenCardId(-1);
      }, 3000); // 3 секунды

      return () => clearTimeout(timer);
    }
  }, [openCardId]);

  // Закрытие при клике вне карточки
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openCardId !== -1) {
        // Проверяем что клик не по открытой карточке
        const target = e.target as HTMLElement;
        const isClickOnCard = target.closest('[data-card-id]');
        
        if (!isClickOnCard) {
          setOpenCardId(-1);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openCardId]);

  const loadTenders = useCallback(async () => {
    setIsLoading(true);
    const result = await apiClient.getTenders();

    if (!result.error && result.data) {
      setTenders(result.data as Tender[]);
    }
    setIsLoading(false);
  }, []);

  const getStatusColor = useCallback((status: Tender['status']) => {
    switch (status) {
      case 'новый':
        return 'bg-blue-100 text-blue-700';
      case 'подано':
        return 'bg-green-100 text-green-700'; // Зелёный фон для поданных тендеров
      case 'на рассмотрении':
        return 'bg-purple-100 text-purple-700';
      case 'победа':
        return 'bg-green-100 text-green-700';
      case 'в работе':
        return 'bg-orange-100 text-orange-700';
      case 'завершён':
        return 'bg-green-50 text-green-600';
      case 'проигрыш':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }, []);

  const statusFilters = [
    { value: 'all', label: 'Все' },
    { value: 'новый', label: 'Новые' },
    { value: 'в работе', label: 'В работе' },
    { value: 'на рассмотрении', label: 'Рассмотрение' },
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
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', deletedTender.id);

      if (error) throw error;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Тендеры</h1>

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
                getStatusColor={getStatusColor}
                isDeleting={deletingId === tender.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Модальное окно детального просмотра */}
      <AnimatePresence>
        {selectedTender && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedTender(null)}
          >
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  setSelectedTender(null);
                }
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full flex flex-col"
              style={{ maxHeight: 'min(80vh, 700px)', marginBottom: '80px' }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
            {/* Шапка - sticky */}
            <div className="sticky top-0 bg-white z-10 px-6 pt-3 pb-4 border-b border-gray-100">
              {/* Индикатор свайпа */}
              <div className="flex justify-center mb-3">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Заголовок + Статус */}
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 flex-1">
                  {selectedTender.name}
                </h2>
                {selectedTender.status !== 'новый' && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(
                      selectedTender.status
                    )}`}
                  >
                    {STATUS_LABELS[selectedTender.status]}
                  </span>
                )}
              </div>
            </div>

            {/* Контент - скроллится */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Компактные карточки с данными */}
              <div className="space-y-3">
                {/* Номер закупки */}
                {selectedTender.purchase_number && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Номер закупки</span>
                    </div>
                    <div className="font-mono text-sm font-medium text-gray-900">
                      {selectedTender.purchase_number}
                    </div>
                  </div>
                )}

                {/* Регион */}
                {selectedTender.region && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Регион</span>
                    </div>
                    <div className="font-medium text-gray-900">{selectedTender.region}</div>
                  </div>
                )}

                {/* Даты */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Публикация</span>
                    </div>
                    <div className="font-semibold text-sm text-gray-900">
                      {selectedTender.publication_date ? formatDate(selectedTender.publication_date) : '—'}
                    </div>
                  </div>

                  {/* Дата подачи */}
                  {selectedTender.status !== 'новый' && 
                   selectedTender.status !== 'подано' && (
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Дата подачи</span>
                      </div>
                      {selectedTender.status === 'на рассмотрении' ? (
                        editingSubmissionDate ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={tempSubmissionDate}
                              onChange={(e) => setTempSubmissionDate(e.target.value)}
                              className="flex-1 px-2 py-1 border border-blue-200 rounded-lg text-xs"
                            />
                            <button
                              onClick={async () => {
                                await apiClient.updateTender(selectedTender.id, { submission_date: tempSubmissionDate });
                                setEditingSubmissionDate(false);
                                loadTenders();
                              }}
                              className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSubmissionDate(false)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setTempSubmissionDate(selectedTender.submission_date || new Date().toISOString().split('T')[0]);
                              setEditingSubmissionDate(true);
                            }}
                            className="font-semibold text-sm text-blue-900 cursor-pointer hover:text-blue-700 transition-colors"
                          >
                            {selectedTender.submission_date ? formatDate(selectedTender.submission_date) : '— (нажмите)'}
                          </div>
                        )
                      ) : (
                        <div className="font-semibold text-sm text-blue-900">
                          {selectedTender.submission_date ? formatDate(selectedTender.submission_date) : '—'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Цены */}
                {selectedTender.start_price && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Начальная цена</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {formatPrice(selectedTender.start_price)}
                    </div>
                  </div>
                )}

                {/* Цена подачи */}
                {selectedTender.status !== 'новый' && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Цена подачи</span>
                    </div>
                    {selectedTender.status === 'на рассмотрении' ? (
                      editingSubmittedPrice ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={tempSubmittedPrice}
                            onChange={(e) => setTempSubmittedPrice(e.target.value)}
                            placeholder="Введите"
                            className="flex-1 px-2 py-1 border border-blue-200 rounded-lg text-xs"
                          />
                          <button
                            onClick={async () => {
                              await apiClient.updateTender(selectedTender.id, { submitted_price: parseFloat(tempSubmittedPrice) });
                              setEditingSubmittedPrice(false);
                              loadTenders();
                            }}
                            className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSubmittedPrice(false)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setTempSubmittedPrice(selectedTender.submitted_price?.toString() || '');
                            setEditingSubmittedPrice(true);
                          }}
                          className="text-lg font-bold text-blue-700 cursor-pointer hover:text-blue-800 transition-colors"
                        >
                          {selectedTender.submitted_price ? formatPrice(selectedTender.submitted_price) : '— (нажмите)'}
                        </div>
                      )
                    ) : (
                      selectedTender.submitted_price ? (
                        <div className="text-lg font-bold text-blue-700">
                          {formatPrice(selectedTender.submitted_price)}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600">⚠️ Не заполнена</div>
                      )
                    )}
                  </div>
                )}

                {/* Цена победы */}
                {(selectedTender.status === 'победа' || 
                  selectedTender.status === 'в работе' || 
                  selectedTender.status === 'завершён') && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Цена победы</span>
                    </div>
                    {selectedTender.win_price ? (
                      <div className="text-lg font-bold text-green-700">
                        {formatPrice(selectedTender.win_price)}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600">⚠️ Не заполнена</div>
                    )}
                  </div>
                )}

                {/* Ссылка */}
                {selectedTender.link && (
                  <a
                    href={selectedTender.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-primary-50 text-primary-600 py-3 rounded-xl font-medium border border-primary-100 active:bg-primary-100 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть тендер на сайте
                  </a>
                )}
              </div>

              {/* Смена статуса */}
              <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-primary-500" />
                  Изменить статус
                </div>
                <MobileTenderStatusChanger
                  tender={selectedTender}
                  onStatusChanged={() => {
                    loadTenders();
                    setSelectedTender(null);
                  }}
                />
              </div>
            </div>

            {/* Кнопки - sticky внизу */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
              <button 
                onClick={() => {
                  setSelectedTender(null);
                  router.push(`/m/tenders/edit/${selectedTender.id}`);
                }}
                className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium active:bg-primary-600 transition-colors"
              >
                Редактировать
              </button>
              <button
                onClick={() => setSelectedTender(null)}
                className="px-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
