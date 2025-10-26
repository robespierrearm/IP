'use client';

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
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
import { useCardVersion } from '@/contexts/CardVersionContext';

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
  const [tenderCounts, setTenderCounts] = useState({ new: 0, review: 0, inwork: 0, archive: 0 });
  const { cardVersion, setCardVersion } = useCardVersion();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Загружаем данные пользователя и счётчики тендеров
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setCurrentUser(user);
      loadTenderCounts();
    }
  }, []);

  // Загружаем количество тендеров для каждой вкладки
  const loadTenderCounts = async () => {
    try {
      const { data: tenders } = await supabase.from('tenders').select('status');
      if (tenders) {
        setTenderCounts({
          new: tenders.filter(t => t.status === 'новый' || t.status === 'подано').length,
          review: tenders.filter(t => t.status === 'на рассмотрении').length,
          inwork: tenders.filter(t => t.status === 'в работе').length,
          archive: tenders.filter(t => t.status === 'завершён' || t.status === 'проигрыш').length,
        });
      }
    } catch (error) {
      console.error('Error loading tender counts:', error);
    }
  };

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
      // Пытаемся залогировать выход (не критично если упадёт)
      try {
        await logActivity('Выход из системы', ACTION_TYPES.LOGOUT);
      } catch (logError) {
        console.warn('Failed to log activity (non-critical):', logError);
      }

      // Вызываем API logout (удаляет httpOnly cookie и обновляет статус)
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (fetchError) {
        console.warn('Logout API failed (continuing anyway):', fetchError);
      }

      // Очищаем ТОЛЬКО auth данные (не всё localStorage!)
      localStorage.removeItem('currentUser');
      
      // Уведомляем AuthProvider об изменении
      window.dispatchEvent(new Event('auth-change'));

      // ГАРАНТИРОВАННЫЙ редирект (не router.push!)
      window.location.href = '/login';
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      
      // КРИТИЧНО: Даже при любой ошибке - ВСЕГДА выходим!
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = '/login';
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
          "fixed md:static inset-y-0 left-0 z-40 flex h-screen flex-col border-r backdrop-blur-xl bg-white/40 border-white/20 shadow-lg transition-all duration-300 md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "md:w-20" : "md:w-64",
          "w-64"
        )}
      >
      {/* Logo - СТЕКЛЯННЫЙ */}
      <div className="flex h-20 items-center border-b backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 border-white/20 shadow-lg shadow-blue-500/30">
        
        <Link
          href="/dashboard"
          className="flex-1 flex items-center px-5 py-4 hover:bg-white/30 transition-all duration-200 group"
          onClick={closeMobileMenu}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <Logo size={40} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-700 drop-shadow-lg tracking-tight">
                  TenderCRM
                </h1>
                <p className="text-xs text-blue-600">Управление тендерами</p>
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
          className="hidden md:flex items-center justify-center w-14 h-full hover:bg-white/30 transition-all duration-200 border-l border-white/20 group"
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
          ) : (
            <PanelLeftClose className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
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
                          ? 'backdrop-blur-xl bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-l-4 border-blue-600 shadow-lg shadow-blue-500/50 font-medium'
                          : hasActiveSubtab
                          ? 'backdrop-blur-md bg-white/30 text-gray-700'
                          : 'hover:bg-white/50 text-gray-700',
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
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  )}
                </div>

                {/* Подменю тендеров - СТЕКЛЯННОЕ */}
                {isTendersOpen && !isCollapsed && (
                  <div className="ml-4 space-y-1 border-l-2 border-white/30 pl-3">
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=new');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200',
                          tabParam === 'new'
                            ? 'backdrop-blur-xl bg-purple-500/20 text-purple-700 font-medium shadow-sm shadow-purple-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>Новые</span>
                          {tenderCounts.new > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200 shadow-sm shadow-purple-500/20">
                              {tenderCounts.new}
                            </span>
                          )}
                        </span>
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=review');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200',
                          tabParam === 'review'
                            ? 'backdrop-blur-xl bg-orange-500/20 text-orange-700 font-medium shadow-sm shadow-orange-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>На рассмотрении</span>
                          {tenderCounts.review > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-200 shadow-sm shadow-orange-500/20">
                              {tenderCounts.review}
                            </span>
                          )}
                        </span>
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=inwork');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200',
                          tabParam === 'inwork'
                            ? 'backdrop-blur-xl bg-green-500/20 text-green-700 font-medium shadow-sm shadow-green-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>В работе</span>
                          {tenderCounts.inwork > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 shadow-sm shadow-green-500/20">
                              {tenderCounts.inwork}
                            </span>
                          )}
                        </span>
                    </button>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        router.push('/tenders?tab=archive');
                      }}
                      className={cn(
                          'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200',
                          tabParam === 'archive'
                            ? 'backdrop-blur-xl bg-gray-500/20 text-gray-700 font-medium shadow-sm shadow-gray-500/30 border border-white/20'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        )}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span>Архив</span>
                          {tenderCounts.archive > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-gray-50 text-gray-700 border border-gray-200 shadow-sm shadow-gray-500/20">
                              {tenderCounts.archive}
                            </span>
                          )}
                        </span>
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
                'flex items-center gap-3 w-full rounded-md text-sm font-medium h-9 px-4 transition-all duration-200',
                isCollapsed ? 'justify-center px-2' : 'justify-start',
                isActive 
                  ? 'backdrop-blur-xl bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border-l-4 border-blue-600 shadow-lg shadow-blue-500/50 font-medium'
                  : 'hover:bg-gray-100 hover:text-gray-900 text-gray-700'
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info and Logout - СТЕКЛЯННЫЙ */}
      <div className="border-t border-white/20 p-4 backdrop-blur-xl bg-white/30 flex-shrink-0">
        {!isCollapsed ? (
          <div className="space-y-3">
            {/* Имя пользователя */}
            <div className="px-3 py-2 backdrop-blur-xl bg-white/50 rounded-lg border border-white/20 shadow-sm space-y-2">
              <div className="flex items-center gap-3">
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
              
              {/* Переключатель версий карточек */}
              <div className="flex items-center gap-1 pt-1 border-t border-gray-200">
                <span className="text-[10px] text-gray-500 mr-1">Версия:</span>
                <button
                  onClick={() => setCardVersion('original')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    cardVersion === 'original'
                      ? 'bg-gray-500 text-white shadow-sm'
                      : 'bg-white/50 text-gray-600 hover:bg-white'
                  }`}
                  title="Original"
                >
                  O
                </button>
                <button
                  onClick={() => setCardVersion('new')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    cardVersion === 'new'
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-white/50 text-gray-600 hover:bg-white'
                  }`}
                  title="NEW"
                >
                  N
                </button>
                <button
                  onClick={() => setCardVersion('ultimate')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${
                    cardVersion === 'ultimate'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-white/50 text-gray-600 hover:bg-white'
                  }`}
                  title="ULTIMATE"
                >
                  U
                </button>
              </div>
            </div>
            
            {/* Кнопка выхода */}
            <m.div
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full gap-2 text-red-600 backdrop-blur-xl bg-red-500/10 hover:bg-red-500/20 hover:text-red-700 transition-all justify-start px-4 border border-white/20 shadow-sm hover:shadow-md shadow-red-500/30 hover:shadow-red-500/40 group"
              >
                <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                <span className="font-medium">Выход</span>
              </Button>
            </m.div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Аватар в свернутом виде */}
            <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
              {currentUser.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {/* Кнопка выхода в свернутом виде */}
            <m.div
              whileHover={{ scale: 1.1, rotate: 12 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-center px-2 backdrop-blur-md bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 border border-red-200 shadow-sm hover:shadow-md hover:shadow-red-500/40 transition-all group relative"
                title="Выход"
              >
                <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
            </m.div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
