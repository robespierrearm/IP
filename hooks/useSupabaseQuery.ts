import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseSupabaseQueryOptions<T> {
  table: string;
  select?: string;
  filter?: (query: any) => any;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
}

export function useSupabaseQuery<T>({
  table,
  select = '*',
  filter,
  orderBy,
  limit,
  enabled = true,
}: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let query = supabase.from(table).select(select);

        if (filter) {
          query = filter(query);
        }

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data: result, error: queryError } = await query;

        if (queryError) throw queryError;

        setData((result as T[]) || []);
      } catch (err) {
        setError(err as Error);
        console.error(`Error fetching from ${table}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [table, select, enabled, limit]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      if (filter) {
        query = filter(query);
      }

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) throw queryError;

      setData((result as T[]) || []);
    } catch (err) {
      setError(err as Error);
      console.error(`Error refetching from ${table}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch };
}
