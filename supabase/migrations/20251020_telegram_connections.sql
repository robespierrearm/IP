-- Создание таблицы для Telegram подключений
CREATE TABLE IF NOT EXISTS telegram_connections (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  telegram_id TEXT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  auth_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_telegram_connections_user_id ON telegram_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_telegram_id ON telegram_connections(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_auth_code ON telegram_connections(auth_code);
CREATE INDEX IF NOT EXISTS idx_telegram_connections_is_active ON telegram_connections(is_active);

-- Комментарии
COMMENT ON TABLE telegram_connections IS 'Подключения пользователей к Telegram боту';
COMMENT ON COLUMN telegram_connections.user_id IS 'ID пользователя в системе';
COMMENT ON COLUMN telegram_connections.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN telegram_connections.telegram_username IS 'Username в Telegram';
COMMENT ON COLUMN telegram_connections.auth_code IS 'Код авторизации для подключения';
COMMENT ON COLUMN telegram_connections.is_active IS 'Активно ли подключение';
COMMENT ON COLUMN telegram_connections.connected_at IS 'Дата подключения';
COMMENT ON COLUMN telegram_connections.last_activity IS 'Последняя активность';
