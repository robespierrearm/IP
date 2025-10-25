'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { logActivity, ACTION_TYPES } from '@/lib/activityLogger';
import {
  Home,
  FileText,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  {
    title: 'Дашборд',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Тендеры',
    href: '/tenders',
    icon: FileText,
  },
  {
    title: 'Поставщики',
    href: '/suppliers',
    icon: Users,
  },
  {
    title: 'Бухгалтерия',
    href: '/accounting',
    icon: DollarSign,
  },
  {
    title: 'Чат',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'ИИ-помощник',
    href: '/ai',
    icon: Sparkles,
  },
  {
    title: 'Админка',
    href: '/admin',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTendersOpen, setIsTendersOpen] = useState(true); // Выпадающее меню тендеров
  const [currentUser, setCurrentUser] = useState<{ username?: string; email?: string }>({});

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Загружаем данные пользователя только на клиенте
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setCurrentUser(user);
    }
  }, []);

  // Сворачиваем меню тендеров при переходе на другие страницы
  useEffect(() => {
    if (!pathname.startsWith('/tenders')) {
      setIsTendersOpen(false);
    } else {
      setIsTendersOpen(true);
    }
  }, [pathname]);

  // Функция выхода
  const handleLogout = async () => {
    try {
      // Логируем выход
      await logActivity('Выход из системы', ACTION_TYPES.LOGOUT);

      // Вызываем API logout (удаляет httpOnly cookie и обновляет статус)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Очищаем localStorage
      localStorage.clear();

      // Очищаем sessionStorage
      sessionStorage.clear();

      // Перенаправляем на страницу входа
      router.push('/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Даже при ошибке очищаем и редиректим
      localStorage.clear();
      router.push('/login');
    }
  };
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleTenders = () => setIsTendersOpen(!isTendersOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-white border shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - СТЕКЛЯННЫЙ */}
      <div
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 flex h-screen flex-col border-r bg-gray-50 border-gray-200 shadow-sm transition-all duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-20" : "md:w-64",
          "w-64"
        )}
      >
      {/* Logo - NOTION STYLE */}
      <div className="flex h-20 items-center border-b bg-white border-gray-200">
        
        <Link
          href="/dashboard"
          className="flex-1 flex items-center px-5 py-4 hover:bg-gray-100 transition-all duration-200 group"
          onClick={closeMobileMenu}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <Logo size={40} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  TenderCRM
                </h1>
                <p className="text-xs text-gray-500">Управление тендерами</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto group-hover:scale-110 transition-transform duration-300">
              <Logo size={40} />
            </div>
          )}
        </Link>
        
        <button
          onClick={toggleCollapse}
          className="hidden md:flex items-center justify-center w-14 h-full hover:bg-gray-100 transition-all duration-200 border-l border-gray-200 group"
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-gray-600 group-hover:scale-110 transition-transform" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-gray-600 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/tenders' && pathname.startsWith('/tenders'));
          const isTendersItem = item.href === '/tenders';

          // Если это пункт "Тендеры" - делаем выпадающее меню
          if (isTendersItem) {
            const tabParam = searchParams.get('tab');
            const isAllTenders = pathname === '/tenders' && !tabParam;
            const hasActiveSubtab = pathname === '/tenders' && tabParam;
            
            return (
              <div key={item.href} className="space-y-1">
                {/* Основная кнопка Тендеры - кликабельна и открывает все тендеры */}
                <div className="relative">
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      router.push('/tenders');
                    }}
                    className={cn(
                        'w-full gap-3 transition-all flex items-center rounded-md text-sm font-medium h-9 px-4',
                        isAllTenders
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium'
                          : hasActiveSubtab
                          ? 'bg-gray-100 text-gray-700'
                          : 'hover:bg-gray-100 text-gray-700',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-left">{item.title}</span>
                      )}
                  </button>
                  {!isCollapsed && (
                    <button
                      onClick={toggleTenders}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded"
                    >
                      {isTendersOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>

                {/* Подменю тендеров - СТЕКЛЯННОЕ */}
                {isTendersOpen && !isCollapsed && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-3">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=new');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                          tabParam === 'new'
                            ? 'bg-purple-50 text-purple-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        Новые
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=review');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                          tabParam === 'review'
                            ? 'bg-orange-50 text-orange-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        На рассмотрении
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=inwork');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                          tabParam === 'inwork'
                            ? 'bg-green-50 text-green-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        В работе
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=archive');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                          tabParam === 'archive'
                            ? 'bg-gray-100 text-gray-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        )}
                      >
                        Архив
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // Обычные пункты меню
          return (
            <button
              key={item.href}
              onClick={() => {
                closeMobileMenu();
                router.push(item.href);
              }}
              className={cn(
                'flex items-center gap-3 w-full rounded-md text-sm font-medium h-9 px-4 transition-all',
                isCollapsed ? 'justify-center px-2' : 'justify-start',
                isActive 
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info and Logout - NOTION STYLE */}
      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Имя пользователя */}
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                {currentUser.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentUser.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {currentUser.email || ''}
                </p>
              </div>
            </div>
            
            {/* Кнопка выхода */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all justify-start px-4"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Выход</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Аватар в свернутом виде */}
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {currentUser.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {/* Кнопка выхода в свернутом виде */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-center px-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
              title="Выход"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
