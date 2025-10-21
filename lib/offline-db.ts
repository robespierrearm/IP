/**
 * IndexedDB для офлайн-режима
 * Хранит тендеры, поставщиков, расходы и очередь синхронизации
 */

const DB_NAME = 'TenderCRM_Offline';
const DB_VERSION = 1;

export interface OfflineData<T = any> {
  id: string | number;
  data: T;
  updated_at: string;
  synced: boolean;
  deleted?: boolean;
}

export interface PendingChange {
  id: string;
  table: 'tenders' | 'suppliers' | 'expenses';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retries: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Таблица тендеров
        if (!db.objectStoreNames.contains('tenders')) {
          const tendersStore = db.createObjectStore('tenders', { keyPath: 'id' });
          tendersStore.createIndex('synced', 'synced', { unique: false });
          tendersStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Таблица поставщиков
        if (!db.objectStoreNames.contains('suppliers')) {
          const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id' });
          suppliersStore.createIndex('synced', 'synced', { unique: false });
          suppliersStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Таблица расходов
        if (!db.objectStoreNames.contains('expenses')) {
          const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expensesStore.createIndex('synced', 'synced', { unique: false });
          expensesStore.createIndex('updated_at', 'updated_at', { unique: false });
        }

        // Очередь изменений для синхронизации
        if (!db.objectStoreNames.contains('pending_changes')) {
          const changesStore = db.createObjectStore('pending_changes', { keyPath: 'id' });
          changesStore.createIndex('timestamp', 'timestamp', { unique: false });
          changesStore.createIndex('table', 'table', { unique: false });
        }

        // Метаданные (последняя синхронизация и т.д.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // === CRUD операции для любой таблицы ===

  async getAll<T>(storeName: string): Promise<OfflineData<T>[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: string | number): Promise<OfflineData<T> | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async save<T>(storeName: string, item: OfflineData<T>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveMany<T>(storeName: string, items: OfflineData<T>[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => store.put(item));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async delete(storeName: string, id: string | number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // === Очередь синхронизации ===

  async addPendingChange(change: Omit<PendingChange, 'id'>): Promise<string> {
    if (!this.db) await this.init();
    const id = `${change.table}_${change.action}_${Date.now()}_${Math.random()}`;
    const fullChange: PendingChange = { ...change, id, retries: 0 };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pending_changes', 'readwrite');
      const store = transaction.objectStore('pending_changes');
      const request = store.add(fullChange);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChanges(): Promise<PendingChange[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('pending_changes', 'readonly');
      const store = transaction.objectStore('pending_changes');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingChange(id: string): Promise<void> {
    if (!this.db) await this.init();
    return this.delete('pending_changes', id);
  }

  async incrementRetries(id: string): Promise<void> {
    if (!this.db) await this.init();
    const change = await this.getById<PendingChange>('pending_changes', id);
    if (change) {
      change.data.retries = (change.data.retries || 0) + 1;
      await this.save('pending_changes', change);
    }
  }

  // === Метаданные ===

  async setMetadata(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('metadata', 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction('metadata', 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // === Утилиты ===

  async getUnsyncedItems(storeName: string): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(storeName: string, id: string | number): Promise<void> {
    const item = await this.getById(storeName, id);
    if (item) {
      item.synced = true;
      await this.save(storeName, item);
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    const timestamp = await this.getMetadata('last_sync');
    return timestamp ? new Date(timestamp) : null;
  }

  async setLastSyncTime(date: Date = new Date()): Promise<void> {
    await this.setMetadata('last_sync', date.toISOString());
  }
}

// Singleton экземпляр
export const offlineDB = new OfflineDB();

// Инициализация при импорте
if (typeof window !== 'undefined') {
  offlineDB.init().catch(console.error);
}

export {};
