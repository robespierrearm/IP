# 🔍 АНАЛИЗ ПРОБЛЕМ

## 1️⃣ АВТОПЕРЕХОД "Подано" → "На рассмотрении"

### ✅ ЛОГИКА НАЙДЕНА:

**Файл:** `/app/api/cron/check-deadlines/route.ts`

**Как работает:**
1. Vercel Cron Job запускается **каждый день в 00:00** (UTC)
2. Ищет все тендеры со статусом `подано` где `submission_deadline <= сегодня`
3. Автоматически меняет статус на `на рассмотрении`

**Настройка в `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 0 * * *"  // Каждый день в 00:00 UTC
    }
  ]
}
```

### ❌ ПОЧЕМУ НЕ РАБОТАЕТ:

1. **Нужен CRON_SECRET** в переменных окружения Vercel
   - Файл проверяет: `authHeader !== Bearer ${process.env.CRON_SECRET}`
   - Если нет - возвращает 401 Unauthorized

2. **Работает только на Vercel** (не локально)
   - Локально cron не запускается
   - Нужно задеплоить на Vercel

3. **Проверяет только в 00:00 UTC**
   - Если дедлайн сегодня, но еще не 00:00 - не сработает
   - Время UTC, не местное

### ✅ КАК ИСПРАВИТЬ:

**Вариант 1: Добавить CRON_SECRET в Vercel**
1. Зайти в Vercel → Settings → Environment Variables
2. Добавить: `CRON_SECRET` = любой случайный ключ (например: `my-secret-key-123`)
3. Redeploy

**Вариант 2: Ручная проверка при загрузке страницы**
- Добавить проверку в `/app/(dashboard)/tenders/page.tsx`
- При загрузке проверять дедлайны и обновлять статусы

---

## 2️⃣ МОБИЛЬНАЯ ВЕРСИЯ - ЦВЕТОВОЕ ОФОРМЛЕНИЕ

### ❌ ПРОБЛЕМА:

В мобильной версии `/app/m/tenders/page.tsx` используется **старая цветовая схема**:

```typescript
// СТАРАЯ (сейчас):
case 'новый': return 'bg-blue-100 text-blue-700';
case 'подано': return 'bg-green-100 text-green-700';
```

### ✅ НУЖНО:

Применить **новую схему с цветными рамками** как в десктопе:

```typescript
// НОВАЯ (нужна):
border-l-4:
- новый → border-l-white
- подано → border-l-blue-500
- на рассмотрении → border-l-yellow-500
- победа → border-l-purple-500
- в работе → border-l-green-500
- завершён → border-l-gray-700
- проигрыш → border-l-red-500
```

### 📋 ФАЙЛЫ ДЛЯ ОБНОВЛЕНИЯ:

1. `/app/m/tenders/page.tsx` - основная страница
2. `/components/mobile/SwipeableTenderCard.tsx` - карточка тендера
3. `/components/mobile/AnimatedTenderCard.tsx` - анимированная карточка
4. `/components/mobile/TenderDetailsModal.tsx` - модалка деталей

---

## 3️⃣ ГЛЮКИ С ДАТАМИ

### ❌ ПРОБЛЕМА:

**Дата не подтверждается** при наборе в поле `<input type="date">`

### 🔍 ПРИЧИНА:

В `AddTenderDialog.tsx` и `EditTenderDialog.tsx`:

```tsx
<Input
  type="date"
  value={formData.submission_deadline || ''}
  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
/>
```

**Проблемы:**
1. **Нет валидации формата** - браузер может не принять дату
2. **Нет обработки пустых значений** - `''` может конфликтовать с `null`
3. **Нет min/max ограничений** - можно выбрать прошлые даты

### ✅ КАК ИСПРАВИТЬ:

```tsx
<Input
  type="date"
  value={formData.submission_deadline || ''}
  min={new Date().toISOString().split('T')[0]} // Только будущие даты
  onChange={(e) => {
    const value = e.target.value;
    setFormData({ 
      ...formData, 
      submission_deadline: value || null  // null вместо ''
    });
  }}
  required
/>
```

**Дополнительно:**
- Добавить валидацию перед отправкой
- Показывать ошибку если дата не выбрана
- Использовать `react-datepicker` для лучшего UX

---

## 📊 ПРИОРИТЕТЫ:

1. **🔴 ВЫСОКИЙ:** Даты (влияет на UX сейчас)
2. **🟡 СРЕДНИЙ:** Мобильная версия (визуальное улучшение)
3. **🟢 НИЗКИЙ:** Автопереход (работает на Vercel, нужен только CRON_SECRET)

---

## 🚀 ПЛАН ДЕЙСТВИЙ:

### Шаг 1: Исправить даты ✅
- Добавить `min` атрибут
- Изменить `''` на `null`
- Добавить валидацию

### Шаг 2: Обновить мобильную версию ✅
- Применить цветные рамки
- Обновить все мобильные компоненты

### Шаг 3: Настроить автопереход ✅
- Добавить CRON_SECRET в Vercel
- Или добавить ручную проверку при загрузке

**ГОТОВ ИСПРАВЛЯТЬ?** 🛠️
