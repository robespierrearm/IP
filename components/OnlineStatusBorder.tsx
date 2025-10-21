'use client';

import { useEffect, useState } from 'react';
import { syncQueue, SyncStatus } from '@/lib/sync-queue';

interface OnlineStatusBorderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Компонент-обёртка с цветной обводкой
 * 🟢 Зелёная - онлайн
 * 🔴 Красная - офлайн
 * 🟡 Жёлтая - синхронизация
 */
export function OnlineStatusBorder({ children, className = '' }: OnlineStatusBorderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Начальное состояние
    setIsOnline(navigator.onLine);

    // Слушаем изменения онлайн/офлайн
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Слушаем статус синхронизации
    const unsubscribe = syncQueue.onSyncStatusChange((status) => {
      setSyncStatus(status);
    });

    // Обновляем счётчик несинхронизированных изменений
    const updatePendingCount = async () => {
      const count = await syncQueue.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Каждые 5 секунд

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Определяем цвет обводки
  const getBorderColor = () => {
    if (!isOnline) {
      return 'border-red-500'; // 🔴 Офлайн
    }
    if (syncStatus === 'syncing') {
      return 'border-yellow-500'; // 🟡 Синхронизация
    }
    if (pendingCount > 0) {
      return 'border-orange-500'; // 🟠 Есть несинхронизированные изменения
    }
    return 'border-green-500'; // 🟢 Всё синхронизировано
  };

  // Определяем толщину обводки (пульсация при синхронизации)
  const getBorderWidth = () => {
    if (syncStatus === 'syncing') {
      return 'border-[5px] animate-pulse';
    }
    return 'border-[4px]';
  };

  // Получаем цвет для градиента
  const getGradientColor = () => {
    if (!isOnline) return '#ef4444'; // red-500
    if (syncStatus === 'syncing') return '#eab308'; // yellow-500
    if (pendingCount > 0) return '#f97316'; // orange-500
    return '#22c55e'; // green-500
  };

  return (
    <div className={`relative ${className}`}>
      {/* Анимированная обводка */}
      <div 
        className="relative rounded-b-3xl p-[4px]"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent 0%, ${getGradientColor()} 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'borderFlow 3s linear infinite',
        }}
      >
        {/* Внутренняя обводка */}
        <div 
          className="relative rounded-b-3xl overflow-hidden"
          style={{
            boxShadow: `inset 0 0 0 4px ${getGradientColor()}`,
            transition: 'box-shadow 0.5s ease-in-out',
          }}
        >
          {children}
        </div>
      </div>

      {/* Индикатор несинхронизированных изменений */}
      {pendingCount > 0 && (
        <div className="absolute top-6 right-6 z-20">
          <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
            <svg
              className="w-3 h-3 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {pendingCount}
          </div>
        </div>
      )}

      {/* Текстовый индикатор */}
      {!isOnline && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
            🔴 Офлайн режим
          </div>
        </div>
      )}
    </div>
  );
}
