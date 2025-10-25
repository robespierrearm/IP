'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider для кэширования и оптимизации API запросов
 * 
 * Настройки оптимизированы для CRM:
 * - staleTime: 2 минуты - данные считаются свежими (уменьшено для актуальности)
 * - gcTime: 10 минут - данные хранятся в кэше
 * - refetchOnWindowFocus: false - НЕ перезагружать при фокусе (экономия запросов)
 * - refetchOnReconnect: true - обновить при восстановлении сети
 * - retry: 2 - две попытки при ошибке
 * 
 * Преимущества:
 * ✅ Данные НЕ перезапрашиваются при переключении вкладок
 * ✅ Автоматическая инвалидация после изменений
 * ✅ Оптимистичные обновления UI
 * ✅ Background refetch для свежести данных
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Данные свежие 2 минуты - не перезапрашиваются
            staleTime: 2 * 60 * 1000,
            
            // Хранить в памяти 10 минут после последнего использования
            gcTime: 10 * 60 * 1000,
            
            // НЕ перезагружать при переключении вкладок (главная оптимизация!)
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
