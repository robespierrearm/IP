'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Moon, Sun, LogOut, ChevronRight, Shield, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);

    // Загружаем настройки
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) {
      setNotifications(savedNotifications === 'true');
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

    // Отслеживаем онлайн/офлайн
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Отслеживаем pending изменения
    const updatePendingCount = async () => {
      const count = await apiClient.getPendingChangesCount();
      setPendingCount(count);
    };
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 3000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
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
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem('darkMode', String(newValue));
    
    // Применяем тёмную тему
    if (newValue) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1a1a1a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f9fafb';
    }
    
    toast.success(newValue ? 'Тёмная тема включена' : 'Тёмная тема выключена');
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      haptics.warning();
      toast.error('Нет подключения к интернету');
      return;
    }

    if (pendingCount === 0) {
      haptics.light();
      toast.info('Нет несинхронизированных изменений');
      return;
    }

    setIsSyncing(true);
    haptics.light();
    
    try {
      await apiClient.syncNow();
      haptics.success();
      toast.success('Синхронизация завершена!', {
        description: `Синхронизировано изменений: ${pendingCount}`
      });
      setPendingCount(0);
    } catch (error) {
      haptics.error();
      toast.error('Ошибка синхронизации', {
        description: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    } finally {
      setIsSyncing(false);
    }
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

        {/* Уведомления */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Уведомления</h2>
          
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

        {/* Синхронизация */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Синхронизация</h2>
          
          <div className="space-y-3">
            {/* Статус подключения */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-medium text-gray-900">Подключение</div>
                  <div className="text-sm text-gray-500">
                    {isOnline ? 'Онлайн' : 'Офлайн'}
                  </div>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>

            {/* Несинхронизированные изменения */}
            {pendingCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">Ожидают синхронизации</div>
                    <div className="text-sm text-orange-600">
                      {pendingCount} {pendingCount === 1 ? 'изменение' : 'изменений'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка синхронизации */}
            <button
              onClick={handleManualSync}
              disabled={!isOnline || pendingCount === 0 || isSyncing}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-medium transition-colors ${
                !isOnline || pendingCount === 0 || isSyncing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-500 text-white active:bg-primary-600'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
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
              <span className="text-gray-600">Режим</span>
              <span className="font-medium text-gray-900">PWA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Офлайн режим</span>
              <span className="font-medium text-green-600">Доступен</span>
            </div>
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
