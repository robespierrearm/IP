/**
 * Система синхронизации офлайн-данных с сервером
 * Обрабатывает очередь изменений и разрешает конфликты
 */

import { offlineDB, PendingChange } from './offline-db';
import { supabase } from './supabase';

export type SyncStatus = 'idle' | 'syncing' | 'error';
export type ConflictResolution = 'server-wins' | 'client-wins' | 'last-write-wins';

class SyncQueue {
  private isSyncing = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];
  private conflictResolution: ConflictResolution = 'last-write-wins';

  constructor() {
    // Слушаем изменение статуса онлайн/офлайн
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncAll());
      window.addEventListener('offline', () => this.notifyListeners('idle'));
    }
  }

  // === Подписка на статус синхронизации ===

  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(status: SyncStatus) {
    this.syncListeners.forEach((cb) => cb(status));
  }

  // === Основная синхронизация ===

  async syncAll(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    this.notifyListeners('syncing');

    try {
      console.log('🔄 Начинаем синхронизацию...');

      // 1. Синхронизируем изменения из очереди
      await this.processPendingChanges();

      // 2. Загружаем свежие данные с сервера
      await this.downloadFromServer();

      // 3. Обновляем время последней синхронизации
      await offlineDB.setLastSyncTime();

      console.log('✅ Синхронизация завершена');
      this.notifyListeners('idle');
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error);
      this.notifyListeners('error');
    } finally {
      this.isSyncing = false;
    }
  }

  // === Обработка очереди изменений ===

  private async processPendingChanges(): Promise<void> {
    const changes = await offlineDB.getPendingChanges();
    console.log(`📤 Отправляем ${changes.length} изменений на сервер...`);

    for (const change of changes) {
      try {
        await this.applyChange(change);
        await offlineDB.removePendingChange(change.id);
        console.log(`✅ Изменение ${change.id} применено`);
      } catch (error) {
        console.error(`❌ Ошибка применения ${change.id}:`, error);
        
        // Увеличиваем счётчик попыток
        await offlineDB.incrementRetries(change.id);
        
        // Удаляем после 5 неудачных попыток
        if (change.retries >= 5) {
          console.warn(`⚠️ Удаляем изменение ${change.id} после 5 попыток`);
          await offlineDB.removePendingChange(change.id);
        }
      }
    }
  }

  private async applyChange(change: PendingChange): Promise<void> {
    const { table, action, data } = change;

    switch (action) {
      case 'create':
        await this.createOnServer(table, data);
        break;
      case 'update':
        await this.updateOnServer(table, data);
        break;
      case 'delete':
        await this.deleteOnServer(table, data.id);
        break;
    }
  }

  private async createOnServer(table: string, data: any): Promise<void> {
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
  }

  private async updateOnServer(table: string, data: any): Promise<void> {
    const { id, ...updates } = data;
    const { error } = await supabase.from(table).update(updates).eq('id', id);
    if (error) throw error;
  }

  private async deleteOnServer(table: string, id: string | number): Promise<void> {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
  }

  // === Загрузка данных с сервера ===

  private async downloadFromServer(): Promise<void> {
    console.log('📥 Загружаем данные с сервера...');

    // Загружаем тендеры
    const { data: tenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!tendersError && tenders) {
      await offlineDB.saveMany(
        'tenders',
        tenders.map((t) => ({
          id: t.id,
          data: t,
          updated_at: t.updated_at || new Date().toISOString(),
          synced: true,
        }))
      );
      console.log(`✅ Загружено ${tenders.length} тендеров`);
    }

    // Загружаем поставщиков
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!suppliersError && suppliers) {
      await offlineDB.saveMany(
        'suppliers',
        suppliers.map((s) => ({
          id: s.id,
          data: s,
          updated_at: s.updated_at || new Date().toISOString(),
          synced: true,
        }))
      );
      console.log(`✅ Загружено ${suppliers.length} поставщиков`);
    }

    // Загружаем расходы
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!expensesError && expenses) {
      await offlineDB.saveMany(
        'expenses',
        expenses.map((e) => ({
          id: e.id,
          data: e,
          updated_at: e.updated_at || new Date().toISOString(),
          synced: true,
        }))
      );
      console.log(`✅ Загружено ${expenses.length} расходов`);
    }
  }

  // === Добавление изменений в очередь ===

  async queueCreate(table: 'tenders' | 'suppliers' | 'expenses', data: any): Promise<void> {
    await offlineDB.addPendingChange({
      table,
      action: 'create',
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    // Пытаемся синхронизировать сразу если онлайн
    if (navigator.onLine) {
      this.syncAll();
    }
  }

  async queueUpdate(table: 'tenders' | 'suppliers' | 'expenses', data: any): Promise<void> {
    await offlineDB.addPendingChange({
      table,
      action: 'update',
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    if (navigator.onLine) {
      this.syncAll();
    }
  }

  async queueDelete(table: 'tenders' | 'suppliers' | 'expenses', id: string | number): Promise<void> {
    await offlineDB.addPendingChange({
      table,
      action: 'delete',
      data: { id },
      timestamp: new Date().toISOString(),
      retries: 0,
    });

    if (navigator.onLine) {
      this.syncAll();
    }
  }

  // === Разрешение конфликтов ===

  private async resolveConflict(
    localData: any,
    serverData: any
  ): Promise<any> {
    switch (this.conflictResolution) {
      case 'server-wins':
        return serverData;
      
      case 'client-wins':
        return localData;
      
      case 'last-write-wins':
      default:
        const localTime = new Date(localData.updated_at || 0).getTime();
        const serverTime = new Date(serverData.updated_at || 0).getTime();
        return localTime > serverTime ? localData : serverData;
    }
  }

  // === Утилиты ===

  async getPendingCount(): Promise<number> {
    const changes = await offlineDB.getPendingChanges();
    return changes.length;
  }

  async clearQueue(): Promise<void> {
    await offlineDB.clear('pending_changes');
  }

  setConflictResolution(strategy: ConflictResolution) {
    this.conflictResolution = strategy;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  getStatus(): SyncStatus {
    if (!navigator.onLine) return 'idle';
    return this.isSyncing ? 'syncing' : 'idle';
  }
}

// Singleton экземпляр
export const syncQueue = new SyncQueue();

// Автоматическая синхронизация при загрузке
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (navigator.onLine) {
      setTimeout(() => syncQueue.syncAll(), 2000);
    }
  });
}
