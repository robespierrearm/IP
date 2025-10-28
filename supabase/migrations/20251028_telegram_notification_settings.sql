-- Настройки уведомлений в Telegram
CREATE TABLE IF NOT EXISTS telegram_notification_settings (
  id SERIAL PRIMARY KEY,
  
  -- Кому отправлять (массив telegram_id подключённых пользователей)
  recipients TEXT[] DEFAULT '{}',
  
  -- Какие уведомления отправлять
  notify_new_tender BOOLEAN DEFAULT true,
  notify_won BOOLEAN DEFAULT true,
  notify_lost BOOLEAN DEFAULT false,
  notify_deadline_24h BOOLEAN DEFAULT true,
  notify_status_change BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Вставляем дефолтные настройки (одна строка)
INSERT INTO telegram_notification_settings (id) 
VALUES (1)
ON CONFLICT DO NOTHING;

-- RLS политики
ALTER TABLE telegram_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON telegram_notification_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
