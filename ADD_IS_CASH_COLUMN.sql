-- Добавляем колонку is_cash в таблицу expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_cash BOOLEAN DEFAULT false;

-- Обновляем существующие записи (по умолчанию все безнал)
UPDATE expenses 
SET is_cash = false 
WHERE is_cash IS NULL;

-- Добавляем комментарий
COMMENT ON COLUMN expenses.is_cash IS 'Наличка (true) или безнал (false). Наличка не учитывается в УСН.';
