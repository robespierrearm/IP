import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { supabase, Tender } from '@/lib/supabase';
import { toast } from 'sonner';
import { haptics } from '@/lib/haptics';

/**
 * Хук для работы с тендерами через React Query
 * Автоматическое кэширование на 5 минут
 */
export function useTenders() {
  const queryClient = useQueryClient();

  // Получение тендеров с кэшированием
  const { data: tenders = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['tenders'],
    queryFn: async () => {
      const result = await apiClient.getTenders();
      if (result.error) throw new Error(result.error);
      return (result.data as Tender[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    gcTime: 10 * 60 * 1000, // 10 минут в кэше
  });

  // Удаление тендера с оптимистичным обновлением
  const deleteMutation = useMutation({
    mutationFn: async (tenderId: number) => {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);
      
      if (error) throw error;
      return tenderId;
    },
    onMutate: async (tenderId) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: ['tenders'] });
      
      // Сохраняем предыдущее состояние
      const previousTenders = queryClient.getQueryData<Tender[]>(['tenders']);
      
      // Оптимистично удаляем из UI
      queryClient.setQueryData<Tender[]>(['tenders'], (old = []) =>
        old.filter(t => t.id !== tenderId)
      );
      
      return { previousTenders };
    },
    onError: (err, tenderId, context) => {
      // Откатываем при ошибке
      if (context?.previousTenders) {
        queryClient.setQueryData(['tenders'], context.previousTenders);
      }
      haptics.error();
      toast.error('Ошибка удаления', {
        description: 'Не удалось удалить тендер'
      });
    },
    onSuccess: () => {
      haptics.success();
      toast.success('Тендер удалён');
    },
  });

  return { 
    tenders, 
    loading, 
    error: error?.message || null, 
    reload: refetch,
    deleteTender: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
