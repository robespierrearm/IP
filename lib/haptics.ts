/**
 * Haptic Feedback утилиты для мобильных устройств
 * Добавляет тактильную обратную связь при взаимодействии с UI
 */

export const haptics = {
  /**
   * Лёгкая вибрация (10ms) - для обычных нажатий
   */
  light: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },

  /**
   * Средняя вибрация (20ms) - для важных действий
   */
  medium: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  /**
   * Вибрация успеха (паттерн) - для успешных операций
   */
  success: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  /**
   * Вибрация ошибки (паттерн) - для ошибок
   */
  error: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  },

  /**
   * Вибрация предупреждения (паттерн) - для предупреждений
   */
  warning: () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  },
};
