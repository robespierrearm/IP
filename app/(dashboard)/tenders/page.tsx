'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tender, TenderInsert, STATUS_LABELS } from '@/lib/supabase';
import { logActivity, ACTION_TYPES } from '@/lib/activityLogger';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AddTenderDialog } from '@/components/AddTenderDialog';
import { EditTenderDialog } from '@/components/EditTenderDialog';
import { TenderStatusChanger } from '@/components/TenderStatusChanger';
import { PlatformButton } from '@/components/PlatformButton';
import { TenderCardExpanded } from '@/components/TenderCardExpanded';
import { Pencil, Trash2, Calendar, DollarSign, FileText } from 'lucide-react';
import { getStatusColor, formatPrice, formatDate } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';

type TabType = 'all' | 'new' | 'review' | 'inwork' | 'archive';
type ArchiveFilter = 'all' | 'completed' | 'lost';

function TendersContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const statusParam = searchParams.get('status');
  const editParam = searchParams.get('edit');
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'all');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  const [expandedTenderId, setExpandedTenderId] = useState<number | null>(null);

  // Обновляем activeTab при изменении URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('all');
    }
  }, [tabParam]);

  // Загрузка тендеров через API (без полноэкранной загрузки)
  const loadTenders = async () => {
    const result = await apiClient.getTenders();

    if (result.error) {
      console.error('Ошибка загрузки тендеров:', result.error);
      setTenders([]);
    } else {
      setTenders((result.data as Tender[]) || []);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  // Обработка параметра edit из URL
  useEffect(() => {
    if (editParam && tenders.length > 0) {
      const tenderId = parseInt(editParam, 10);
      const tender = tenders.find(t => t.id === tenderId);
      if (tender) {
        setEditingTender(tender);
      }
    }
  }, [editParam, tenders]);

  // Добавление тендера через API
  const handleAddTender = async (tender: TenderInsert) => {
    const payload = {
      ...tender,
      purchase_number: tender.purchase_number || null,
      link: tender.link || null,
      submission_date: tender.submission_date || null,
      submission_deadline: tender.submission_deadline || null,
      start_price: tender.start_price ?? null,
      submitted_price: tender.submitted_price ?? null,
      win_price: tender.win_price ?? null,
    };

    const result = await apiClient.createTender(payload);

    if (result.error) {
      console.error('Ошибка добавления тендера:', result.error);
      alert(result.error || 'Ошибка при добавлении тендера');
    } else {
      // Логируем добавление тендера
      await logActivity(
        `Добавлен тендер: ${tender.name}`,
        ACTION_TYPES.TENDER_ADD,
        { 
          tender_name: tender.name,
          region: tender.region,
          status: tender.status,
          start_price: tender.start_price
        }
      );
      
      loadTenders();
      setIsAddDialogOpen(false);
    }
  };

  // Обновление тендера через API
  const handleUpdateTender = async (id: number, updates: Partial<Tender>) => {
    const result = await apiClient.updateTender(id, updates);

    if (result.error) {
      console.error('Ошибка обновления тендера:', result.error);
      alert('Ошибка при обновлении тендера');
    } else {
      // Логируем редактирование тендера
      await logActivity(
        `Отредактирован тендер: ${updates.name || editingTender?.name || 'ID ' + id}`,
        ACTION_TYPES.TENDER_EDIT,
        { 
          tender_id: id,
          tender_name: updates.name || editingTender?.name,
          changes: updates
        }
      );
      
      loadTenders();
      setEditingTender(null);
    }
  };

  // Удаление тендера через API
  const handleDeleteTender = async (id: number) => {
    const tenderToDelete = tenders.find(t => t.id === id);
    
    if (!confirm('Вы уверены, что хотите удалить этот тендер?')) {
      return;
    }

    const result = await apiClient.deleteTender(id);

    if (result.error) {
      console.error('Ошибка удаления тендера:', result.error);
      alert('Ошибка при удалении тендера');
    } else {
      // Логируем удаление тендера
      await logActivity(
        `Удален тендер: ${tenderToDelete?.name || 'ID ' + id}`,
        ACTION_TYPES.TENDER_DELETE,
        { 
          tender_id: id,
          tender_name: tenderToDelete?.name,
          region: tenderToDelete?.region,
          status: tenderToDelete?.status
        }
      );
      
      loadTenders();
    }
  };

  // Смена статуса тендера
  const handleStatusChange = async (
    tenderId: number,
    newStatus: Tender['status'],
    additionalData?: Partial<Tender>
  ) => {
    const tender = tenders.find(t => t.id === tenderId);
    const oldStatus = tender?.status;
    
    const updateData: Partial<Tender> = {
      status: newStatus,
      ...additionalData,
    };

    const result = await apiClient.updateTender(tenderId, updateData);

    if (result.error) {
      console.error('Ошибка смены статуса:', result.error);
      throw new Error(result.error);
    }

    // Логируем смену статуса
    await logActivity(
      `Изменен статус тендера "${tender?.name || 'ID ' + tenderId}": ${oldStatus} → ${newStatus}`,
      ACTION_TYPES.TENDER_STATUS_CHANGE,
      { 
        tender_id: tenderId,
        tender_name: tender?.name,
        old_status: oldStatus,
        new_status: newStatus,
        additional_data: additionalData
      }
    );

    // Автоматическое создание записи в бухгалтерии при переходе в "Победа"
    // Запись в бухгалтерии будет создана автоматически при добавлении первого расхода

    loadTenders();
  };



  // Фильтрация тендеров по табам
  const getFilteredTenders = () => {
    let filtered = [...tenders];

    // Если есть параметр status из URL, фильтруем по нему
    if (statusParam) {
      filtered = tenders.filter(t => t.status === statusParam);
      return filtered;
    }

    switch (activeTab) {
      case 'new':
        // Показываем тендеры со статусом "новый" И "подано"
        filtered = tenders.filter(t => t.status === 'новый' || t.status === 'подано');
        break;
      case 'review':
        filtered = tenders.filter(t => t.status === 'на рассмотрении');
        break;
      case 'inwork':
        filtered = tenders.filter(t => t.status === 'в работе');
        break;
      case 'archive':
        filtered = tenders.filter(t => t.status === 'завершён' || t.status === 'проигрыш');
        
        // Применяем фильтр архива
        if (archiveFilter === 'completed') {
          filtered = filtered.filter(t => t.status === 'завершён');
        } else if (archiveFilter === 'lost') {
          filtered = filtered.filter(t => t.status === 'проигрыш');
        }
        break;
      case 'all':
      default:
        // Показываем все
        break;
    }

    return filtered;
  };

  const filteredTenders = getFilteredTenders();

  // Подсчёт тендеров для каждого таба
  const getCounts = () => {
    return {
      all: tenders.length,
      new: tenders.filter(t => t.status === 'новый' || t.status === 'подано').length,
      review: tenders.filter(t => t.status === 'на рассмотрении').length,
      inwork: tenders.filter(t => t.status === 'в работе').length,
      archive: tenders.filter(t => t.status === 'завершён' || t.status === 'проигрыш').length,
    };
  };

  const counts = getCounts();

  // Не показываем полноэкранный skeleton - сразу показываем интерфейс

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">Тендеры</h1>
          <p className="text-xs text-gray-600">
            Управление тендерами и заявками
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="w-full md:w-auto backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border border-white/20 shadow-lg shadow-blue-500/50 transition-all duration-300">
            Добавить тендер
          </Button>
        </motion.div>
      </div>

      {/* Фильтры архива - СТЕКЛЯННЫЕ */}
      {activeTab === 'archive' && (
        <div className="mb-4 inline-flex items-center gap-1 backdrop-blur-xl bg-white/50 rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setArchiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              archiveFilter === 'all'
                ? 'backdrop-blur-xl bg-blue-500/20 text-blue-700 shadow-sm shadow-blue-500/30 border border-white/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setArchiveFilter('completed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              archiveFilter === 'completed'
                ? 'backdrop-blur-xl bg-green-500/20 text-green-700 shadow-sm shadow-green-500/30 border border-white/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>✓</span>
              <span>Завершённые</span>
            </span>
          </button>
          <button
            onClick={() => setArchiveFilter('lost')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              archiveFilter === 'lost'
                ? 'backdrop-blur-xl bg-red-500/20 text-red-700 shadow-sm shadow-red-500/30 border border-white/20'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-1">
              <span>✕</span>
              <span>Проигрыш</span>
            </span>
          </button>
        </div>
      )}

      {filteredTenders.length === 0 && !isLoading ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20"
        >
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg"
          >
            Тендеров пока нет
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="mt-4"
              variant="outline"
            >
              Добавить первый тендер
            </Button>
          </motion.div>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
          {filteredTenders.map((tender, index) => {
            const notification = getSmartNotification(tender);
            const isUrgent = notification && (notification.priority === 'urgent' || notification.priority === 'high');
            
            return (
            <motion.div
              key={tender.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.4, 0, 0.2, 1]
              }}
              layout
            >
            <Card 
              className={`p-4 hover:shadow-xl hover:scale-[1.005] transition-all duration-200 cursor-pointer border-l-4 ${
                tender.status === 'новый' ? 'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-400 shadow-gray-500/20' :
                tender.status === 'подано' ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-l-blue-500 shadow-blue-500/30' :
                tender.status === 'на рассмотрении' ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-l-yellow-500 shadow-yellow-500/30' :
                tender.status === 'победа' ? 'bg-gradient-to-r from-purple-500/10 to-transparent border-l-purple-500 shadow-purple-500/30' :
                tender.status === 'в работе' ? 'bg-gradient-to-r from-green-500/10 to-transparent border-l-green-500 shadow-green-500/30' :
                tender.status === 'завершён' ? 'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-600 shadow-gray-500/20' :
                tender.status === 'проигрыш' ? 'bg-gradient-to-r from-red-500/10 to-transparent border-l-red-500 shadow-red-500/30' :
                'bg-gradient-to-r from-gray-500/10 to-transparent border-l-gray-400 shadow-gray-500/20'
              }`}
              onClick={() => setExpandedTenderId(expandedTenderId === tender.id ? null : tender.id)}
            >
              <div className="flex flex-col gap-3">
                {/* Заголовок и действия */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <h3 className="font-semibold text-base text-gray-900 truncate">{tender.name}</h3>
                      <PlatformButton link={tender.link} />
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          tender.status
                        )}`}
                      >
                        {STATUS_LABELS[tender.status]}
                      </span>
                      {notification && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border shadow-sm ${
                          notification.color === 'red' ? 'bg-red-50 text-red-700 border-red-200 shadow-red-500/30' :
                          notification.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-orange-500/30' :
                          notification.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-yellow-500/30' :
                          notification.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-500/30' :
                          notification.color === 'green' ? 'bg-green-50 text-green-700 border-green-200 shadow-green-500/30' :
                          notification.color === 'purple' ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-purple-500/30' :
                          'bg-gray-50 text-gray-700 border-gray-200 shadow-gray-500/20'
                        }`}>
                          <span className="text-sm">{notification.icon}</span>
                          <span className="font-medium">{notification.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Смена статуса */}
                    <div className="hidden sm:block">
                      <TenderStatusChanger
                        tender={tender}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                    <div className="flex gap-2">
                      {/* Кнопка редактирования */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 12 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTender(tender)}
                          className="h-8 w-8 p-0 backdrop-blur-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-200 shadow-sm hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-200 group relative"
                        >
                          <Pencil className="h-4 w-4 text-blue-600 group-hover:rotate-12 transition-transform" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Редактировать
                          </span>
                        </Button>
                      </motion.div>
                      
                      {/* Кнопка удаления */}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -12 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTender(tender.id)}
                          className="h-8 w-8 p-0 backdrop-blur-md bg-red-500/10 hover:bg-red-500/20 border border-red-200 shadow-sm hover:shadow-lg hover:shadow-red-500/40 transition-all duration-200 group relative"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 group-hover:rotate-12 transition-transform" />
                          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Удалить
                          </span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Информация */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Публикация</p>
                      <p className="font-medium text-gray-900">{formatDate(tender.publication_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Подача</p>
                      <p className="font-medium text-gray-900">{formatDate(tender.submission_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Начальная</p>
                      <p className="font-medium text-gray-900">{formatPrice(tender.start_price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Подачи</p>
                      <p className="font-medium text-gray-900">{formatPrice(tender.submitted_price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Победы</p>
                      <p className="font-medium text-green-600">{formatPrice(tender.win_price)}</p>
                    </div>
                  </div>
                </div>

                {/* Смена статуса на мобильных */}
                <div className="sm:hidden">
                  <TenderStatusChanger
                    tender={tender}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>

              {/* Раскрывающееся меню */}
              <TenderCardExpanded
                tender={tender}
                isExpanded={expandedTenderId === tender.id}
                onToggle={() => setExpandedTenderId(expandedTenderId === tender.id ? null : tender.id)}
              />
            </Card>
            </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      <AddTenderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddTender}
      />

      {editingTender && (
        <EditTenderDialog
          tender={editingTender}
          open={!!editingTender}
          onOpenChange={(open) => !open && setEditingTender(null)}
          onUpdate={handleUpdateTender}
        />
      )}
    </div>
  );
}

export default function TendersPage() {
  return (
    <Suspense fallback={
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    }>
      <TendersContent />
    </Suspense>
  );
}
