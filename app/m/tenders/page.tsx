'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tender, STATUS_LABELS } from '@/lib/supabase';
import { apiClient } from '@/lib/api-client';
import { Plus, Search, Filter, Calendar, DollarSign, MapPin, ExternalLink, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { MobileTenderStatusChanger } from '@/components/mobile/TenderStatusChanger';
import { SwipeableTenderCard } from '@/components/mobile/SwipeableTenderCard';
import { supabase } from '@/lib/supabase';

export default function TendersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    filterTenders();
  }, [tenders, searchQuery, selectedStatus]);

  const loadTenders = async () => {
    setIsLoading(true);
    const result = await apiClient.getTenders();

    if (!result.error && result.data) {
      setTenders(result.data as Tender[]);
    }
    setIsLoading(false);
  };

  const filterTenders = () => {
    let filtered = [...tenders];

    // Фильтр по поиску
    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    setFilteredTenders(filtered);
  };

  const getStatusColor = (status: Tender['status']) => {
    switch (status) {
      case 'новый':
        return 'bg-blue-100 text-blue-700';
      case 'подано':
        return 'bg-indigo-100 text-indigo-700';
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
  };

  const statusFilters = [
    { value: 'all', label: 'Все' },
    { value: 'новый', label: 'Новые' },
    { value: 'в работе', label: 'В работе' },
    { value: 'на рассмотрении', label: 'Рассмотрение' },
    { value: 'завершён', label: 'Завершённые' },
  ];

  const handleDeleteRequest = (tender: Tender) => {
    setTenderToDelete(tender);
  };

  const handleDeleteConfirm = async () => {
    if (!tenderToDelete) return;

    setIsDeleting(true);
    setDeletingId(tenderToDelete.id);

    try {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderToDelete.id);

      if (error) throw error;

      // Анимация исчезновения - ждём 300ms перед удалением из state
      setTimeout(() => {
        setTenders(prev => prev.filter(t => t.id !== tenderToDelete.id));
        setDeletingId(null);
        setTenderToDelete(null);
        setIsDeleting(false);
      }, 300);
    } catch (error) {
      console.error('Ошибка удаления тендера:', error);
      setIsDeleting(false);
      setDeletingId(null);
      alert('Не удалось удалить тендер');
    }
  };

  const handleDeleteCancel = () => {
    setTenderToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
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
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTenders.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Тендеров не найдено</p>
          </div>
        ) : (
          filteredTenders.map((tender) => (
            <div
              key={tender.id}
              className={`transition-all duration-300 ${
                deletingId === tender.id
                  ? 'opacity-0 scale-95 -translate-x-full'
                  : 'opacity-100 scale-100 translate-x-0'
              }`}
            >
              <SwipeableTenderCard
                tender={tender}
                onDelete={handleDeleteRequest}
                onClick={setSelectedTender}
                isOpen={openCardId === tender.id}
                onOpen={setOpenCardId}
                getStatusColor={getStatusColor}
              />
            </div>
          ))
        )}
      </div>

      {/* Модальное окно детального просмотра */}
      {selectedTender && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setSelectedTender(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Индикатор свайпа */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <div className="px-6 pb-6">
              {/* Заголовок */}
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedTender.name}
              </h2>

              {/* Статус - НЕ показываем 'новый' */}
              {selectedTender.status !== 'новый' && (
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-4 ${getStatusColor(
                    selectedTender.status
                  )}`}
                >
                  {STATUS_LABELS[selectedTender.status]}
                </span>
              )}

              {/* Детали */}
              <div className="space-y-4">
                {selectedTender.purchase_number && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Номер закупки</div>
                    <div className="font-medium text-gray-900">
                      {selectedTender.purchase_number}
                    </div>
                  </div>
                )}

                {selectedTender.region && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Регион</div>
                    <div className="font-medium text-gray-900">{selectedTender.region}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Публикация</div>
                    <div className="font-medium text-gray-900">
                      {selectedTender.publication_date ? formatDate(selectedTender.publication_date) : '—'}
                    </div>
                  </div>

                  {/* Дата подачи показываем только со статуса 'на рассмотрении' */}
                  {selectedTender.status !== 'новый' && 
                   selectedTender.status !== 'подано' && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Дата подачи</div>
                      {selectedTender.status === 'на рассмотрении' ? (
                        editingSubmissionDate ? (
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={tempSubmissionDate}
                              onChange={(e) => setTempSubmissionDate(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                            <button
                              onClick={async () => {
                                await apiClient.updateTender(selectedTender.id, { submission_date: tempSubmissionDate });
                                setEditingSubmissionDate(false);
                                loadTenders();
                              }}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingSubmissionDate(false)}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
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
                            className="font-medium text-gray-900 cursor-pointer hover:text-primary-600 transition-colors"
                          >
                            {selectedTender.submission_date ? formatDate(selectedTender.submission_date) : '— (нажмите для редактирования)'}
                          </div>
                        )
                      ) : (
                        <div className="font-medium text-gray-900">
                          {selectedTender.submission_date ? formatDate(selectedTender.submission_date) : '—'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedTender.start_price && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Начальная цена</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(selectedTender.start_price)}
                    </div>
                  </div>
                )}

                {/* Цену подачи показываем начиная со статуса 'подано' */}
                {selectedTender.status !== 'новый' && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Цена подачи</div>
                    {selectedTender.status === 'на рассмотрении' ? (
                      editingSubmittedPrice ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={tempSubmittedPrice}
                            onChange={(e) => setTempSubmittedPrice(e.target.value)}
                            placeholder="Введите цену"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          <button
                            onClick={async () => {
                              await apiClient.updateTender(selectedTender.id, { submitted_price: parseFloat(tempSubmittedPrice) });
                              setEditingSubmittedPrice(false);
                              loadTenders();
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingSubmittedPrice(false)}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
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
                          className="text-lg font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                        >
                          {selectedTender.submitted_price ? formatPrice(selectedTender.submitted_price) : '— (нажмите для редактирования)'}
                        </div>
                      )
                    ) : (
                      selectedTender.submitted_price ? (
                        <div className="text-lg font-bold text-blue-600">
                          {formatPrice(selectedTender.submitted_price)}
                        </div>
                      ) : (
                        <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                          ⚠️ Цена подачи не заполнена
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Цену победы показываем только начиная со статуса 'победа' */}
                {(selectedTender.status === 'победа' || 
                  selectedTender.status === 'в работе' || 
                  selectedTender.status === 'завершён') && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Цена победы</div>
                    {selectedTender.win_price ? (
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(selectedTender.win_price)}
                      </div>
                    ) : (
                      <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                        ⚠️ Цена победы не заполнена
                      </div>
                    )}
                  </div>
                )}

                {selectedTender.link && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Ссылка</div>
                    <a
                      href={selectedTender.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium flex items-center gap-1"
                    >
                      Открыть тендер
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Смена статуса */}
              <div className="mt-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-500" />
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

              {/* Кнопки действий */}
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => {
                    // Закрываем модальное окно
                    setSelectedTender(null);
                    // Переходим на страницу редактирования тендера
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
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {tenderToDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
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
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => router.push('/m/tenders/add')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
