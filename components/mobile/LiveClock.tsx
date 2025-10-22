'use client';

import { useEffect, useState, memo } from 'react';

/**
 * Живые часы - обновляются каждую секунду
 * Вынесены в отдельный компонент с memo чтобы не ре-рендерить весь Dashboard
 */
export const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-white font-bold text-lg">
      {time.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </div>
  );
});
