import { useApiQuery } from './useApiQuery';
import { apiClient } from '@/lib/api-client';
import { Tender } from '@/lib/supabase';

interface UseTendersOptions {
  status?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useTendersApi(options: UseTendersOptions = {}) {
  const { status, limit, offset, enabled = true, refetchInterval } = options;

  // Создаём уникальный ключ для кэша
  const cacheKey = `tenders-${status || 'all'}-${limit || 'all'}-${offset || 0}`;

  const { data, isLoading, error, refetch, invalidate } = useApiQuery<Tender[]>(
    cacheKey,
    {
      queryFn: () => apiClient.getTenders({ status, limit, offset }),
      enabled,
      cacheTime: 2 * 60 * 1000, // 2 минуты
      refetchInterval,
    }
  );

  return {
    tenders: data || [],
    isLoading,
    error,
    refetch,
    invalidate,
  };
}

// Хук для создания тендера
export function useCreateTender() {
  return async (tender: any) => {
    const result = await apiClient.createTender(tender);
    if (result.success) {
      // Инвалидируем кэш всех тендеров
      const { invalidateQuery } = await import('./useApiQuery');
      // Очищаем все кэши тендеров
      Array.from({ length: 10 }).forEach((_, i) => {
        invalidateQuery(`tenders-all-all-${i * 20}`);
        invalidateQuery(`tenders-новый-all-${i * 20}`);
        invalidateQuery(`tenders-в работе-all-${i * 20}`);
      });
    }
    return result;
  };
}

// Хук для обновления тендера
export function useUpdateTender() {
  return async (id: number, updates: any) => {
    const result = await apiClient.updateTender(id, updates);
    if (result.success) {
      const { invalidateQuery } = await import('./useApiQuery');
      Array.from({ length: 10 }).forEach((_, i) => {
        invalidateQuery(`tenders-all-all-${i * 20}`);
        invalidateQuery(`tenders-новый-all-${i * 20}`);
        invalidateQuery(`tenders-в работе-all-${i * 20}`);
      });
    }
    return result;
  };
}

// Хук для удаления тендера
export function useDeleteTender() {
  return async (id: number) => {
    const result = await apiClient.deleteTender(id);
    if (result.success) {
      const { invalidateQuery } = await import('./useApiQuery');
      Array.from({ length: 10 }).forEach((_, i) => {
        invalidateQuery(`tenders-all-all-${i * 20}`);
        invalidateQuery(`tenders-новый-all-${i * 20}`);
        invalidateQuery(`tenders-в работе-all-${i * 20}`);
      });
    }
    return result;
  };
}
