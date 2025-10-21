# 🚀 План оптимизации проекта IP (Intelligent Procurement)

## 📊 Текущее состояние:
- **Файлов:** 129 (TypeScript/TSX)
- **Зависимостей:** 40
- **Стек:** Next.js 15, React 19, Tailwind CSS, Framer Motion, Supabase

---

## 🎯 Цели оптимизации:
1. ⚡ Ускорить загрузку на 30-50%
2. 🔄 Минимизировать перерендеры
3. 🧹 Очистить код от дублей
4. 💾 Оптимизировать работу с данными
5. 📱 Улучшить адаптивность
6. 🎨 Оптимизировать стили
7. 📈 Повысить Lighthouse score до 90+

---

## 📋 Детальный план:

### **1. Анализ и удаление неиспользуемых зависимостей** ✅
**Проблема:** Лишние пакеты увеличивают bundle size

**Действия:**
- Проверить все импорты через `depcheck`
- Удалить неиспользуемые пакеты
- Проверить дубликаты зависимостей

**Ожидаемый эффект:** -10-15% bundle size

---

### **2. Оптимизация React компонентов** 🔄
**Проблема:** Лишние перерендеры замедляют UI

**Действия:**
```tsx
// Обернуть в React.memo:
- SwipeableTenderCard
- SwipeableSupplierCard
- TenderCardSkeleton
- BottomNav

// Добавить useMemo/useCallback:
- filterTenders() → useMemo
- filterSuppliers() → useMemo
- handleDragEnd → useCallback
- handleClick → useCallback
```

**Ожидаемый эффект:** -30-40% перерендеров

---

### **3. Удаление дублирующегося кода** 🧹
**Проблема:** Повторяющаяся логика в разных файлах

**Действия:**
- Создать общий хук `useSwipeableCard`
- Вынести логику фильтрации в `useFilteredList`
- Объединить `SwipeableTenderCard` и `SwipeableSupplierCard` в один компонент
- Создать общий `useAutoClose` для модалок

**Ожидаемый эффект:** -20% кода, +читаемость

---

### **4. Оптимизация Tailwind** 🎨
**Проблема:** Повторяющиеся классы, большой CSS

**Действия:**
```js
// tailwind.config.js - добавить пресеты:
theme: {
  extend: {
    // Общие компоненты
    card: 'rounded-2xl p-4 shadow-sm bg-white',
    button: 'px-4 py-2 rounded-xl font-medium transition-colors',
    input: 'w-full px-4 py-3 rounded-xl border focus:ring-2',
  }
}
```

**Ожидаемый эффект:** -15% CSS size

---

### **5. Lazy Loading и Code Splitting** ⚡
**Проблема:** Весь код загружается сразу

**Действия:**
```tsx
// Динамические импорты:
const TenderDetailModal = dynamic(() => import('@/components/TenderDetailModal'))
const SupplierDetailModal = dynamic(() => import('@/components/SupplierDetailModal'))
const Dashboard = dynamic(() => import('@/app/m/dashboard/page'))

// Route-based splitting уже есть в Next.js
```

**Ожидаемый эффект:** -40% initial load time

---

### **6. Оптимизация API и кэширование** 💾
**Проблема:** Каждый раз загружаем данные заново

**Действия:**
```tsx
// Установить React Query:
npm install @tanstack/react-query

// Использовать:
const { data: tenders } = useQuery({
  queryKey: ['tenders'],
  queryFn: fetchTenders,
  staleTime: 5 * 60 * 1000, // 5 минут
  cacheTime: 10 * 60 * 1000, // 10 минут
})
```

**Ожидаемый эффект:** -60% API запросов

---

### **7. Оптимизация изображений и анимаций** 🖼️
**Проблема:** Тяжелые анимации, нет оптимизации изображений

**Действия:**
- Использовать `next/image` вместо `<img>`
- Добавить `will-change` для анимаций
- Уменьшить сложность Framer Motion анимаций
- Использовать CSS animations где возможно

**Ожидаемый эффект:** +10 FPS

---

### **8. Проверка адаптивности** 📱
**Проблема:** Возможны проблемы на разных экранах

**Действия:**
- Проверить все breakpoints (sm, md, lg, xl)
- Добавить `viewport` meta tag
- Проверить safe-area для iPhone
- Тестировать на разных устройствах

**Ожидаемый эффект:** 100% адаптивность

---

### **9. Lighthouse аудит** 📈
**Текущие показатели:** (нужно проверить)

**Целевые показатели:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

**Действия:**
- Добавить meta tags
- Оптимизировать шрифты
- Добавить preload для критичных ресурсов
- Минифицировать JS/CSS

---

### **10. Дополнительные улучшения** ⭐

#### **A. Виртуализация длинных списков**
```tsx
// Для списков >50 элементов:
import { FixedSizeList } from 'react-window'
```

#### **B. Service Worker для offline**
```tsx
// PWA уже есть, добавить кэширование:
- API responses
- Статические ресурсы
- Изображения
```

#### **C. Prefetching**
```tsx
// Предзагрузка следующих страниц:
<Link href="/tenders" prefetch>
```

#### **D. Compression**
```js
// next.config.js:
compress: true,
```

---

## 📊 Ожидаемые результаты:

| Метрика | Сейчас | После | Улучшение |
|---------|--------|-------|-----------|
| **Bundle Size** | ~500KB | ~350KB | -30% |
| **Initial Load** | ~2s | ~1.2s | -40% |
| **FCP** | ~1.5s | ~0.9s | -40% |
| **TTI** | ~3s | ~1.8s | -40% |
| **Lighthouse** | ~75 | ~92 | +17 |
| **Перерендеры** | 100% | 60% | -40% |

---

## 🔄 Порядок выполнения:

1. ✅ **Иконка** - готово
2. 🔄 **React Query** - самое важное (кэширование)
3. 🔄 **React.memo** - быстрое улучшение
4. 🔄 **Удаление дублей** - очистка кода
5. 🔄 **Lazy loading** - ускорение загрузки
6. 🔄 **Tailwind пресеты** - оптимизация стилей
7. 🔄 **Lighthouse** - финальная проверка

---

## 💡 Рекомендации:

1. **Не трогать бизнес-логику** - только оптимизация
2. **Тестировать после каждого шага** - проверять что ничего не сломалось
3. **Измерять результаты** - использовать Chrome DevTools Performance
4. **Сохранить визуальный стиль** - никаких изменений в дизайне

---

## 📝 Следующие шаги:

Начинаю с самых критичных оптимизаций:
1. React Query для кэширования
2. React.memo для компонентов
3. Удаление неиспользуемых зависимостей

**Готов начать?** 🚀
