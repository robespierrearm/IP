'use client';

import { useEffect, useState } from 'react';
import { supabase, Tender } from '@/lib/supabase';
import { Briefcase, Eye, Bell, TrendingUp, Clock, ChevronRight, X, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [stats, setStats] = useState({
    inWork: 0,
    underReview: 0,
    reminders: 0,
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [reminderTenders, setReminderTenders] = useState<Tender[]>([]);

  useEffect(() => {
    // Получаем текущего пользователя
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);

    // Загружаем данные
    loadData();

    // Обновляем время каждую секунду
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    const { data, error } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTenders(data);

      // Подсчёт статистики
      const inWorkCount = data.filter((t) => t.status === 'в работе').length;
      const underReviewCount = data.filter((t) => t.status === 'на рассмотрении').length;

      // Напоминания: тендеры с дедлайном в ближайшие 3 дня
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const reminders = data.filter((t) => {
        if (!t.submission_deadline) return false;
        const deadline = new Date(t.submission_deadline);
        const now = new Date();
        return deadline >= now && deadline <= threeDaysFromNow;
      });
      setReminderTenders(reminders);
      const remindersCount = reminders.length;

      setStats({
        inWork: inWorkCount,
        underReview: underReviewCount,
        reminders: remindersCount,
      });
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка с градиентом */}
      <div className="bg-gradient-to-br from-primary-500 to-secondary-600 px-6 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm mb-1">Добро пожаловать,</p>
            <h1 className="text-2xl font-bold text-white">
              {currentUser?.username || 'Пользователь'}
            </h1>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">
              {currentTime.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-white/80 text-xs">
              {currentTime.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3">
          <div
            onClick={() => router.push('/m/tenders?status=в работе')}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 active:bg-white/20 transition-colors"
          >
            <Briefcase className="w-6 h-6 text-white mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.inWork}</div>
            <div className="text-white/80 text-xs">В работе</div>
          </div>

          <div
            onClick={() => router.push('/m/tenders?status=на рассмотрении')}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 active:bg-white/20 transition-colors"
          >
            <Eye className="w-6 h-6 text-white mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.underReview}</div>
            <div className="text-white/80 text-xs">Рассмотрение</div>
          </div>

          <div
            onClick={() => setShowRemindersModal(true)}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 active:bg-white/20 transition-colors relative"
          >
            <Bell className="w-6 h-6 text-white mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.reminders}</div>
            <div className="text-white/80 text-xs">Напоминания</div>
            {stats.reminders > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {stats.reminders}
              </div>
            )}
          </div>
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
          {tenders.slice(0, 5).map((tender) => (
            <div
              key={tender.id}
              onClick={() => router.push(`/m/tenders?id=${tender.id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm active:shadow-md transition-shadow"
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
          ))}
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
              {reminderTenders.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Нет напоминаний</p>
                  <p className="text-gray-400 text-xs mt-1">Тендеры с дедлайном в ближайшие 3 дня появятся здесь</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminderTenders.map((tender) => {
                    const deadline = new Date(tender.submission_deadline!);
                    const now = new Date();
                    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const isUrgent = daysLeft <= 1;

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
                            <div className={`text-xs font-medium mb-2 ${
                              isUrgent ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              {isUrgent ? '🔥 Срочно!' : '⏰'} Дедлайн: {formatDate(tender.submission_deadline!)}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-1 rounded-lg font-medium ${
                                isUrgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {daysLeft === 0 ? 'Сегодня!' : daysLeft === 1 ? 'Завтра' : `Осталось ${daysLeft} дн.`}
                              </span>
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(tender.status)}`}>
                                {tender.status}
                              </span>
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
