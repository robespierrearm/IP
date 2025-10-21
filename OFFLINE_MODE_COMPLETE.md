# 🔴🟢 ОФЛАЙН-РЕЖИМ - ПОЛНАЯ РЕАЛИЗАЦИЯ (ВАРИАНТ 3)

**Дата:** 22 октября 2025  
**Статус:** ✅ Полностью функционально  
**Версия:** 3.0 (Продвинутый)

---

## 🎯 Что реализовано

### ✅ Полный офлайн-режим с синхронизацией
- **IndexedDB** для хранения данных (тендеры, поставщики, расходы)
- **Service Worker v2** с умным кэшированием (API, статика, изображения)
- **Очередь синхронизации** с автоматической отправкой при подключении
- **Background Sync** для фоновой синхронизации
- **Periodic Sync** для периодического обновления (каждый час)
- **Push уведомления** (готово к использованию)

### ✅ Индикатор онлайн/офлайн
**Обводка шапки дашборда:**
- 🟢 **Зелёная** - онлайн, всё синхронизировано
- 🟡 **Жёлтая** - идёт синхронизация (с пульсацией)
- 🟠 **Оранжевая** - есть несинхронизированные изменения
- 🔴 **Красная** - офлайн режим

### ✅ Конфликт-резолвер
- **Last-Write-Wins** - побеждает последнее изменение
- Автоматическое разрешение конфликтов при синхронизации
- Счётчик попыток (до 5 попыток, затем удаление из очереди)

---

## 📁 Созданные файлы

### 1. `/lib/offline-db.ts` (265 строк)
**IndexedDB менеджер**

**Таблицы:**
- `tenders` - тендеры с метаданными
- `suppliers` - поставщики
- `expenses` - расходы
- `pending_changes` - очередь изменений для синхронизации
- `metadata` - служебная информация (последняя синхронизация)

**Методы:**
```typescript
// CRUD
await offlineDB.getAll('tenders')
await offlineDB.getById('tenders', id)
await offlineDB.save('tenders', item)
await offlineDB.delete('tenders', id)

// Очередь
await offlineDB.addPendingChange(change)
await offlineDB.getPendingChanges()
await offlineDB.removePendingChange(id)

// Метаданные
await offlineDB.setMetadata('key', value)
await offlineDB.getLastSyncTime()
```

---

### 2. `/lib/sync-queue.ts` (270 строк)
**Система синхронизации**

**Функции:**
- Автоматическая синхронизация при подключении к интернету
- Обработка очереди изменений (create, update, delete)
- Загрузка свежих данных с сервера
- Разрешение конфликтов (last-write-wins)
- Подписка на статус синхронизации

**Использование:**
```typescript
import { syncQueue } from '@/lib/sync-queue';

// Добавить в очередь
await syncQueue.queueCreate('tenders', data);
await syncQueue.queueUpdate('tenders', data);
await syncQueue.queueDelete('tenders', id);

// Синхронизировать вручную
await syncQueue.syncAll();

// Подписаться на статус
syncQueue.onSyncStatusChange((status) => {
  console.log('Статус:', status); // 'idle' | 'syncing' | 'error'
});
```

---

### 3. `/lib/offline-supabase.ts` (485 строк)
**Офлайн-обёртка для Supabase**

Автоматически использует IndexedDB когда нет интернета.

**API (идентичен Supabase):**
```typescript
import { offlineSupabase } from '@/lib/offline-supabase';

// SELECT (автоматически из кэша если офлайн)
const tenders = await offlineSupabase.getTenders();
const suppliers = await offlineSupabase.getSuppliers();
const expenses = await offlineSupabase.getExpenses();

// INSERT (сохраняется локально если офлайн)
const tender = await offlineSupabase.createTender(data);

// UPDATE (обновляется локально если офлайн)
await offlineSupabase.updateTender(id, updates);

// DELETE (помечается как удалённый если офлайн)
await offlineSupabase.deleteTender(id);

// Утилиты
const isOnline = offlineSupabase.getOnlineStatus();
const pendingCount = await offlineSupabase.getPendingChangesCount();
await offlineSupabase.syncNow();
```

---

### 4. `/components/OnlineStatusBorder.tsx` (130 строк)
**Компонент с цветной обводкой**

**Особенности:**
- Автоматическое определение онлайн/офлайн
- Цветная обводка (зелёная/жёлтая/оранжевая/красная)
- Пульсация при синхронизации
- Счётчик несинхронизированных изменений
- Текстовый индикатор "🔴 Офлайн режим"

