-- Удаляем неиспользуемую колонку notify_deadline_24h
-- (функционал дедлайнов не реализован)

ALTER TABLE telegram_notification_settings 
DROP COLUMN IF EXISTS notify_deadline_24h;
