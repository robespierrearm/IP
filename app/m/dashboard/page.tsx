'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Tender } from '@/lib/supabase';
import { useTenders } from '@/hooks/useQueries';
import { Briefcase, Eye, Bell, TrendingUp, Clock, ChevronRight, X, AlertCircle, RefreshCw } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { getStatusColor } from '@/lib/tender-utils';
import { getSmartNotification } from '@/lib/tender-notifications';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { LiveClock } from '@/components/mobile/LiveClock';

export default function DashboardPage() {
  const router = useRouter();
  
  // React Query - автоматическое кэширование!
  const { data: allTenders = [], isLoading, error, refetch } = useTenders();
  const tenders = allTenders.slice(0, 10); // Первые 10 для мобильной
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  useEffect(() => {
    // Получаем текущего пользователя
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
  }, []);

  // Мемоизированная статистика - пересчитывается только при изменении tenders
  const stats = useMemo(() => {
    const inWorkCount = tenders.filter((t) => t.status === 'в работе').length;
    const underReviewCount = tenders.filter((t) => t.status === 'на рассмотрении').length;

    // Напоминания: тендеры с умными уведомлениями (urgent + high priority)
    const reminders = tenders
      .map((t) => ({ tender: t, notification: getSmartNotification(t) }))
      .filter(({ notification }) => 
        notification && (notification.priority === 'urgent' || notification.priority === 'high')
      )
      .sort((a, b) => {
        // Сортировка: urgent сначала, потом high
        if (a.notification!.priority === 'urgent' && b.notification!.priority !== 'urgent') return -1;
        if (a.notification!.priority !== 'urgent' && b.notification!.priority === 'urgent') return 1;
        return 0;
      })
      .map(({ tender }) => tender);

    return {
      inWork: inWorkCount,
      underReview: underReviewCount,
      reminders: reminders.length,
      reminderTenders: reminders,
    };
  }, [tenders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Шапка - КОМПАКТНАЯ СТЕКЛЯННАЯ */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 border-b border-white/20 px-4 pt-4 pb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-600 text-xs mb-1">Добро пожаловать,</p>
            <h1 className="text-xl font-bold text-gray-900">
              {currentUser?.username || 'Пользователь'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Кнопка обновить */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 bg-white/50 hover:bg-white/70 rounded-lg active:scale-95 transition-all disabled:opacity-50 backdrop-blur-xl"
            >
              <RefreshCw className={`w-4 h-4 text-gray-700 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            
            <div className="text-right">
              <LiveClock />
              <div className="text-gray-500 text-xs">
                {new Date().toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptics.light();
              router.push('/m/tenders?status=в работе');
            }}
            className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-xl p-3 transition-all shadow-sm shadow-green-500/30"
          >
            <Briefcase className="w-5 h-5 text-green-600 mb-1" />
            <div className="text-xl font-bold text-gray-900 mb-0.5">{stats.inWork}</div>
            <div className="text-gray-600 text-xs">В работе</div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptics.light();
              router.push('/m/tenders?status=на рассмотрении');
            }}
            className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-xl p-3 transition-all shadow-sm shadow-orange-500/30"
          >
            <Eye className="w-5 h-5 text-orange-600 mb-1" />
            <div className="text-xl font-bold text-gray-900 mb-0.5">{stats.underReview}</div>
            <div className="text-gray-600 text-xs">Рассмотрение</div>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptics.light();
              setShowRemindersModal(true);
            }}
            className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-xl p-3 transition-all shadow-sm shadow-red-500/30 relative"
          >
            <Bell className="w-5 h-5 text-red-600 mb-1" />
            <div className="text-xl font-bold text-gray-900 mb-0.5">{stats.reminders}</div>
            <div className="text-gray-600 text-xs">Напоминания</div>
            {stats.reminders > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                {stats.reminders}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Последние тендеры */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Последние тендеры</h2>
          <button
            onClick={() => router.push('/m/tenders')}
            className="text-primary-600 text-sm font-medium flex items-center gap-1"
          >
            Все
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {tenders.slice(0, 5).map((tender) => {
            const notification = getSmartNotification(tender);
            return (
            <div
              key={tender.id}
              onClick={() => router.push(`/m/tenders?id=${tender.id}`)}
              className="backdrop-blur-xl bg-white/40 border border-white/20 rounded-xl p-3 shadow-sm hover:shadow-md active:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 text-sm flex-1 line-clamp-2">
                  {tender.name}
                </h3>
                <span
                  className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${getStatusColor(
                    tender.status
                  )}`}
                >
                  {tender.status}
                </span>
              </div>

              {notification && (notification.priority === 'urgent' || notification.priority === 'high') && (
                <div className={`text-xs font-medium mb-2 ${
                  notification.color === 'red' ? 'text-red-600' :
                  notification.color === 'orange' ? 'text-orange-600' :
                  notification.color === 'yellow' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {notification.icon} {notification.shortMessage}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(tender.publication_date)}</span>
                </div>
                {tender.start_price && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-medium text-gray-900">
                      {formatPrice(tender.start_price)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {tenders.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Тендеров пока нет</p>
          </div>
        )}
      </div>

      {/* Модальное окно напоминаний */}
      {showRemindersModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowRemindersModal(false)}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Напоминания</h2>
                    <p className="text-sm text-gray-600">Тендеры с близким дедлайном</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRemindersModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Список напоминаний */}
              {stats.reminderTenders.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Нет напоминаний</p>
                  <p className="text-gray-400 text-xs mt-1">Срочные тендеры появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {stats.reminderTenders.map((tender: Tender) => {
                    const notification = getSmartNotification(tender);
                    const isUrgent = notification?.priority === 'urgent';

                    return (
                      <div
                        key={tender.id}
                        onClick={() => {
                          setShowRemindersModal(false);
                          router.push(`/m/tenders?id=${tender.id}`);
                        }}
                        className={`bg-white border-2 rounded-2xl p-4 shadow-sm active:shadow-md transition-all ${
                          isUrgent ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isUrgent ? 'bg-red-100' : 'bg-amber-100'
                          }`}>
                            <AlertCircle className={`w-5 h-5 ${
                              isUrgent ? 'text-red-600' : 'text-amber-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                              {tender.name}
                            </h3>
                            {notification && (
                              <div className={`text-xs font-medium mb-2 ${
                                notification.color === 'red' ? 'text-red-600' :
                                notification.color === 'orange' ? 'text-orange-600' :
                                notification.color === 'yellow' ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>
                                {notification.icon} {notification.message}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(tender.status)}`}>
                                {tender.status}
                              </span>
                              {tender.start_price && (
                                <span className="text-gray-600">
                                  {formatPrice(tender.start_price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Кнопка закрыть */}
              <button
                onClick={() => setShowRemindersModal(false)}
                className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium active:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
