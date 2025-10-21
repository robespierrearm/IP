'use client';

import { useEffect } from 'react';
import { syncQueue } from '@/lib/sync-queue';

export function PWARegister() {
  useEffect(() => {
    // Регистрируем Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);

          // Слушаем сообщения от Service Worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SYNC_REQUEST') {
              console.log('🔄 Получен запрос на синхронизацию от SW');
              syncQueue.syncAll();
            }
          });

          // Регистрируем Background Sync
          if ('sync' in registration) {
            registration.sync.register('sync-data').catch((err) => {
              console.warn('⚠️ Background Sync не поддерживается:', err);
            });
          }

          // Регистрируем Periodic Sync (если поддерживается)
          if ('periodicSync' in registration) {
            (registration as any).periodicSync
              .register('sync-tenders', {
                minInterval: 60 * 60 * 1000, // 1 час
              })
              .catch((err: any) => {
                console.warn('⚠️ Periodic Sync не поддерживается:', err);
              });
          }
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
