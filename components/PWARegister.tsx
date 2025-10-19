'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    // Регистрируем Service Worker только в production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Development mode: Service Worker registration skipped');
    }
  }, []);

  return null;
}
