'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { Tender, TenderInsert, STATUS_LABELS } from '@/lib/supabase';
import { logActivity, ACTION_TYPES } from '@/lib/activityLogger';
import { useTenders, useCreateTender, useUpdateTender, useDeleteTender } from '@/hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TenderStatusChanger } from '@/components/TenderStatusChanger';
import { PlatformButton } from '@/components/PlatformButton';
import { TenderCardExpanded } from '@/components/TenderCardExpanded';
import { TenderCardExpandedNEW } from '@/components/TenderCardExpandedNEW';
import { TenderCardULTIMATE } from '@/components/TenderCardULTIMATE';
import { Pencil, Trash2, Calendar, DollarSign, FileText, RefreshCw, MapPin, ExternalLink } from 'lucide-react';
import { getStatusColor, formatPrice, formatDate } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';
import { extractDomain } from '@/lib/url-utils';
import { useCardVersion } from '@/contexts/CardVersionContext';

// Lazy load heavy modals - they're only needed when user clicks
const AddTenderDialog = dynamic(() => import('@/components/AddTenderDialog').then(mod => ({ default: mod.AddTenderDialog })), {
  loading: () => null,
});

const EditTenderDialog = dynamic(() => import('@/components/EditTenderDialog').then(mod => ({ default: mod.EditTenderDialog })), {
  loading: () => null,
});

type TabType = 'all' | 'new' | 'review' | 'inwork' | 'archive';
type ArchiveFilter = 'all' | 'completed' | 'lost';

function TendersContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const statusParam = searchParams.get('status');
  const editParam = searchParams.get('edit');
  
  // React Query - автоматическое кэширование!
  const { data: tenders = [], isLoading, error, refetch } = useTenders();
  const createTenderMutation = useCreateTender();
  const updateTenderMutation = useUpdateTender();
  const deleteTenderMutation = useDeleteTender();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'all');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  const [expandedTenderId, setExpandedTenderId] = useState<number | null>(null);
  const [bookmarkletData, setBookmarkletData] = useState<any>(null);
  const { cardVersion } = useCardVersion(); // Из контекста

  // Обновляем activeTab при изменении URL
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('all');
    }
  }, [tabParam]);

  // Обработка данных из bookmarklet
  useEffect(() => {
    const actionParam = searchParams.get('action');
    console.log('🔍 Checking action param:', actionParam);
    
    if (actionParam === 'add-from-parser') {
      console.log('✅ Action is add-from-parser');
      
      // СНАЧАЛА пробуем получить из URL параметра
      const dataParam = searchParams.get('data');
      console.log('📋 Data param from URL:', dataParam ? 'exists' : 'not found');
      
      let parsedData = null;
      
      if (dataParam) {
        try {
          parsedData = JSON.parse(decodeURIComponent(dataParam));
          console.log('✅ Parsed data from URL:', parsedData);
        } catch (error) {
          console.error('❌ Error parsing URL data:', error);
        }
      }
      
      // Если не получили из URL, пробуем localStorage
      if (!parsedData) {
        const savedData = localStorage.getItem('parsedTender');
        console.log('📦 Trying localStorage:', savedData ? 'exists' : 'not found');
        
        if (savedData) {
          try {
            parsedData = JSON.parse(savedData);
            console.log('✅ Parsed data from localStorage:', parsedData);
            localStorage.removeItem('parsedTender');
          } catch (error) {
            console.error('❌ Error parsing localStorage data:', error);
          }
        }
      }
      
      // Если получили данные - открываем форму
      if (parsedData) {
        setBookmarkletData(parsedData);
        setIsAddDialogOpen(true);
        console.log('✅ Dialog opened with data:', parsedData);
      } else {
        console.log('❌ No data found anywhere!');
      }
    }
  }, [searchParams]);

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

  // Добавление тендера через React Query mutation
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

    try {
      await createTenderMutation.mutateAsync(payload);
      
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
      
      setIsAddDialogOpen(false);
      // Кэш обновится автоматически!
    } catch (error: any) {
      console.error('Ошибка добавления тендера:', error);
      alert(error?.message || 'Ошибка при добавлении тендера');
    }
  };

  // Обновление тендера через React Query mutation
  const handleUpdateTender = async (id: number, updates: Partial<Tender>) => {
    try {
      await updateTenderMutation.mutateAsync({ id, updates });
      
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
      
      setEditingTender(null);
      // Кэш обновится автоматически!
    } catch (error: any) {
      console.error('Ошибка обновления тендера:', error);
      alert('Ошибка при обновлении тендера');
    }
  };

  // Удаление тендера через React Query mutation
  const handleDeleteTender = async (id: number) => {
    const tenderToDelete = tenders.find(t => t.id === id);
    
    if (!confirm('Вы уверены, что хотите удалить этот тендер?')) {
      return;
    }

    try {
      await deleteTenderMutation.mutateAsync(id);
      
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
      // Кэш обновится автоматически!
    } catch (error: any) {
      console.error('Ошибка удаления тендера:', error);
      alert('Ошибка при удалении тендера');
    }
  };

  // Смена статуса тендера через React Query mutation
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

    try {
      await updateTenderMutation.mutateAsync({ id: tenderId, updates: updateData });
      
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
      // Кэш обновится автоматически!
    } catch (error: any) {
      console.error('Ошибка смены статуса:', error);
      throw new Error(error?.message || 'Ошибка смены статуса');
    }
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
        <div className="flex gap-2">
          <m.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={() => refetch()} 
              size="lg" 
              variant="outline"
              disabled={isLoading}
              className={`backdrop-blur-xl border transition-all duration-300 ${
                isLoading 
                  ? 'bg-green-500/90 hover:bg-green-500/90 border-green-400/50 text-white shadow-lg shadow-green-500/50' 
                  : 'bg-white/50 hover:bg-white/70 border-white/20'
              }`}
            >
              <RefreshCw className={`h-4 w-4 transition-all ${isLoading ? 'animate-spin text-white' : ''}`} />
            </Button>
          </m.div>
          <m.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="w-full md:w-auto backdrop-blur-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 border border-white/20 shadow-lg shadow-blue-500/50 transition-all duration-300">
              Добавить тендер
            </Button>
          </m.div>
        </div>
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
        <m.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20"
        >
          <m.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-lg"
          >
            Тендеров пока нет
          </m.p>
          <m.div
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
          </m.div>
        </m.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
          {filteredTenders.map((tender, index) => {
            const notification = getSmartNotification(tender);
            const isUrgent = notification && (notification.priority === 'urgent' || notification.priority === 'high');
            
            // ULTIMATE версия - рендерим свой компонент
            if (cardVersion === 'ultimate') {
              return (
                <m.div
                  key={tender.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
                  transition={{ 
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.03
                  }}
                  layout
                >
                  <TenderCardULTIMATE
                    tender={tender}
                    onEdit={() => setEditingTender(tender)}
                    onDelete={() => handleDeleteTender(tender.id)}
                    onStatusChange={handleStatusChange}
                  />
                </m.div>
              );
            }
            
            // Оригинал и NEW - стандартный рендеринг
            return (
            <m.div
              key={tender.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: index * 0.03
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
                    </div>
                    {/* Ссылка + Регион - компактно в одну строку */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                      {tender.link && (
                        <a
                          href={tender.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md border border-blue-200 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="font-medium">{extractDomain(tender.link)}</span>
                        </a>
                      )}
                      {tender.region && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-700 rounded-md border border-gray-200">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span>{tender.region}</span>
                        </div>
                      )}
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
                      <m.div
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
                      </m.div>
                      
                      {/* Кнопка удаления */}
                      <m.div
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
                      </m.div>
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

              {/* Раскрывающееся меню - условный рендеринг версий */}
              {cardVersion === 'original' && (
                <TenderCardExpanded
                  tender={tender}
                  isExpanded={expandedTenderId === tender.id}
                  onToggle={() => setExpandedTenderId(expandedTenderId === tender.id ? null : tender.id)}
                />
              )}
              {cardVersion === 'new' && (
                <TenderCardExpandedNEW
                  tender={tender}
                  isExpanded={expandedTenderId === tender.id}
                  onToggle={() => setExpandedTenderId(expandedTenderId === tender.id ? null : tender.id)}
                />
              )}
            </Card>
            </m.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      <AddTenderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddTender}
        initialData={bookmarkletData}
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
