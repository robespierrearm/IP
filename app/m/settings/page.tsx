'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { User, Bell, Moon, Sun, LogOut, ChevronRight, Shield, Lock, Mail, Phone, Briefcase, Download, Trash2, Info, MessageSquare } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [deadlineNotifications, setDeadlineNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationDays, setNotificationDays] = useState(3);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);

    // Загружаем настройки
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === 'true');
    }

    const savedDeadlineNotifications = localStorage.getItem('deadlineNotifications');
    if (savedDeadlineNotifications !== null) {
      setDeadlineNotifications(savedDeadlineNotifications === 'true');
    }

    const savedEmailNotifications = localStorage.getItem('emailNotifications');
    if (savedEmailNotifications !== null) {
      setEmailNotifications(savedEmailNotifications === 'true');
    }

    const savedNotificationDays = localStorage.getItem('notificationDays');
    if (savedNotificationDays !== null) {
      setNotificationDays(parseInt(savedNotificationDays));
    }

    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      // Применяем тёмную тему сразу при загрузке
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleNotificationsToggle = async () => {
    haptics.light();
    const newValue = !notifications;
    
    if (newValue) {
      // Включаем уведомления - запрашиваем разрешение
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotifications(true);
          localStorage.setItem('notifications', 'true');
          toast.success('Уведомления включены');
          
          // Показываем тестовое уведомление
          new Notification('TenderCRM', {
            body: 'Уведомления успешно включены!',
            icon: '/icon-static.svg',
          });
        } else {
          toast.error('Разрешение на уведомления отклонено');
        }
      } else {
        toast.error('Уведомления не поддерживаются');
      }
    } else {
      // Выключаем уведомления
      setNotifications(false);
      localStorage.setItem('notifications', 'false');
      toast.success('Уведомления выключены');
    }
  };

  const handleDarkModeToggle = () => {
    haptics.light();
    toast.info('Тёмная тема', {
      description: 'Функция в разработке. Будет доступна в следующей версии.'
    });
    // Временно отключено
    // const newValue = !darkMode;
    // setDarkMode(newValue);
    // localStorage.setItem('darkMode', String(newValue));
  };

  const handleDeadlineNotificationsToggle = () => {
    haptics.light();
    const newValue = !deadlineNotifications;
    setDeadlineNotifications(newValue);
    localStorage.setItem('deadlineNotifications', String(newValue));
    toast.success(newValue ? 'Уведомления о дедлайнах включены' : 'Уведомления о дедлайнах выключены');
  };

  const handleEmailNotificationsToggle = () => {
    haptics.light();
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    localStorage.setItem('emailNotifications', String(newValue));
    toast.success(newValue ? 'Email уведомления включены' : 'Email уведомления выключены');
  };

  const handleNotificationDaysChange = (days: number) => {
    haptics.light();
    setNotificationDays(days);
    localStorage.setItem('notificationDays', String(days));
    toast.success(`Уведомления за ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} до дедлайна`);
  };

  const handleChangePassword = () => {
    haptics.medium();
    router.push('/m/settings/change-password');
  };

  const handleEditProfile = () => {
    haptics.medium();
    router.push('/m/settings/edit-profile');
  };

  const handleClearCache = () => {
    haptics.medium();
    if (confirm('Очистить кэш приложения? Это может помочь решить проблемы с производительностью.')) {
      // Подсчитываем сколько данных удаляем
      
      // 1. React Query кэш
      const queryCache = queryClient.getQueryCache();
      const queriesCount = queryCache.getAll().length;
      
      // 2. localStorage размер
      let localStorageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length + key.length;
        }
      }
      const localStorageSizeKB = (localStorageSize / 1024).toFixed(2);
      
      // Очищаем React Query кэш
      queryClient.clear();
      
      // Очищаем localStorage (кроме currentUser)
      const user = localStorage.getItem('currentUser');
      localStorage.clear();
      if (user) localStorage.setItem('currentUser', user);
      
      haptics.success();
      toast.success('Кэш очищен!', {
        description: `Удалено: ${queriesCount} запросов + ${localStorageSizeKB} KB данных`,
        duration: 3000
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  const handleExportData = async () => {
    haptics.medium();
    toast.info('Экспорт данных', {
      description: 'Функция в разработке. Будет доступна в следующей версии.'
    });
  };

  const handleFeedback = () => {
    haptics.medium();
    toast.info('Обратная связь', {
      description: 'Напишите нам в Telegram: @your_support_bot'
    });
  };

  const handleLogout = async () => {
    haptics.medium();
    if (confirm('Вы уверены, что хотите выйти?')) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/m/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Профиль */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Профиль</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-gray-900">
                {currentUser?.username || 'Пользователь'}
              </div>
              <div className="text-sm text-gray-500">
                {currentUser?.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </div>
            </div>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Права администратора</span>
            </div>
          )}
        </div>

        {/* Действия с профилем */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Управление профилем</h2>
          
          <div className="space-y-2">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Редактировать профиль</div>
                  <div className="text-sm text-gray-500">Имя, email, телефон</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Изменить пароль</div>
                  <div className="text-sm text-gray-500">Безопасность аккаунта</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Уведомления */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Уведомления</h2>
          
          <div className="space-y-3">
            {/* Push уведомления */}
            <button
              onClick={handleNotificationsToggle}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Push-уведомления</div>
                  <div className="text-sm text-gray-500">
                    {notifications ? 'Включены' : 'Выключены'}
                  </div>
                </div>
              </div>
              <div className={`relative w-12 h-7 rounded-full transition-all duration-300 ${notifications ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${notifications ? 'left-6' : 'left-1'}`} />
              </div>
            </button>

            {/* Уведомления о дедлайнах */}
            <button
              onClick={handleDeadlineNotificationsToggle}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Дедлайны тендеров</div>
                  <div className="text-sm text-gray-500">
                    {deadlineNotifications ? 'Включены' : 'Выключены'}
                  </div>
                </div>
              </div>
              <div className={`relative w-12 h-7 rounded-full transition-all duration-300 ${deadlineNotifications ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${deadlineNotifications ? 'left-6' : 'left-1'}`} />
              </div>
            </button>

            {/* Период уведомлений */}
            {deadlineNotifications && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-sm font-medium text-gray-900 mb-3">Уведомлять за:</div>
                <div className="flex gap-2">
                  {[1, 3, 7].map(days => (
                    <button
                      key={days}
                      onClick={() => handleNotificationDaysChange(days)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        notificationDays === days
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email уведомления */}
            <button
              onClick={handleEmailNotificationsToggle}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Email уведомления</div>
                  <div className="text-sm text-gray-500">
                    {emailNotifications ? 'Включены' : 'Выключены'}
                  </div>
                </div>
              </div>
              <div className={`relative w-12 h-7 rounded-full transition-all duration-300 ${emailNotifications ? 'bg-primary-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${emailNotifications ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Внешний вид */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Внешний вид</h2>
          
          <button
            onClick={handleDarkModeToggle}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-purple-600" />
                ) : (
                  <Sun className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Тёмная тема</div>
                <div className="text-sm text-gray-500">
                  {darkMode ? 'Включена' : 'Выключена'}
                </div>
              </div>
            </div>
            <div className={`relative w-12 h-7 rounded-full transition-all duration-300 ${darkMode ? 'bg-primary-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${darkMode ? 'left-6' : 'left-1'}`} />
            </div>
          </button>
        </div>

        {/* Данные и хранилище */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Данные и хранилище</h2>
          
          <div className="space-y-2">
            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Очистить кэш</div>
                  <div className="text-sm text-gray-500">Освободить место</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Экспорт данных</div>
                  <div className="text-sm text-gray-500">Скачать в Excel</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* О приложении */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">О приложении</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Версия</span>
              <span className="font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Платформа</span>
              <span className="font-medium text-gray-900">Web App</span>
            </div>
            
            <button
              onClick={handleFeedback}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors mt-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Обратная связь</div>
                  <div className="text-sm text-gray-500">Сообщить о проблеме</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Выход */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 rounded-2xl p-4 font-semibold flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Выйти из системы
        </button>
      </div>
    </div>
  );
}
