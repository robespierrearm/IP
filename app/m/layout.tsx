'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/mobile/BottomNav';
import { Toaster, toast } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PWARegister } from '@/components/PWARegister';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Делаем toast доступным глобально для offlineSupabase
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).toast = toast;
    }
  }, []);

  useEffect(() => {
    // Пропускаем проверку для страницы логина
    if (pathname === '/m/login') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Проверяем авторизацию БЕЗ задержки (для офлайн-режима)
    try {
      const currentUser = localStorage.getItem('currentUser');
      
      console.log('MobileLayout: Checking auth...', { currentUser: !!currentUser, pathname });
      
      if (!currentUser) {
        console.log('MobileLayout: No user, redirecting to /m/login');
        // Используем window.location вместо router для офлайн-режима
        if (typeof window !== 'undefined') {
          window.location.href = '/m/login';
        }
        setIsLoading(false);
      } else {
        console.log('MobileLayout: User found, authenticated');
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('MobileLayout: Error checking auth', error);
      setIsLoading(false);
      // Используем window.location вместо router для офлайн-режима
      if (typeof window !== 'undefined') {
        window.location.href = '/m/login';
      }
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">Перенаправление...</p>
        </div>
      </div>
    );
  }

  // Если это страница логина - показываем без BottomNav
  if (pathname === '/m/login') {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      {/* Регистрация PWA и Service Worker - ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ТЕСТА */}
      {/* <PWARegister /> */}
      
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Безопасная зона сверху для iPhone */}
        <div className="safe-top" />
        
        {/* Контент */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Нижняя навигация */}
        <BottomNav />
        
        {/* Toast уведомления */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '16px',
            },
            className: 'shadow-lg',
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
