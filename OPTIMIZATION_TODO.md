# 🚀 План оптимизации TenderCRM

## ❌ Текущие проблемы:

### 1. **Dashboard не загружает данные**
- Использует прямые запросы к Supabase
- Нет обработки ошибок
- Медленная загрузка

### 2. **Accounting не загружает данные**
- Использует прямые запросы к Supabase  
- Нет обработки ошибок
- Нет loading состояния

### 3. **Отсутствуют API routes:**
- `/api/expenses` - для бухгалтерии
- `/api/files` - для файлов
- `/api/dashboard` - для dashboard данных

---

## ✅ Что нужно сделать:

### **Приоритет 1: Исправить загрузку данных**

1. **Dashboard (`app/(dashboard)/dashboard/page.tsx`):**
   ```typescript
   // Добавить обработку ошибок:
   const loadTenders = async () => {
     try {
       const { data, error } = await supabase...
       if (error) throw error;
       setTenders(data || []);
     } catch (error) {
       console.error('Ошибка загрузки тендеров:', error);
       setTenders([]);
     }
   };
   ```

2. **Accounting (`app/(dashboard)/accounting/page.tsx`):**
   ```typescript
   // Добавить обработку ошибок и loading
   const [isLoading, setIsLoading] = useState(true);
   
   try {
     const { data, error } = await supabase...
     if (error) throw error;
   } catch (error) {
     console.error('Ошибка:', error);
   } finally {
     setIsLoading(false);
   }
   ```

### **Приоритет 2: Создать API routes**

1. **`/api/expenses/route.ts`:**
   ```typescript
   export async function GET(request: NextRequest) {
     const tenderId = request.nextUrl.searchParams.get('tender_id');
     const { data, error } = await supabase
       .from('expenses')
       .select('*')
       .eq('tender_id', tenderId);
     return NextResponse.json({ data, error });
   }
   ```

2. **`/api/files/route.ts`:**
   ```typescript
   export async function GET() {
     const { data, error } = await supabase
       .from('files')
       .select('*')
       .eq('show_on_dashboard', true)
       .limit(5);
     return NextResponse.json({ data, error });
   }
   ```

### **Приоритет 3: Оптимизация**

1. **Добавить кэширование:**
   ```typescript
   export const revalidate = 60; // кэш на 60 секунд
   ```

2. **Использовать React Query или SWR:**
   ```typescript
   import useSWR from 'swr';
   const { data, error } = useSWR('/api/tenders', fetcher);
   ```

3. **Lazy loading для тяжёлых компонентов:**
   ```typescript
   const TenderCard = dynamic(() => import('@/components/TenderCard'));
   ```

---

## 🔧 Быстрые исправления (сейчас):

### 1. Добавить try-catch везде
### 2. Добавить loading states
### 3. Добавить error messages для пользователя
### 4. Проверить Supabase credentials

---

## 📊 Метрики производительности:

- Dashboard: ~3s загрузка → цель: <1s
- Accounting: ~7s загрузка → цель: <2s
- Suppliers: ~9s загрузка → цель: <2s

---

## ⚡ Следующая сессия:

1. Создать все недостающие API routes
2. Переписать страницы на использование API
3. Добавить React Query для кэширования
4. Оптимизировать запросы к БД
5. Добавить индексы в Supabase
