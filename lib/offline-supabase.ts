/**
 * Офлайн-обёртка для Supabase
 * Автоматически использует IndexedDB когда нет интернета
 */

import { offlineDB, OfflineData } from './offline-db';
import { syncQueue } from './sync-queue';
import { supabase, Tender, Supplier, Expense } from './supabase';

type TableName = 'tenders' | 'suppliers' | 'expenses';

export class OfflineSupabase {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private initialized = false;
  private preloadAttempted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Инициализируем IndexedDB сразу
      this.initializeDB();
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        console.log('🟢 Онлайн режим');
        
        // Показываем уведомление
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.success('Подключение восстановлено', {
            description: 'Синхронизация данных...'
          });
        }
        
        // При подключении к интернету - синхронизируем
        syncQueue.syncAll().catch(console.error);
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        console.log('🔴 Офлайн режим');
        
        // Показываем уведомление
        if (typeof window !== 'undefined' && (window as any).toast) {
          (window as any).toast.error('Нет подключения к интернету', {
            description: 'Работаем в офлайн-режиме'
          });
        }
      });
    }
  }

  /**
   * Инициализация IndexedDB
   * Вызывается автоматически при создании экземпляра
   */
  private async initializeDB() {
    try {
      await offlineDB.init();
      this.initialized = true;
      console.log('✅ IndexedDB инициализирован');
      
      // Предзагрузка данных при первом запуске
      if (this.isOnline && !this.preloadAttempted) {
        this.preloadData();
      }
    } catch (error) {
      console.error('❌ Ошибка инициализации IndexedDB:', error);
      this.initialized = false;
    }
  }

  /**
   * Предзагрузка данных в фоне
   * Загружает все данные с сервера и сохраняет в IndexedDB
   */
  private async preloadData() {
    if (this.preloadAttempted) return;
    this.preloadAttempted = true;

    try {
      console.log('📥 Предзагрузка данных для офлайн-режима...');
      
      // Загружаем все данные параллельно
      await Promise.allSettled([
        this.getTenders(),
        this.getSuppliers(),
        this.getExpenses(),
      ]);
      
      console.log('✅ Предзагрузка завершена');
    } catch (error) {
      console.error('❌ Ошибка предзагрузки:', error);
    }
  }

  /**
   * Проверка инициализации IndexedDB
   * Если не инициализирован - пытаемся инициализировать
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeDB();
    }
    if (!this.initialized) {
      throw new Error('IndexedDB не доступен');
    }
  }

  // === SELECT (чтение) ===

  /**
   * Получение всех тендеров
   * Стратегия: Network First с fallback на IndexedDB
   */
  async getTenders(): Promise<Tender[]> {
    await this.ensureInitialized();

    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Сохраняем в IndexedDB
        await offlineDB.saveMany(
          'tenders',
          data.map((t) => ({
            id: t.id,
            data: t,
            updated_at: t.updated_at || new Date().toISOString(),
            synced: true,
          }))
        );
        console.log(`✅ Загружено ${data.length} тендеров с сервера`);
        return data;
      }
    } catch (error) {
      console.log('📦 Используем кэш тендеров (офлайн)');
    }

    // Офлайн или ошибка - берём из IndexedDB
    const cached = await offlineDB.getAll<Tender>('tenders');
    const tenders = cached.map((item: any) => item.data).filter((t: any) => !(t as any).deleted);
    console.log(`📦 Загружено ${tenders.length} тендеров из кэша`);
    return tenders;
  }

  async getSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        await offlineDB.saveMany(
          'suppliers',
          data.map((s) => ({
            id: s.id,
            data: s,
            updated_at: s.updated_at || new Date().toISOString(),
            synced: true,
          }))
        );
        return data;
      }
    } catch (error) {
      console.log('📦 Используем кэш поставщиков (офлайн)');
    }

    const cached = await offlineDB.getAll<Supplier>('suppliers');
    return cached.map((item: any) => item.data).filter((s: any) => !(s as any).deleted);
  }

  async getExpenses(): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        await offlineDB.saveMany(
          'expenses',
          data.map((e) => ({
            id: e.id,
            data: e,
            updated_at: e.updated_at || new Date().toISOString(),
            synced: true,
          }))
        );
        return data;
      }
    } catch (error) {
      console.log('📦 Используем кэш расходов (офлайн)');
    }

    const cached = await offlineDB.getAll<Expense>('expenses');
    return cached.map((item: any) => item.data).filter((e: any) => !(e as any).deleted);
  }

  // === INSERT (создание) ===

  async createTender(tender: Partial<Tender>): Promise<Tender | null> {
    console.log('📝 createTender вызван:', { tender, isOnline: this.isOnline });
    
    const newTender = {
      ...tender,
      id: tender.id || Date.now(), // Временный ID для офлайна
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Tender;

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('tenders')
          .insert(tender)
          .select()
          .single();

        if (!error && data) {
          // Сохраняем в IndexedDB
          await offlineDB.save('tenders', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          console.log('✅ Тендер создан онлайн:', data);
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка создания тендера, сохраняем офлайн');
      }
    }

    // Офлайн - сохраняем локально и добавляем в очередь
    console.log('💾 Сохраняем тендер офлайн:', newTender);
    await offlineDB.save('tenders', {
      id: newTender.id,
      data: newTender,
      updated_at: newTender.updated_at,
      synced: false,
    });

    await syncQueue.queueCreate('tenders', newTender);
    console.log('✅ Тендер сохранён офлайн');
    return newTender;
  }

  async createSupplier(supplier: Partial<Supplier>): Promise<Supplier | null> {
    console.log('📝 createSupplier вызван:', { supplier, isOnline: this.isOnline });
    
    const newSupplier = {
      ...supplier,
      id: supplier.id || Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Supplier;

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .insert(supplier)
          .select()
          .single();

        if (!error && data) {
          await offlineDB.save('suppliers', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          console.log('✅ Поставщик создан онлайн:', data);
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка создания поставщика, сохраняем офлайн');
      }
    }

    console.log('💾 Сохраняем поставщика офлайн:', newSupplier);
    await offlineDB.save('suppliers', {
      id: newSupplier.id,
      data: newSupplier,
      updated_at: newSupplier.updated_at,
      synced: false,
    });

    await syncQueue.queueCreate('suppliers', newSupplier);
    console.log('✅ Поставщик сохранён офлайн');
    return newSupplier;
  }

  async createExpense(expense: Partial<Expense>): Promise<Expense | null> {
    const newExpense = {
      ...expense,
      id: expense.id || Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Expense;

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert(expense)
          .select()
          .single();

        if (!error && data) {
          await offlineDB.save('expenses', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка создания расхода, сохраняем офлайн');
      }
    }

    await offlineDB.save('expenses', {
      id: newExpense.id,
      data: newExpense,
      updated_at: newExpense.updated_at,
      synced: false,
    });

    await syncQueue.queueCreate('expenses', newExpense);
    return newExpense;
  }

  // === UPDATE (обновление) ===

  async updateTender(id: number, updates: Partial<Tender>): Promise<Tender | null> {
    const updatedData = {
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('tenders')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          await offlineDB.save('tenders', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка обновления тендера, сохраняем офлайн');
      }
    }

    // Офлайн - обновляем локально
    const existing = await offlineDB.getById<Tender>('tenders', id);
    if (existing) {
      const merged = { ...existing.data, ...updatedData };
      await offlineDB.save('tenders', {
        id,
        data: merged,
        updated_at: updatedData.updated_at,
        synced: false,
      });

      await syncQueue.queueUpdate('tenders', merged);
      return merged;
    }

    return null;
  }

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier | null> {
    const updatedData = {
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          await offlineDB.save('suppliers', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка обновления поставщика, сохраняем офлайн');
      }
    }

    const existing = await offlineDB.getById<Supplier>('suppliers', id);
    if (existing) {
      const merged = { ...existing.data, ...updatedData };
      await offlineDB.save('suppliers', {
        id,
        data: merged,
        updated_at: updatedData.updated_at,
        synced: false,
      });

      await syncQueue.queueUpdate('suppliers', merged);
      return merged;
    }

    return null;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | null> {
    const updatedData = {
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    if (this.isOnline) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          await offlineDB.save('expenses', {
            id: data.id,
            data,
            updated_at: data.updated_at || new Date().toISOString(),
            synced: true,
          });
          return data;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка обновления расхода, сохраняем офлайн');
      }
    }

    const existing = await offlineDB.getById<Expense>('expenses', id);
    if (existing) {
      const merged = { ...existing.data, ...updatedData };
      await offlineDB.save('expenses', {
        id,
        data: merged,
        updated_at: updatedData.updated_at,
        synced: false,
      });

      await syncQueue.queueUpdate('expenses', merged);
      return merged;
    }

    return null;
  }

  // === DELETE (удаление) ===

  async deleteTender(id: number): Promise<boolean> {
    if (this.isOnline) {
      try {
        const { error } = await supabase.from('tenders').delete().eq('id', id);

        if (!error) {
          await offlineDB.delete('tenders', id);
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка удаления тендера, помечаем офлайн');
      }
    }

    // Офлайн - помечаем как удалённый
    const existing = await offlineDB.getById<Tender>('tenders', id);
    if (existing) {
      (existing.data as any).deleted = true;
      existing.synced = false;
      await offlineDB.save('tenders', existing);
      await syncQueue.queueDelete('tenders', id);
    }

    return true;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    if (this.isOnline) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);

        if (!error) {
          await offlineDB.delete('suppliers', id);
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка удаления поставщика, помечаем офлайн');
      }
    }

    const existing = await offlineDB.getById<Supplier>('suppliers', id);
    if (existing) {
      (existing.data as any).deleted = true;
      existing.synced = false;
      await offlineDB.save('suppliers', existing);
      await syncQueue.queueDelete('suppliers', id);
    }

    return true;
  }

  async deleteExpense(id: number): Promise<boolean> {
    if (this.isOnline) {
      try {
        const { error } = await supabase.from('expenses').delete().eq('id', id);

        if (!error) {
          await offlineDB.delete('expenses', id);
          return true;
        }
      } catch (error) {
        console.warn('⚠️ Ошибка удаления расхода, помечаем офлайн');
      }
    }

    const existing = await offlineDB.getById<Expense>('expenses', id);
    if (existing) {
      (existing.data as any).deleted = true;
      existing.synced = false;
      await offlineDB.save('expenses', existing);
      await syncQueue.queueDelete('expenses', id);
    }

    return true;
  }

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===

  /**
   * Получение количества несинхронизированных изменений
   */
  async getPendingChangesCount(): Promise<number> {
    return await syncQueue.getPendingCount();
  }

  /**
   * Принудительная синхронизация
   */
  async syncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Нет подключения к интернету');
    }
    await syncQueue.syncAll();
  }

  /**
   * Проверка статуса онлайн/офлайн
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Очистка всех данных (для отладки)
   */
  async clearAllData(): Promise<void> {
    await this.ensureInitialized();
    await Promise.all([
      offlineDB.clear('tenders'),
      offlineDB.clear('suppliers'),
      offlineDB.clear('expenses'),
      offlineDB.clear('pending_changes'),
    ]);
    console.log('🗑️ Все данные очищены');
  }

  /**
   * Получение статистики кэша
   */
  async getCacheStats(): Promise<{
    tenders: number;
    suppliers: number;
    expenses: number;
    pendingChanges: number;
  }> {
    await this.ensureInitialized();
    
    const [tenders, suppliers, expenses, pending] = await Promise.all([
      offlineDB.getAll('tenders'),
      offlineDB.getAll('suppliers'),
      offlineDB.getAll('expenses'),
      offlineDB.getPendingChanges(),
    ]);

    return {
      tenders: tenders.length,
      suppliers: suppliers.length,
      expenses: expenses.length,
      pendingChanges: pending.length,
    };
  }
}

// Singleton экземпляр
export const offlineSupabase = new OfflineSupabase();
