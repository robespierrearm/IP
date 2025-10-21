# 📋 Полная документация проекта IP (Intelligent Procurement)

## 🎯 Описание проекта

**IP (Intelligent Procurement)** - веб-приложение для управления тендерами, поставщиками и финансами с интеграцией Telegram-бота и AI-ассистента. Включает десктопную и мобильную (PWA) версии.

---

## 🏗️ Технологический стек

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT, httpOnly cookies)
- **AI**: Google Gemini AI, Intelligence.io
- **Telegram**: Telegram Bot API
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: Vercel

---

## 🗄️ База данных (Supabase PostgreSQL)

### 1. Таблица `users`
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
full_name TEXT
role TEXT DEFAULT 'user'
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 2. Таблица `tenders` (Тендеры)
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL                    -- Название тендера
status TEXT NOT NULL DEFAULT 'новый'  -- Статус
purchase_number TEXT                  -- Номер гос. закупки
link TEXT                            -- Ссылка на тендер
region TEXT                          -- Регион/адрес
publication_date DATE                -- Дата публикации
submission_date DATE                 -- Дата подачи (автоматически)
submission_deadline DATE             -- Дедлайн подачи
start_price NUMERIC(15, 2)          -- Начальная цена
submitted_price NUMERIC(15, 2)      -- Цена подачи
win_price NUMERIC(15, 2)            -- Цена победы
user_id UUID REFERENCES users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

**Статусы тендера:**
1. `новый` - Создан, заявка не подана
2. `подано` - Заявка подана (автоматически → "на рассмотрении")
3. `на рассмотрении` - На рассмотрении у заказчика
4. `победа` - Тендер выигран
5. `в работе` - Контракт в работе
6. `завершён` - Контракт завершен
7. `проигрыш` - Тендер проигран

**Логика переходов:**
```
новый → подано → на рассмотрении → победа/проигрыш
                                  ↓
                              в работе → завершён
```

**Автоматика при смене статуса:**
- `новый → подано`: `submission_date = сегодня`, затем автоматически → "на рассмотрении"
- `новый → на рассмотрении`: `submission_date = сегодня` (если не была)
- `на рассмотрении → победа`: Требуется `win_price`

**Отображение полей по статусам:**
- **новый**: название, начальная цена, дата публикации, дедлайн
- **подано**: + цена подачи
- **на рассмотрении**: + дата подачи, цена подачи
- **победа/в работе/завершён**: + цена победы (все поля)
- **проигрыш**: дата подачи, цена подачи (без цены победы)

### 3. Таблица `suppliers` (Поставщики)
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL              -- Название компании
category TEXT                   -- Категория
contact_person TEXT             -- Контактное лицо
phone TEXT                      -- Телефон
email TEXT                      -- Email
address TEXT                    -- Адрес
inn TEXT                        -- ИНН
notes TEXT                      -- Заметки
user_id UUID REFERENCES users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 4. Таблица `expenses` (Расходы)
```sql
id SERIAL PRIMARY KEY
description TEXT NOT NULL       -- Описание
amount NUMERIC(15, 2) NOT NULL -- Сумма
category TEXT                   -- Категория
date DATE NOT NULL             -- Дата расхода
tender_id INTEGER REFERENCES tenders(id)    -- Связь с тендером
supplier_id INTEGER REFERENCES suppliers(id) -- Связь с поставщиком
payment_method TEXT            -- Способ оплаты
notes TEXT                     -- Заметки
user_id UUID REFERENCES users(id)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 5. Таблица `files` (Файлы)
```sql
id SERIAL PRIMARY KEY
file_name TEXT NOT NULL
file_path TEXT NOT NULL        -- Путь в Supabase Storage
file_size INTEGER
mime_type TEXT
tender_id INTEGER REFERENCES tenders(id)
document_type TEXT             -- Тип документа
uploaded_by UUID REFERENCES users(id)
user_id UUID REFERENCES users(id)
created_at TIMESTAMPTZ
```

### 6. Таблица `telegram_connections`
```sql
id SERIAL PRIMARY KEY
user_id UUID REFERENCES users(id)
telegram_id BIGINT UNIQUE NOT NULL
telegram_username TEXT
first_name TEXT
last_name TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 7. Таблица `chat_history` (История AI)
```sql
id SERIAL PRIMARY KEY
user_id UUID REFERENCES users(id)
telegram_id BIGINT
role TEXT NOT NULL             -- user/assistant/system
content TEXT NOT NULL          -- Сообщение
created_at TIMESTAMPTZ
```

