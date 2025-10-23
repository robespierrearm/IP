# 🔍 Настройка Sentry

## ✅ Что сделано:

1. Установлен `@sentry/nextjs`
2. Созданы конфигурационные файлы:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - `sentry.edge.config.ts`
3. Обновлен `next.config.ts`

## 📝 Что нужно сделать:

### 1. Создать проект в Sentry:
1. Зайти на https://sentry.io
2. Создать новый проект (Next.js)
3. Получить DSN

### 2. Добавить переменные окружения:

В `.env.local`:
```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_AUTH_TOKEN=your-auth-token
```

В Vercel (Settings → Environment Variables):
```
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_AUTH_TOKEN=your-auth-token
```

### 3. Обновить next.config.ts:

Заменить в строках 99-100:
```typescript
org: "your-org",  // → ваша организация в Sentry
project: "tender-crm",  // → название проекта
```

### 4. Проверка работы:

После деплоя в production:
1. Откройте приложение
2. Вызовите ошибку (например, несуществующий роут)
3. Проверьте в Sentry Dashboard

## 🎯 Что даст Sentry:

- ✅ Автоматическое отслеживание ошибок
- ✅ Performance monitoring
- ✅ User feedback
- ✅ Release tracking
- ✅ Source maps для отладки

## 📊 Настройки:

- **tracesSampleRate: 1.0** - 100% запросов отслеживаются
- **profilesSampleRate: 1.0** - 100% профилирование
- **enabled: production only** - работает только в production

## 🔧 Тестирование локально:

```bash
# Установить переменные
export NEXT_PUBLIC_SENTRY_DSN=your-dsn
export NODE_ENV=production

# Собрать и запустить
npm run build
npm start
```

## ✅ Готово!

Sentry настроен и готов к использованию после добавления DSN.
