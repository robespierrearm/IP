# 🤖 Настройка Telegram бота

## Шаг 1: Выполнить миграцию БД

Зайдите в Supabase Dashboard и выполните SQL:

```sql
-- Скопируйте содержимое файла:
-- supabase/migrations/20251020_telegram_connections.sql
```

Или через SQL Editor в Supabase:
1. Откройте https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Вставьте SQL из файла миграции
3. Нажмите "Run"

## Шаг 2: Настроить Webhook

После деплоя на Vercel, выполните команду:

```bash
curl -X POST https://api.telegram.org/bot8461717103:AAEZl4hs5oXaOtnCsKNexcVGCPdjeG4RvkA/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://ip-mauve-pi.vercel.app/api/telegram/webhook"}'
```

## Шаг 3: Проверить работу

1. Откройте админку → Telegram
2. Сгенерируйте код
3. Найдите бота в Telegram (имя будет в ответе от setWebhook)
4. Отправьте `/start ВАШ_КОД`
5. Бот должен ответить и подключиться!

## Переменные окружения

Добавьте в Vercel:
```
TELEGRAM_BOT_TOKEN=8461717103:AAEZl4hs5oXaOtnCsKNexcVGCPdjeG4RvkA
```
