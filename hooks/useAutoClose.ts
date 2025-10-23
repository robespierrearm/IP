import { useEffect } from 'react';

/**
 * Хук для автоматического закрытия элемента через timeout
 * и при клике вне элемента
 * 
 * @param isOpen - состояние открытия
 * @param onClose - функция закрытия
 * @param timeout - время до автозакрытия (мс)
 * @param selector - CSS селектор элемента (для клика вне)
 */
export function useAutoClose(
  isOpen: boolean,
  onClose: () => void,
  timeout = 3000,
  selector = '[data-card-id]'
) {
  useEffect(() => {
    if (!isOpen) return;

    // Таймер автозакрытия
    const timer = setTimeout(onClose, timeout);
    
    // Обработчик клика вне элемента
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(selector)) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, onClose, timeout, selector]);
}
