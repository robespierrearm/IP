# 🤖 Исправление памяти Telegram бота

## ❌ Проблема:
Бот не запоминает разговор - каждое сообщение обрабатывается как новое.

## 🔍 Причина:
Таблица `chat_history` не создана в Supabase или была удалена.

---

## ✅ Решение (3 шага):

### **Шаг 1: Проверка таблицы**

Запусти скрипт проверки:

```bash
cd /Users/testovyj/CascadeProjects/IP
npx tsx scripts/check-chat-history.ts
```

Если видишь ❌ "Таблица НЕ СУЩЕСТВУЕТ" - переходи к Шагу 2.

---

### **Шаг 2: Создание таблицы в Supabase**

1. **Открой Supabase Dashboard:**
   - Перейди на https://supabase.com/dashboard
   - Выбери проект IP

2. **Открой SQL Editor:**
   - В левом меню нажми "SQL Editor"
   - Нажми "New query"

3. **Скопируй и выполни SQL:**

```sql
-- Создание таблицы для истории чата
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_chat_history_telegram_id ON chat_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Функция автоочистки старых сообщений (старше 7 дней)
CREATE OR REPLACE FUNCTION cleanup_old_chat_history()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_history 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE chat_history IS 'История диалогов с Telegram ботом';
COMMENT ON COLUMN chat_history.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN chat_history.role IS 'Роль: user или assistant';
COMMENT ON COLUMN chat_history.content IS 'Текст сообщения';
```

4. **Нажми "Run"** (или Ctrl+Enter)

5. **Проверь результат:**
   - Должно появиться "Success. No rows returned"

---

### **Шаг 3: Настройка RLS (Row Level Security)**

В том же SQL Editor выполни:

```sql
-- Включаем RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать и писать (для бота)
CREATE POLICY "Allow all access to chat_history" ON chat_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 🧪 Проверка:

1. **Запусти скрипт снова:**
```bash
npx tsx scripts/check-chat-history.ts
```

Должно быть: ✅ "Таблица chat_history существует!"

2. **Проверь в боте:**
   - Напиши боту: "Привет, меня зовут Иван"
   - Потом напиши: "Как меня зовут?"
   - Бот должен ответить: "Иван" (или что-то похожее)

---

## 📊 Как работает память:

### **Что сохраняется:**
- ✅ Последние **20 сообщений** каждого пользователя
- ✅ Роль (user/assistant)
- ✅ Текст сообщения
- ✅ Время создания

### **Автоочистка:**
- Сообщения старше **7 дней** автоматически удаляются
- Это экономит место в базе данных

### **Как бот использует историю:**
```typescript
// 1. Загружает последние 20 сообщений
const { data: history } = await supabase
  .from('chat_history')
  .select('role, content')
  .eq('telegram_id', telegramId)
  .order('created_at', { ascending: true })
  .limit(20);

// 2. Отправляет историю в AI
const messages = [
  { role: 'system', content: systemPrompt },
  ...history, // <-- История здесь!
  { role: 'user', content: userMessage },
];

// 3. Сохраняет новые сообщения
await supabase.from('chat_history').insert([
  { telegram_id: telegramId, role: 'user', content: userMessage },
  { telegram_id: telegramId, role: 'assistant', content: aiResponse },
]);
```

---

## 🔧 Если проблема осталась:

### **Проверь логи:**
```bash
# В Vercel Dashboard:
# 1. Перейди в проект IP
# 2. Откройвкладку "Logs"
# 3. Найди ошибки связанные с chat_history
```

### **Проверь переменные окружения:**
```bash
# В Vercel Dashboard -> Settings -> Environment Variables
# Должны быть:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **Ручная очистка старой истории:**
```sql
-- Удалить всю историю (если нужно начать с чистого листа)
DELETE FROM chat_history;

-- Или удалить только старые сообщения
DELETE FROM chat_history WHERE created_at < NOW() - INTERVAL '7 days';
```

---

## 📝 Полезные команды:

```sql
-- Посмотреть всю историю конкретного пользователя
SELECT * FROM chat_history 
WHERE telegram_id = 'YOUR_TELEGRAM_ID'
ORDER BY created_at DESC;

-- Посмотреть статистику
SELECT 
  telegram_id,
  COUNT(*) as message_count,
  MAX(created_at) as last_message
FROM chat_history
GROUP BY telegram_id
ORDER BY last_message DESC;

-- Удалить историю конкретного пользователя
DELETE FROM chat_history WHERE telegram_id = 'YOUR_TELEGRAM_ID';
```

---

## ✅ Готово!

После выполнения всех шагов бот будет помнить разговор! 🎉

**Проверь:** Напиши боту несколько сообщений и убедись что он помнит контекст.
