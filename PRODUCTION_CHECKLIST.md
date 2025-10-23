# ✅ ЧЕКЛИСТ ЗАПУСКА В PRODUCTION

**Дата:** 23 октября 2025  
**Статус:** Готовность 90%

---

## 🔧 ОБЯЗАТЕЛЬНО ПЕРЕД ЗАПУСКОМ

### 1. База данных (Supabase)

- [ ] Выполнить SQL миграцию индексов:
  ```sql
  -- Выполнить в Supabase SQL Editor
  -- Файл: supabase/migrations/20251023_add_performance_indexes.sql
  ```

- [ ] Проверить RLS политики:
  ```sql
  SELECT * FROM pg_policies WHERE tablename IN ('tenders', 'suppliers', 'expenses', 'files');
  ```

- [ ] Настроить backup (автоматический в Supabase Pro)

### 2. Переменные окружения (Vercel)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN
- [ ] `SENTRY_AUTH_TOKEN` - Sentry auth token
- [ ] `JWT_SECRET` - Секрет для JWT
- [ ] `TELEGRAM_BOT_TOKEN` - Токен бота (если используется)
- [ ] `GOOGLE_AI_API_KEY` - API ключ Gemini (если используется)

### 3. Sentry

- [ ] Создать проект в Sentry.io
- [ ] Получить DSN
- [ ] Обновить `next.config.ts`:
  ```typescript
  org: "your-org",  // → ваша организация
  project: "tender-crm",  // → название проекта
  ```
- [ ] Добавить переменные в Vercel
- [ ] Проверить работу после деплоя

### 4. GitHub Secrets

Добавить в Settings → Secrets and variables → Actions:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Vercel Settings

- [ ] Framework Preset: Next.js
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm ci`
- [ ] Node.js Version: 20.x

---

## ⚡ РЕКОМЕНДУЕТСЯ

### 6. Производительность

- [ ] Проверить Lighthouse score (цель: 90+)
- [ ] Проверить Web Vitals в Vercel Analytics
- [ ] Тест на медленном 3G
- [ ] Проверить размер bundle (<500KB)

### 7. Безопасность

- [ ] Проверить HTTPS
- [ ] Проверить CSP headers
- [ ] Проверить CORS настройки
- [ ] Audit npm пакетов: `npm audit`
- [ ] Обновить зависимости: `npm update`

### 8. Мониторинг

- [ ] Настроить алерты в Sentry
- [ ] Настроить Vercel Analytics
- [ ] Проверить логи в Vercel
- [ ] Настроить uptime monitoring (UptimeRobot, etc.)

### 9. Тестирование

- [ ] Запустить все тесты: `npm test`
- [ ] Проверить TypeScript: `npm run typecheck`
- [ ] Проверить ESLint: `npm run lint`
- [ ] Ручное тестирование критичных флоу

### 10. Документация

- [ ] Обновить README.md
- [ ] Проверить актуальность документации
- [ ] Добавить changelog для релиза

---

## 🚀 ПРОЦЕСС ДЕПЛОЯ

### Шаг 1: Подготовка

```bash
# Проверить тесты
npm test

# Проверить типы
npm run typecheck

# Проверить линтер
npm run lint

# Собрать проект
npm run build
```

### Шаг 2: Коммит и Push

```bash
git add -A
git commit -m "🚀 Production ready"
git push origin main
```

### Шаг 3: Автоматический деплой

- GitHub Actions запустится автоматически
- Vercel задеплоит при успешном build
- Проверить в Vercel Dashboard

### Шаг 4: Проверка после деплоя

- [ ] Открыть production URL
- [ ] Проверить логин
- [ ] Создать тестовый тендер
- [ ] Проверить все основные функции
- [ ] Проверить мобильную версию
- [ ] Проверить PWA (offline режим)

### Шаг 5: Мониторинг

- [ ] Проверить Sentry (нет ошибок)
- [ ] Проверить Vercel Analytics
- [ ] Проверить логи
- [ ] Настроить алерты

---

## 🔥 КРИТИЧНЫЕ ПРОВЕРКИ

### После первого деплоя:

1. **Авторизация работает?**
   - Логин/логаут
   - JWT токены
   - RLS в Supabase

2. **CRUD операции работают?**
   - Создание тендера
   - Редактирование
   - Удаление
   - Фильтрация

3. **Производительность OK?**
   - Lighthouse 90+
   - API <100ms
   - Нет ошибок в консоли

4. **Мобильная версия работает?**
   - Swipe gestures
   - Bottom navigation
   - PWA устанавливается

5. **Offline режим работает?**
   - Service Worker регистрируется
   - IndexedDB работает
   - Синхронизация при подключении

---

## 📊 МЕТРИКИ УСПЕХА

### Производительность:
- ✅ Lighthouse Performance: 90+
- ✅ First Contentful Paint: <1.5s
- ✅ Time to Interactive: <3s
- ✅ API Response: <100ms

### Стабильность:
- ✅ Uptime: 99.9%
- ✅ Error Rate: <0.1%
- ✅ Tests: 17/17 passing

### Безопасность:
- ✅ HTTPS: Enabled
- ✅ RLS: Enabled
- ✅ JWT: httpOnly cookies
- ✅ No vulnerabilities

---

## 🎯 ПОСЛЕ ЗАПУСКА

### День 1:
- [ ] Мониторить ошибки в Sentry
- [ ] Проверить метрики в Vercel
- [ ] Собрать feedback от пользователей

### Неделя 1:
- [ ] Проанализировать производительность
- [ ] Исправить найденные баги
- [ ] Оптимизировать узкие места

### Месяц 1:
- [ ] Добавить больше тестов
- [ ] Оптимизировать на основе метрик
- [ ] Планировать новые фичи

---

## ✅ ГОТОВО К ЗАПУСКУ?

Если все пункты выполнены - **МОЖНО ЗАПУСКАТЬ!** 🚀

**Текущий статус:** 90% готовности
**Осталось:** Применить индексы БД + добавить Sentry DSN

---

**Удачи с запуском!** 🎉
