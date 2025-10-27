'use client';

import { BottomNav } from '@/components/mobile/BottomNav';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
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
