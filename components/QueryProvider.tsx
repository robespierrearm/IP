'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider для кэширования и оптимизации API запросов
 * 
 * Настройки оптимизированы для CRM:
 * - staleTime: 5 минут - данные считаются свежими
 * - refetchInterval: 5 минут - автообновление в фоне каждые 5 минут
 * - gcTime: 30 минут - данные хранятся в кэше
 * - refetchOnWindowFocus: false - НЕ перезагружать при фокусе (экономия запросов)
 * - refetchOnReconnect: true - обновить при восстановлении сети
 * - retry: 2 - две попытки при ошибке
 * 
 * Преимущества:
 * ✅ Данные НЕ перезапрашиваются при переключении вкладок
 * ✅ Автообновление каждые 5 минут в фоне
 * ✅ Ручное обновление кнопкой refetch()
 * ✅ Автоматическая инвалидация после CRUD операций
 * ✅ Оптимистичные обновления UI
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные свежие 5 минут - после этого автоматически обновятся
            staleTime: 5 * 60 * 1000,
            
            // Автообновление каждые 5 минут в фоне
            refetchInterval: 5 * 60 * 1000,
            
            // Хранить в памяти 30 минут после последнего использования
            gcTime: 30 * 60 * 1000,
            
            // НЕ перезагружать при переключении вкладок (экономия запросов!)
            refetchOnWindowFocus: false,
            
            // Обновить данные при восстановлении сети
            refetchOnReconnect: true,
            
            // Retry стратегия
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry для мутаций (создание/обновление/удаление)
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools только в development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}
