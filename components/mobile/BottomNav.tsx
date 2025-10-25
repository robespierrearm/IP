'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, DollarSign, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { useState, useTransition } from 'react';

const navItems = [
  { icon: Home, label: 'Главная', href: '/m/dashboard' },
  { icon: FileText, label: 'Тендеры', href: '/m/tenders' },
  { icon: DollarSign, label: 'Финансы', href: '/m/accounting' },
  { icon: Users, label: 'Контакты', href: '/m/suppliers' },
  { icon: Menu, label: 'Ещё', href: '/m/menu' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-white/80 border-t border-white/20 safe-bottom z-40 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isPendingThis = pendingPath === item.href;

          const handleClick = () => {
            if (pathname === item.href) return; // Уже на этой странице
            
            // 1. Мгновенная вибрация
            haptics.light();
            
            // 2. Мгновенно показываем что кнопка нажата
            setPendingPath(item.href);
            
            // 3. Prefetch для быстрой загрузки
            router.prefetch(item.href);
            
            // 4. Переходим сразу (не в transition)
            router.push(item.href);
            
            // 5. Сбрасываем pending через 100ms
            setTimeout(() => setPendingPath(null), 100);
          };

          return (
            <button
              key={item.href}
              onClick={handleClick}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target',
                isActive || isPendingThis
                  ? 'text-blue-600 backdrop-blur-xl bg-blue-500/20 border border-white/20 shadow-sm shadow-blue-500/30'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-transform',
                  (isActive || isPendingThis) && 'scale-110'
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
