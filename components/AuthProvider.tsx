'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверка авторизации
    const checkAuth = () => {
      const currentUser = localStorage.getItem('currentUser');
      setIsAuthenticated(!!currentUser);
      setIsChecking(false);
    };

    // Первая проверка
    checkAuth();

    // Слушаем изменения localStorage (когда сессия истекает)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        checkAuth();
      }
    };

    // Слушаем кастомное событие (для logout)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);

    // Периодическая проверка (каждые 5 секунд)
    const interval = setInterval(checkAuth, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isChecking) return;

    // Публичные пути
    const publicPaths = ['/login', '/m/login'];
    const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

    // Если на приватной странице и нет авторизации - редирект на логин
    if (!isPublicPath && !isAuthenticated) {
      const isMobile = pathname.startsWith('/m');
      router.replace(isMobile ? '/m/login' : '/login');
      return;
    }

    // Если на публичной странице и есть авторизация - редирект на дашборд
    if (isPublicPath && isAuthenticated) {
      const isMobile = pathname.startsWith('/m');
      router.replace(isMobile ? '/m/dashboard' : '/dashboard');
      return;
    }
  }, [pathname, isAuthenticated, isChecking, router]);

  // Показываем загрузку только при первой проверке
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-600">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm opacity-80">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
