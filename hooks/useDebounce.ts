import { useEffect, useState } from 'react';

/**
 * Debounce hook - задерживает обновление значения
 * Используется для поиска, чтобы не фильтровать при каждой букве
 *
 * @param value - значение для debounce
 * @param delay - задержка в миллисекундах (по умолчанию 300ms)
 * @returns debounced значение
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер для обновления значения
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при изменении value или размонтировании
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
