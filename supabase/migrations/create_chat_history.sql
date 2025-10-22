-- Таблица для хранения истории чата с AI (Telegram и Web)
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT,           -- Для Telegram бота
  user_id INTEGER,            -- Для веб AI помощника
  role TEXT NOT NULL,         -- 'user' или 'assistant'
  content TEXT NOT NULL,      -- Текст сообщения
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_chat_history_telegram_id ON chat_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Автоочистка старых сообщений (старше 30 дней)
-- Это предотвратит бесконечный рост таблицы
CREATE OR REPLACE FUNCTION cleanup_old_chat_history()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_history 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Комментарии для документации
COMMENT ON TABLE chat_history IS 'История чата с AI помощником (Telegram и Web)';
COMMENT ON COLUMN chat_history.telegram_id IS 'ID пользователя в Telegram (для бота)';
COMMENT ON COLUMN chat_history.user_id IS 'ID пользователя в системе (для веб)';
COMMENT ON COLUMN chat_history.role IS 'Роль: user (пользователь) или assistant (AI)';
COMMENT ON COLUMN chat_history.content IS 'Текст сообщения';
