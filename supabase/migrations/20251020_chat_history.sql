-- Создание таблицы для истории чата
CREATE TABLE IF NOT EXISTS chat_history (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX IF NOT EXISTS idx_chat_history_telegram_id ON chat_history(telegram_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Функция автоочистки старых сообщений (старше 1 дня)
CREATE OR REPLACE FUNCTION cleanup_old_chat_history()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_history 
  WHERE created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Функция для получения последних N сообщений пользователя
CREATE OR REPLACE FUNCTION get_recent_messages(user_telegram_id TEXT, message_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    chat_history.role,
    chat_history.content,
    chat_history.created_at
  FROM chat_history
  WHERE telegram_id = user_telegram_id
  ORDER BY created_at DESC
  LIMIT message_limit;
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE chat_history IS 'История диалогов с Telegram ботом';
COMMENT ON COLUMN chat_history.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN chat_history.role IS 'Роль: user или assistant';
COMMENT ON COLUMN chat_history.content IS 'Текст сообщения';
COMMENT ON COLUMN chat_history.created_at IS 'Время создания сообщения';
