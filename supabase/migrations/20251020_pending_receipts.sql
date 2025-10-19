-- Создание таблицы для временного хранения распознанных чеков
CREATE TABLE IF NOT EXISTS pending_receipts (
  id BIGSERIAL PRIMARY KEY,
  telegram_id TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date TEXT,
  store TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_pending_receipts_telegram_id ON pending_receipts(telegram_id);

-- Автоматическое удаление старых записей (старше 1 часа)
CREATE OR REPLACE FUNCTION delete_old_pending_receipts()
RETURNS void AS $$
BEGIN
  DELETE FROM pending_receipts 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Комментарии
COMMENT ON TABLE pending_receipts IS 'Временное хранение распознанных чеков до выбора тендера';
COMMENT ON COLUMN pending_receipts.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN pending_receipts.amount IS 'Сумма из чека';
