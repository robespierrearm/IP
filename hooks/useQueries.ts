/**
 * React Query hooks для кэширования данных
 * 
 * Преимущества:
 * - Автоматическое кэширование (данные не перезапрашиваются)
 * - Автоматическая инвалидация при мутациях
 * - Оптимистичные обновления
 * - Умные retry стратегии
 * - Background refetch
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Tender, TenderInsert, Supplier } from '@/lib/supabase';

// ============================================================================
// QUERY KEYS (для централизованного управления кэшем)
// ============================================================================

export const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'] as const,
  
  // Tenders
  tenders: {
    all: ['tenders'] as const,
    list: (filters?: { status?: string; limit?: number; offset?: number }) => 
      [...queryKeys.tenders.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.tenders.all, 'detail', id] as const,
  },
  
  // Suppliers
  suppliers: {
    all: ['suppliers'] as const,
    list: (filters?: { search?: string; limit?: number; offset?: number }) => 
      [...queryKeys.suppliers.all, 'list', filters] as const,
    detail: (id: number) => [...queryKeys.suppliers.all, 'detail', id] as const,
  },
  
  // Expenses
  expenses: {
    all: ['expenses'] as const,
    list: (filters?: { tender_id?: number; limit?: number; offset?: number }) => 
      [...queryKeys.expenses.all, 'list', filters] as const,
  },
  
  // Files
  files: {
    all: ['files'] as const,
    dashboard: ['files', 'dashboard'] as const,
  },
};

// ============================================================================
// DASHBOARD
// ============================================================================

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    // Используем глобальные настройки из QueryProvider (5 минут + автообновление)
  });
}

// ============================================================================
// TENDERS - QUERIES
// ============================================================================

export function useTenders(filters?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.tenders.list(filters),
    queryFn: async () => {
      const result = await apiClient.getTenders(filters);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return (result.data || []) as Tender[];
    },
    // Используем глобальные настройки из QueryProvider (5 минут + автообновление)
  });
}

export function useTender(id: number) {
  return useQuery({
    queryKey: queryKeys.tenders.detail(id),
    queryFn: async () => {
      const result = await apiClient.getTenders();
      if (result.error) throw new Error(result.error);
      
      const tenders = result.data as Tender[];
      return tenders.find(t => t.id === id) || null;
    },
    enabled: !!id,
  });
}

// ============================================================================
// TENDERS - MUTATIONS
// ============================================================================

export function useCreateTender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tender: TenderInsert) => {
      const result = await apiClient.createTender(tender);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      // Инвалидируем ВСЕ запросы тендеров
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateTender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Tender> }) => {
      const result = await apiClient.updateTender(id, updates);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Инвалидируем конкретный тендер и списки
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteTender() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiClient.deleteTender(id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (_, id) => {
      // Удаляем из кэша
      queryClient.removeQueries({ queryKey: queryKeys.tenders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ============================================================================
// SUPPLIERS - QUERIES
// ============================================================================

export function useSuppliers(filters?: { search?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(filters),
    queryFn: async () => {
      const result = await apiClient.getSuppliers(filters);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return (result.data || []) as Supplier[];
    },
    // Используем глобальные настройки из QueryProvider (5 минут + автообновление)
  });
}

// ============================================================================
// SUPPLIERS - MUTATIONS
// ============================================================================

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: any) => {
      const result = await apiClient.createSupplier(supplier);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const result = await apiClient.updateSupplier(id, updates);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiClient.deleteSupplier(id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.suppliers.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
    },
  });
}

// ============================================================================
// EXPENSES - QUERIES
// ============================================================================

export function useExpenses(filters?: { tender_id?: number; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: async () => {
      const result = await apiClient.getExpenses(filters);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    },
    // Используем глобальные настройки из QueryProvider (5 минут + автообновление)
  });
}

// ============================================================================
// EXPENSES - MUTATIONS
// ============================================================================

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: any) => {
      const result = await apiClient.createExpense(expense);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await apiClient.deleteExpense(id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