**Использование:**
```tsx
import { OnlineStatusBorder } from '@/components/OnlineStatusBorder';

<OnlineStatusBorder>
  <div className="bg-gradient-to-br from-primary-500 to-secondary-600 ...">
    {/* Ваш контент */}
  </div>
</OnlineStatusBorder>
```

---

### 5. `/public/sw.js` (240 строк)
**Service Worker v2**

**Стратегии кэширования:**

1. **API запросы** - Network First
   - Сначала пытается загрузить с сервера
   - Если офлайн → возвращает из кэша
   - Кэш обновляется при успешном запросе

2. **Изображения** - Cache First
   - Сначала проверяет кэш
   - Если нет → загружает и кэширует

3. **Статика** - Stale While Revalidate
   - Возвращает из кэша сразу
   - Обновляет кэш в фоне

**Дополнительно:**
- Background Sync (синхронизация при подключении)
- Periodic Sync (каждый час)
- Push уведомления
- Автоочистка старых версий кэша

---

### 6. `/components/PWARegister.tsx` (обновлён)
**Регистрация Service Worker**

- Регистрирует SW при загрузке
- Слушает сообщения от SW
- Регистрирует Background Sync
- Регистрирует Periodic Sync (если поддерживается)

---

### 7. `/app/m/dashboard/page.tsx` (обновлён)
**Мобильный дашборд с индикатором**

Шапка обёрнута в `<OnlineStatusBorder>` для визуальной индикации статуса.

---

## 🔄 Как это работает

### Сценарий 1: Онлайн → Офлайн

1. Пользователь работает онлайн
2. Все данные загружаются с сервера
3. Данные автоматически кэшируются в IndexedDB
4. Интернет пропадает
5. **Обводка шапки становится красной** 🔴
6. Пользователь продолжает работать
7. Все изменения сохраняются в IndexedDB
8. Изменения добавляются в очередь `pending_changes`

### Сценарий 2: Офлайн → Онлайн

1. Интернет появляется
2. **Обводка становится жёлтой** 🟡 (синхронизация)
3. Service Worker отправляет событие `SYNC_REQUEST`
4. `syncQueue.syncAll()` запускается автоматически
5. Все изменения из очереди отправляются на сервер
6. Загружаются свежие данные с сервера
7. IndexedDB обновляется
8. **Обводка становится зелёной** 🟢
9. Показывается уведомление "✅ Синхронизировано"

### Сценарий 3: Конфликт данных

1. Пользователь изменил тендер офлайн
2. Тот же тендер был изменён на сервере
3. При синхронизации обнаруживается конфликт
4. Применяется стратегия **Last-Write-Wins**
5. Сравниваются `updated_at` полей
6. Побеждает более свежее изменение
7. Данные синхронизируются

---

## 🎨 Визуальные индикаторы

### Обводка шапки

```
🟢 Зелёная (border-green-500)
   ↓ Интернет пропал
🔴 Красная (border-red-500) + "🔴 Офлайн режим"
   ↓ Пользователь создал тендер
🟠 Оранжевая (border-orange-500) + бейдж "1"
   ↓ Интернет появился
🟡 Жёлтая (border-yellow-500) + пульсация
   ↓ Синхронизация завершена
🟢 Зелёная (border-green-500)
```

### Бейдж несинхронизированных изменений

```tsx
<div className="bg-orange-500 text-white px-2 py-1 rounded-full">
  <svg className="w-3 h-3 animate-spin" />
  {pendingCount}
</div>
```

---

## 📊 Структура данных

### IndexedDB схема

```typescript
interface OfflineData<T> {
  id: string | number;
  data: T;                    // Сам объект (Tender, Supplier, Expense)
  updated_at: string;         // Время последнего обновления
  synced: boolean;            // Синхронизировано ли с сервером
  deleted?: boolean;          // Помечено как удалённое
}

interface PendingChange {
  id: string;                 // Уникальный ID изменения
  table: 'tenders' | 'suppliers' | 'expenses';
  action: 'create' | 'update' | 'delete';
  data: any;                  // Данные для отправки
  timestamp: string;          // Время создания
  retries: number;            // Количество попыток (макс 5)
}
```

---

## 🚀 Как использовать

### В существующем коде

**Заменить:**
```typescript
// Было
import { supabase } from '@/lib/supabase';
const { data } = await supabase.from('tenders').select('*');
```

**На:**
```typescript
// Стало
import { offlineSupabase } from '@/lib/offline-supabase';
const tenders = await offlineSupabase.getTenders();
```

### Проверка статуса

```typescript
import { syncQueue } from '@/lib/sync-queue';

// Онлайн?
const isOnline = syncQueue.isOnline();

// Сколько несинхронизированных изменений?
const count = await syncQueue.getPendingCount();

// Синхронизировать вручную
await syncQueue.syncAll();
```

