# 📦 Руководство по версиям карточек

## 🎯 3 Версии карточек тендеров:

1. **Original (O)** - Текущая рабочая версия
2. **NEW (N)** - Умные метрики в раскрытой карточке
3. **ULTIMATE (U)** - Timeline + единая таблица + 2 колонки

---

## 🔄 Переключение версий:

**Где:** В сайдбаре под именем пользователя (Armen)
**Кнопки:** `O | N | U`
**По умолчанию:** ULTIMATE (U)
**Сохранение:** В localStorage браузера

---

## ❌ Как удалить версию БЕЗ вреда проекту:

### **Удалить версию NEW:**

1. Удалить файл:
   ```bash
   rm components/TenderCardExpandedNEW.tsx
   ```

2. В `app/(dashboard)/tenders/page.tsx` удалить:
   ```typescript
   // Убрать импорт:
   import { TenderCardExpandedNEW } from '@/components/TenderCardExpandedNEW';
   
   // Убрать рендеринг (строка ~585):
   {cardVersion === 'new' && (
     <TenderCardExpandedNEW ... />
   )}
   ```

3. В `contexts/CardVersionContext.tsx` изменить тип:
   ```typescript
   // Было:
   type CardVersion = 'original' | 'new' | 'ultimate';
   
   // Стало:
   type CardVersion = 'original' | 'ultimate';
   ```

4. В `components/AppSidebar.tsx` убрать кнопку N:
   ```typescript
   // Удалить блок кнопки NEW (строки ~417-427)
   ```

---

### **Удалить версию ULTIMATE:**

1. Удалить файл:
   ```bash
   rm components/TenderCardULTIMATE.tsx
   ```

2. В `app/(dashboard)/tenders/page.tsx` удалить:
   ```typescript
   // Убрать импорт:
   import { TenderCardULTIMATE } from '@/components/TenderCardULTIMATE';
   
   // Убрать условие (строки ~413-434):
   if (cardVersion === 'ultimate') { ... }
   ```

3. В `contexts/CardVersionContext.tsx`:
   - Изменить тип
   - Изменить дефолт на 'original'

4. В `components/AppSidebar.tsx` убрать кнопку U

---

### **Удалить ВСЁ и вернуться к Original:**

1. Удалить файлы:
   ```bash
   rm components/TenderCardExpandedNEW.tsx
   rm components/TenderCardULTIMATE.tsx
   rm contexts/CardVersionContext.tsx
   ```

2. В `app/(dashboard)/layout.tsx` убрать:
   ```typescript
   import { CardVersionProvider } from '@/contexts/CardVersionContext';
   // И убрать обёртку <CardVersionProvider>
   ```

3. В `components/AppSidebar.tsx` убрать:
   ```typescript
   import { useCardVersion } from '@/contexts/CardVersionContext';
   const { cardVersion, setCardVersion } = useCardVersion();
   // И убрать переключатель версий (строки 403-439)
   ```

4. В `app/(dashboard)/tenders/page.tsx` убрать:
   ```typescript
   import { useCardVersion } from '@/contexts/CardVersionContext';
   const { cardVersion } = useCardVersion();
   // И убрать условия рендеринга версий
   ```

---

## ✅ Текущая структура:

```
components/
├── TenderCardExpanded.tsx        ← Original (нельзя удалять!)
├── TenderCardExpandedNEW.tsx     ← NEW (можно удалить)
└── TenderCardULTIMATE.tsx        ← ULTIMATE (можно удалить)

contexts/
└── CardVersionContext.tsx        ← Управление версиями

app/(dashboard)/
├── layout.tsx                    ← Provider обёртка
└── tenders/page.tsx              ← Условный рендеринг версий

components/
└── AppSidebar.tsx                ← Переключатель O|N|U
```

---

## 🚀 Рекомендации:

1. **Тестируй все версии** перед удалением
2. **Original всегда оставь** - это базовая версия
3. **Удаляй по одной** - не навреди проекту
4. **Коммить после каждого удаления** - чтобы откатиться если что

---

## 💡 Разница между версиями:

| Функция | Original | NEW | ULTIMATE |
|---------|----------|-----|----------|
| Закрытая карточка | ✅ Стандарт | ✅ То же | ✅ Немного компактнее |
| Раскрытая карточка | Простая | Smart метрики | Timeline + таблица |
| Умные метрики | ❌ | ✅ 2 карточки | ✅ 2 компактные |
| Timeline | ❌ | ❌ | ✅ Горизонтальный |
| Единая таблица | ❌ | ❌ | ✅ |
| Компактность | Средняя | Средняя | ✅ Высокая |
| Высота | ~250px | ~150px | ~120px |