### 8. Таблица `pending_receipts` (Чеки OCR)
```sql
id SERIAL PRIMARY KEY
telegram_id BIGINT NOT NULL
file_path TEXT NOT NULL
ocr_text TEXT                  -- Распознанный текст
status TEXT DEFAULT 'pending'  -- pending/processed/error
created_at TIMESTAMPTZ
```

---

## 🔐 Аутентификация

1. **Вход** (`/api/auth/login`):
   - Проверка email/пароль
   - Генерация JWT токена
   - Установка httpOnly cookie

2. **Middleware** (`middleware.ts`):
   - Проверка токена
   - Редирект неавторизованных → `/login`
   - Определение мобильного устройства → `/m/*`

3. **RLS (Row Level Security)**:
   - Пользователи видят только свои данные
   - `user_id = auth.uid()`

---

## 🤖 Telegram Bot

### Команды:
- `/start` - Регистрация/приветствие
- `/dashboard` - Статистика
- `/tenders` - Список тендеров
- `/reminders` - Напоминания о дедлайнах
- `/ai` - Режим AI-ассистента
- `/help` - Справка

### Функционал:

**1. Загрузка чеков (OCR)**
- Фото чека → OCR → AI анализ → создание расхода

**2. AI-ассистент**
- Обработка естественного языка
- Выполнение действий (CRUD тендеров, поставщиков, расходов)
- Поиск и аналитика

**3. Уведомления**
- Напоминания о дедлайнах
- Уведомления о смене статусов

### Webhook: `/api/telegram/webhook`

---

## 🧠 AI Integration

### Провайдеры:
1. **Google Gemini AI** (основной) - `gemini-2.0-flash-exp`
2. **Intelligence.io** (fallback) - `meta-llama/llama-3.3-70b-instruct`

### Функции AI:

**Тендеры:**
- `createTender(data)` - Создать
- `updateTender(id, data)` - Обновить
- `deleteTender(id)` - Удалить
- `getTenders(filters)` - Получить список
- `getTenderById(id)` - Получить по ID

**Поставщики:**
- `createSupplier(data)` - Создать
- `updateSupplier(id, data)` - Обновить
- `deleteSupplier(id)` - Удалить
- `getSuppliers(filters)` - Получить список

**Расходы:**
- `createExpense(data)` - Создать
- `updateExpense(id, data)` - Обновить
- `deleteExpense(id)` - Удалить
- `getExpenses(filters)` - Получить список

**Аналитика:**
- `getStatistics()` - Статистика
- `getTotalExpenses(period)` - Сумма расходов
- `getActiveTenders()` - Активные тендеры
- `getUpcomingDeadlines()` - Ближайшие дедлайны

### Пример работы:
**Пользователь:** "Создай тендер на ремонт дороги, 5 млн, дедлайн 15 января"

**AI выполняет:**
```typescript
await createTender({
  name: "Ремонт дороги",
  start_price: 5000000,
  submission_deadline: "2025-01-15",
  status: "новый"
});
```

**Ответ:** "✅ Тендер создан. Начальная цена: 5 000 000 ₽, дедлайн: 15.01.2025"

---

## 📱 Мобильная версия (PWA)

### Особенности:
- **Swipe-to-Delete** (iOS-стиль)
- **Bottom Navigation** (5 вкладок)
- **Карточки** вместо таблиц
- **Floating Action Button**
- **Упрощенные формы**
- **Автоматический редирект** с десктопа

### Редирект:
- `/` → `/m/`
- `/tenders` → `/m/tenders`
- `/suppliers` → `/m/suppliers`

---

## 🔄 API Routes

### Тендеры (`/api/tenders`)
- `GET /api/tenders` - Список
- `POST /api/tenders` - Создать
- `PUT /api/tenders/:id` - Обновить
- `DELETE /api/tenders/:id` - Удалить

### Поставщики (`/api/suppliers`)
- `GET /api/suppliers` - Список
- `POST /api/suppliers` - Создать
- `PUT /api/suppliers/:id` - Обновить
- `DELETE /api/suppliers/:id` - Удалить

