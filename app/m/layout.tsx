'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNav } from '@/components/mobile/BottomNav';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Пропускаем проверку для страницы логина
    if (pathname === '/m/login') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Небольшая задержка для инициализации
    const timer = setTimeout(() => {
      try {
        // Проверяем авторизацию
        const currentUser = localStorage.getItem('currentUser');
        
        console.log('MobileLayout: Checking auth...', { currentUser: !!currentUser, pathname });
        
        if (!currentUser) {
          console.log('MobileLayout: No user, redirecting to /m/login');
          router.replace('/m/login');
          setIsLoading(false);
        } else {
          console.log('MobileLayout: User found, authenticated');
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('MobileLayout: Error checking auth', error);
        setIsLoading(false);
        router.replace('/m/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router, pathname]);

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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Безопасная зона сверху для iPhone */}
      <div className="safe-top" />
      
      {/* Контент */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Нижняя навигация */}
      <BottomNav />
    </div>
  );
}
