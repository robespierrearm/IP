import { useState, useEffect, useCallback } from 'react';

interface UseApiQueryOptions<T> {
  queryFn: () => Promise<any>;
  enabled?: boolean;
  cacheTime?: number; // в миллисекундах
  refetchInterval?: number; // автообновление
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Простой in-memory кэш
const cache = new Map<string, CacheEntry<any>>();

export function useApiQuery<T>(
  key: string,
  { queryFn, enabled = true, cacheTime = 5 * 60 * 1000, refetchInterval }: UseApiQueryOptions<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (useCache = true) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Проверяем кэш
    if (useCache) {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      
      if (result.success && result.data) {
        setData(result.data);
        // Сохраняем в кэш
        cache.set(key, {
          data: result.data,
          timestamp: Date.now()
        });
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching ${key}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [key, queryFn, enabled, cacheTime]);

  useEffect(() => {
    fetchData();

    // Автообновление
    if (refetchInterval) {
      const interval = setInterval(() => {
        fetchData(false); // Не используем кэш при автообновлении
      }, refetchInterval);

      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  const refetch = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
  }, [key]);

  return { 
    data, 
    isLoading, 
    error, 
    refetch,
    invalidate 
  };
}

// Очистка всего кэша
export function clearCache() {
  cache.clear();
}

// Очистка конкретного ключа
export function invalidateQuery(key: string) {
  cache.delete(key);
}
