'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверка авторизации через cookies
    const checkAuth = async () => {
      try {
        // Проверяем cookies через API /auth/me
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          cache: 'no-store' 
        });
        
        if (res.ok) {
          const data = await res.json();
          // Сохраняем пользователя в localStorage для быстрого доступа
          if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
          setIsAuthenticated(true);
        } else {
          // Cookies невалидны - очищаем localStorage
          localStorage.removeItem('currentUser');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Первая проверка
    checkAuth();

    // Слушаем кастомное событие (для logout)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-change', handleAuthChange);

    // Периодическая проверка (каждую минуту)
    const interval = setInterval(checkAuth, 60000);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isChecking) return;

    // Публичные пути
    const publicPaths = ['/login', '/test-env', '/clear-cache'];
    const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

    // Если на приватной странице и нет авторизации - редирект на логин
    if (!isPublicPath && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Если на логине и есть авторизация - редирект на дашборд
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
          <p className="text-sm opacity-80">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