### Расходы (`/api/expenses`)
- `GET /api/expenses` - Список
- `POST /api/expenses` - Создать
- `PUT /api/expenses/:id` - Обновить
- `DELETE /api/expenses/:id` - Удалить

### Аутентификация (`/api/auth`)
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход

### Telegram (`/api/telegram/webhook`)
- `POST /api/telegram/webhook` - Webhook

---

## 📊 Бизнес-логика

### Жизненный цикл тендера:

1. **Создание** (`новый`)
   - Базовая информация
   - Статус = "новый"
   - Скрыты: дата подачи, цена подачи, цена победы

2. **Подача** (`подано` → `на рассмотрении`)
   - Ввод цены подачи
   - Автоматически: `submission_date = сегодня`
   - Автоматически → "на рассмотрении"

3. **Рассмотрение** (`на рассмотрении`)
   - Ожидание результата
   - Можно редактировать дату/цену подачи

4. **Результат**
   - **Победа**: Ввод цены победы → "в работе" → "завершён"
   - **Проигрыш**: Финальный статус

### Финансовая аналитика:

**Общие расходы:**
```sql
SELECT SUM(amount) FROM expenses WHERE user_id = ?
```

**Расходы по категориям:**
```sql
SELECT category, SUM(amount) 
FROM expenses 
WHERE user_id = ? 
GROUP BY category
```

**Прибыль от тендеров:**
```sql
SELECT 
  name,
  win_price,
  (SELECT SUM(amount) FROM expenses WHERE tender_id = t.id) as expenses,
  win_price - expenses as profit
FROM tenders t
WHERE status IN ('победа', 'в работе', 'завершён')
```

---

## 🎨 UI/UX

### Десктоп:
- Сайдбар навигация
- Таблицы с фильтрацией
- Модальные окна
- Drag & Drop файлов
- Графики (Chart.js)

### Мобильная:
- Bottom Navigation
- Карточки
- Swipe gestures
- FAB кнопка
- Pull-to-refresh

### Цвета статусов:
- `новый`: Синий
- `подано`: Индиго
- `на рассмотрении`: Фиолетовый
- `победа`: Зеленый
- `в работе`: Оранжевый
- `завершён`: Серо-зеленый
- `проигрыш`: Красный

---

## 🔧 Переменные окружения

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-bot-token
GOOGLE_AI_API_KEY=your-gemini-api-key
INTELLIGENCE_API_KEY=your-intelligence-api-key
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🚀 Основные функции

### 1. Управление тендерами
✅ CRUD операции
✅ Отслеживание статусов
✅ Автоматические переходы
✅ Связь с расходами
✅ Фильтрация и поиск

### 2. Управление поставщиками
✅ База поставщиков
✅ Контактная информация
✅ Категоризация
✅ Связь с расходами

### 3. Финансовый учет
✅ Учет расходов
✅ Категоризация
✅ Привязка к тендерам
✅ Аналитика и отчеты
✅ OCR чеков через Telegram

### 4. Telegram Bot
✅ Управление через чат
✅ AI-ассистент
✅ Распознавание чеков
✅ Уведомления
✅ Быстрый доступ к данным

### 5. AI-ассистент
✅ Естественный язык
✅ Выполнение команд
✅ Аналитика
✅ Контекстная помощь

---

## 📦 Установка

```bash
npm install
npm run dev        # Разработка
npm run build      # Сборка
npm start          # Продакшен
```

### Настройка Telegram Webhook:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d '{"url": "https://your-app.vercel.app/api/telegram/webhook"}'
```

---

## 📝 Ключевые особенности

1. **Автоматизация**: Автоматическая установка дат и переходы статусов
2. **Умные формы**: Динамическое отображение полей по статусу
3. **Swipe-to-Delete**: iOS-стиль свайпа в мобильной версии
4. **AI-интеграция**: Управление через естественный язык
5. **OCR чеков**: Автоматическое распознавание и создание расходов
6. **PWA**: Работа как нативное приложение
7. **Real-time**: Мгновенные обновления через Supabase
8. **Безопасность**: RLS, JWT, httpOnly cookies

---

**Версия документации:** 1.0
**Дата:** 21.10.2025
**Автор:** IP Development Team
