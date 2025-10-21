'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider для кэширования и оптимизации API запросов
 * 
 * Настройки:
 * - staleTime: 5 минут - данные считаются свежими
 * - cacheTime: 10 минут - данные хранятся в кэше
 * - refetchOnWindowFocus: false - не перезагружать при фокусе
 * - retry: 1 - одна попытка при ошибке
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 минут - данные свежие
            gcTime: 10 * 60 * 1000, // 10 минут - хранить в кэше (было cacheTime)
            refetchOnWindowFocus: false, // Не перезагружать при фокусе
            refetchOnReconnect: true, // Перезагрузить при восстановлении сети
            retry: 1, // Одна попытка при ошибке
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
