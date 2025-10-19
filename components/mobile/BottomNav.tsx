'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, FileText, DollarSign, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Главная', href: '/dashboard' },
  { icon: FileText, label: 'Тендеры', href: '/tenders' },
  { icon: DollarSign, label: 'Финансы', href: '/accounting' },
  { icon: Users, label: 'Контакты', href: '/suppliers' },
  { icon: Menu, label: 'Ещё', href: '/menu' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all touch-target',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 active:bg-gray-100'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6 transition-transform',
                  isActive && 'scale-110'
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
