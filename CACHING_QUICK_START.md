# 🚀 Быстрый старт - Кэширование данных

**Для разработчиков:** Как пользоваться новой системой кэширования

---

## 📋 Что изменилось?

### ❌ Старый способ (убрали)
```typescript
const [data, setData] = useState([]);

useEffect(() => {
  const loadData = async () => {
    const result = await apiClient.getData();
    setData(result.data);
  };
  loadData();
}, []);
```

### ✅ Новый способ (используем)
```typescript
const { data, isLoading, error, refetch } = useData();
// Всё! Кэширование работает автоматически
```

---

## 🎯 Основные hooks

### Чтение данных

```typescript
import { useDashboard, useTenders, useSuppliers } from '@/hooks/useQueries';

// Dashboard
const { data, isLoading, error, refetch } = useDashboard();

// Тендеры
const { data: tenders, isLoading, refetch } = useTenders();

// Тендеры с фильтром
const { data: newTenders } = useTenders({ status: 'новый' });

// Поставщики
const { data: suppliers } = useSuppliers();

// Поставщики с поиском
const { data: searchResults } = useSuppliers({ search: 'ООО' });
```

### Изменение данных (Mutations)

```typescript
import { 
  useCreateTender, 
  useUpdateTender, 
  useDeleteTender 
} from '@/hooks/useQueries';

// Создание
const createMutation = useCreateTender();
await createMutation.mutateAsync(newTender);
// Кэш обновится автоматически!

// Обновление
const updateMutation = useUpdateTender();
await updateMutation.mutateAsync({ id: 1, updates: { status: 'победа' } });

// Удаление
const deleteMutation = useDeleteTender();
await deleteMutation.mutateAsync(tenderId);
```

---

## 💡 Примеры использования

### 1. Простая страница со списком

```typescript
export default function MyPage() {
  const { data, isLoading, error } = useTenders();
  
  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  
  return (
    <div>
      {data.map(tender => (
        <div key={tender.id}>{tender.name}</div>
      ))}
    </div>
  );
}
```

### 2. Создание элемента

```typescript
export default function CreateTenderForm() {
  const createMutation = useCreateTender();
  
  const handleSubmit = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      alert('Тендер создан!');
      // Список тендеров обновится автоматически
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
```

### 3. Кнопка "Обновить"

```typescript
const { data, refetch } = useTenders();

return (
  <button onClick={() => refetch()}>
    🔄 Обновить
  </button>
);
```

### 4. Состояние загрузки при мутации

```typescript
const updateMutation = useUpdateTender();

return (
  <button 
    onClick={() => updateMutation.mutate({ id: 1, updates: {...} })}
    disabled={updateMutation.isPending}
  >
    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
  </button>
);
```

---

## ⚙️ Настройки кэша

Все настройки в `/components/QueryProvider.tsx`:

```typescript
staleTime: 2 * 60 * 1000,        // 2 минуты - данные свежие
gcTime: 10 * 60 * 1000,          // 10 минут - хранить в памяти
refetchOnWindowFocus: false,     // НЕ обновлять при фокусе
refetchOnReconnect: true,        // Обновить при восстановлении сети
```

**Что это значит?**

- Данные считаются свежими **2 минуты** - не будут перезапрашиваться
- Данные хранятся в памяти **10 минут** после последнего использования
- При переключении вкладок данные **НЕ** перезагружаются (главная оптимизация!)
- При восстановлении интернета данные обновляются автоматически

---

## 🐛 Отладка

### React Query DevTools

В development режиме внизу справа кнопка для DevTools:

- Просмотр всех queries
- Состояние кэша
- Время жизни данных
- Ручная очистка кэша

### Логирование

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useQueries';

const queryClient = useQueryClient();

// Посмотреть кэш
console.log(queryClient.getQueryData(queryKeys.tenders.all));

// Инвалидировать вручную
queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });

// Очистить кэш
queryClient.clear();
```

---

## 🎯 Best Practices

### ✅ Делай так:

```typescript
// 1. Используй hooks на верхнем уровне компонента
const { data } = useTenders();

// 2. Используй mutateAsync для async/await
await createMutation.mutateAsync(data);

// 3. Проверяй состояние загрузки
if (mutation.isPending) return <Spinner />;

// 4. Обрабатывай ошибки
if (error) return <Error message={error.message} />;
```

### ❌ Не делай так:

```typescript
// 1. НЕ вызывай hooks внутри условий
if (condition) {
  const { data } = useTenders(); // ❌ Неправильно!
}

// 2. НЕ используй mutate без обработки ошибок
mutation.mutate(data); // ❌ Ошибки не обработаны

// 3. НЕ вызывай loadData вручную
loadTenders(); // ❌ Не нужно, кэш обновится сам
```

---

## 📊 Когда данные обновляются?

### Автоматически:

1. ✅ После создания/обновления/удаления (mutations)
2. ✅ При восстановлении интернета
3. ✅ Через 2 минуты (staleTime)

### Вручную:

```typescript
const { refetch } = useTenders();

// Обновить принудительно
await refetch();
```

---

## 🔥 Горячие клавиши

**React Query DevTools:**
- `Открыть DevTools`: Кликнуть по кнопке внизу справа
- `Очистить кэш`: Кнопка "Clear" в DevTools
- `Refetch`: Кнопка "Refetch" рядом с query

---

## 📖 Дополнительная информация

- **Полная документация:** `CACHING_IMPLEMENTATION.md`
- **React Query docs:** https://tanstack.com/query/latest
- **Query Keys:** `/hooks/useQueries.ts` → `queryKeys`

---

## 🎉 Готово!

Теперь вы знаете, как использовать новую систему кэширования.

**Главное правило:** Используйте hooks из `/hooks/useQueries.ts` вместо прямых вызовов API!