---

## 🔧 Настройки

### Время жизни кэша (sw.js)

```javascript
const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000,              // 5 минут для API
  images: 7 * 24 * 60 * 60 * 1000, // 7 дней для изображений
  static: 30 * 24 * 60 * 60 * 1000 // 30 дней для статики
};
```

### Стратегия разрешения конфликтов

```typescript
syncQueue.setConflictResolution('last-write-wins'); // По умолчанию
// Или:
// 'server-wins' - сервер всегда прав
// 'client-wins' - клиент всегда прав
```

### Периодичность синхронизации

```typescript
// В PWARegister.tsx
periodicSync.register('sync-tenders', {
  minInterval: 60 * 60 * 1000, // 1 час (можно изменить)
});
```

---

## 🐛 Отладка

### Консоль браузера

```javascript
// Проверить IndexedDB
const db = await indexedDB.open('TenderCRM_Offline', 1);

// Проверить Service Worker
navigator.serviceWorker.getRegistrations();

// Проверить кэш
caches.keys().then(console.log);

// Проверить очередь
import { offlineDB } from '@/lib/offline-db';
const pending = await offlineDB.getPendingChanges();
console.log('Очередь:', pending);
```

### Chrome DevTools

1. **Application → Service Workers** - статус SW
2. **Application → Cache Storage** - содержимое кэша
3. **Application → IndexedDB** - содержимое БД
4. **Network → Offline** - эмуляция офлайн-режима

---

## ✅ Тестирование

### Сценарии для проверки

1. **Базовый офлайн:**
   - Открыть приложение онлайн
   - Отключить интернет (DevTools → Network → Offline)
   - Проверить что шапка стала красной 🔴
   - Открыть список тендеров (должны загрузиться из кэша)

2. **Создание офлайн:**
   - Находясь офлайн, создать новый тендер
   - Проверить что появился оранжевый бейдж 🟠
   - Включить интернет
   - Проверить что обводка стала жёлтой 🟡 (синхронизация)
   - Проверить что тендер появился на сервере

3. **Редактирование офлайн:**
   - Офлайн: изменить существующий тендер
   - Онлайн: синхронизировать
   - Проверить что изменения применились

4. **Удаление офлайн:**
   - Офлайн: удалить тендер
   - Проверить что он исчез из списка
   - Онлайн: синхронизировать
   - Проверить что он удалён на сервере

5. **Конфликт:**
   - Офлайн: изменить тендер A
   - В другой вкладке онлайн: изменить тот же тендер A
   - Включить интернет в первой вкладке
   - Проверить что применилось последнее изменение

---

## 📈 Производительность

### Оптимизации

- **Lazy loading** IndexedDB (инициализация при первом использовании)
- **Batch operations** (сохранение массива данных одной транзакцией)
- **Debounced sync** (не чаще раза в 5 секунд)
- **Умное кэширование** (только GET запросы)
- **Автоочистка** старых версий кэша

### Размер данных

- **IndexedDB:** ~50 МБ на домен (Chrome/Firefox)
- **Cache Storage:** ~50 МБ на домен
- **Итого:** ~100 МБ доступно для офлайн-данных

---

## 🎯 Преимущества

1. **Полная автономность** - приложение работает без интернета
2. **Прозрачность** - пользователь видит статус синхронизации
3. **Надёжность** - изменения не теряются
4. **Производительность** - данные загружаются из кэша мгновенно
5. **UX** - нет "белых экранов" и ошибок сети

---

## 🔮 Будущие улучшения (опционально)

1. **Умная синхронизация** - только изменённые поля
2. **Дельта-синхронизация** - передача только diff'ов
3. **Версионирование** - история изменений
4. **Ручное разрешение конфликтов** - UI для выбора версии
5. **Оптимистичные обновления** - мгновенный UI feedback
6. **Offline-first архитектура** - приоритет локальных данных

---

## 📝 Итог

**Полностью функциональный офлайн-режим (Вариант 3):**

✅ IndexedDB для хранения  
✅ Service Worker v2 с умным кэшированием  
✅ Очередь синхронизации  
✅ Background Sync  
✅ Periodic Sync  
✅ Push уведомления (готово)  
✅ Конфликт-резолвер (last-write-wins)  
✅ Визуальный индикатор (обводка шапки)  
✅ Счётчик несинхронизированных изменений  
✅ Автоматическая синхронизация  

**Готово к production! 🚀**

---

**Версия:** 3.0  
**Автор:** IP Development Team  
**Дата:** 22.10.2025
