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
          "fixed md:static inset-y-0 left-0 z-40 flex h-screen flex-col border-r backdrop-blur-xl bg-gray-900/95 border-gray-700/50 shadow-2xl transition-all duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-20" : "md:w-64",
          "w-64"
        )}
      >
      {/* Logo - ТЁМНЫЙ */}
      <div className="flex h-20 items-center border-b backdrop-blur-xl bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-indigo-600/30 border-gray-700/50 relative overflow-hidden shadow-lg shadow-blue-500/30">
        {/* Декоративный фон */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <Link
          href="/dashboard"
          className="flex-1 flex items-center px-5 py-4 hover:bg-white/5 transition-all duration-300 relative z-10 group"
          onClick={closeMobileMenu}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <Logo size={40} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-400 drop-shadow-lg tracking-tight">
                  TenderCRM
                </h1>
                <p className="text-xs text-blue-300">Управление тендерами</p>
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
          className="hidden md:flex items-center justify-center w-14 h-full hover:bg-white/5 transition-all duration-300 border-l border-gray-700/50 relative z-10 group"
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
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
                          ? 'backdrop-blur-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-l-4 border-blue-500 shadow-lg shadow-blue-500/50'
                          : hasActiveSubtab
                          ? 'backdrop-blur-xl bg-gray-700/30 text-gray-300'
                          : 'hover:bg-gray-800/50 text-gray-300',
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
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>

                {/* Подменю тендеров - СТЕКЛЯННОЕ */}
                {isTendersOpen && !isCollapsed && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-700/50 pl-3">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=new');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all',
                          tabParam === 'new'
                            ? 'backdrop-blur-xl bg-purple-500/20 text-purple-300 font-medium shadow-sm shadow-purple-500/30 border border-gray-700/30'
                            : 'text-gray-400 hover:backdrop-blur-xl hover:bg-gray-800/50'
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
                            ? 'backdrop-blur-xl bg-orange-500/20 text-orange-300 font-medium shadow-sm shadow-orange-500/30 border border-gray-700/30'
                            : 'text-gray-400 hover:backdrop-blur-xl hover:bg-gray-800/50'
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
                            ? 'backdrop-blur-xl bg-green-500/20 text-green-300 font-medium shadow-sm shadow-green-500/30 border border-gray-700/30'
                            : 'text-gray-400 hover:backdrop-blur-xl hover:bg-gray-800/50'
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
                            ? 'backdrop-blur-xl bg-gray-500/20 text-gray-300 font-medium shadow-sm shadow-gray-500/30 border border-gray-700/30'
                            : 'text-gray-400 hover:backdrop-blur-xl hover:bg-gray-800/50'
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
                  ? 'backdrop-blur-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-l-4 border-blue-500 shadow-lg shadow-blue-500/50'
                  : 'hover:bg-gray-800/50 text-gray-300'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info and Logout - ТЁМНЫЙ */}
      <div className="border-t border-gray-700/50 p-4 backdrop-blur-xl bg-gray-800/50 flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Имя пользователя */}
            <div className="flex items-center gap-3 px-3 py-2 backdrop-blur-xl bg-gray-800/70 rounded-lg border border-gray-700/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
                {currentUser.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser.username || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {currentUser.email || ''}
                </p>
              </div>
            </div>
            
            {/* Кнопка выхода */}
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full gap-2 text-red-400 backdrop-blur-xl bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-all justify-start px-4 border border-gray-700/30 shadow-sm shadow-red-500/30"
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
