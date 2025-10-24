import { Tender } from './supabase';

/**
 * Типы умных уведомлений для тендеров
 */
export type NotificationType = 
  | 'deadline_urgent'      // Дедлайн < 3 дней (новый)
  | 'deadline_soon'        // Дедлайн 3-7 дней (новый)
  | 'deadline_normal'      // Дедлайн > 7 дней (новый)
  | 'awaiting_results'     // Ждём результатов (подано)
  | 'under_review_normal'  // На рассмотрении < 7 дней
  | 'under_review_long'    // На рассмотрении > 7 дней (долго!)
  | 'work_start_soon'      // Скоро начало работ (победа)
  | 'work_in_progress'     // В работе (в работе)
  | 'completed'            // Завершено
  | 'lost'                 // Проиграли
  | null;                  // Нет уведомления

export interface TenderNotification {
  type: NotificationType;
  message: string;
  shortMessage: string;  // Для карточек
  icon: string;
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
  priority: 'urgent' | 'high' | 'normal' | 'low';
}

/**
 * Получить умное уведомление для тендера
 */
export function getSmartNotification(tender: Tender): TenderNotification | null {
  switch (tender.status) {
    case 'новый':
      return getNewTenderNotification(tender);
    case 'подано':
      return getSubmittedTenderNotification(tender);
    case 'на рассмотрении':
      return getUnderReviewNotification(tender);
    case 'победа':
      return getWonTenderNotification(tender);
    case 'в работе':
      return getInProgressNotification(tender);
    case 'завершён':
      return getCompletedNotification(tender);
    case 'проигрыш':
      return getLostNotification(tender);
    default:
      return null;
  }
}

/**
 * НОВЫЙ ТЕНДЕР - показываем дедлайн
 */
function getNewTenderNotification(tender: Tender): TenderNotification | null {
  if (!tender.submission_deadline) return null;

  const daysLeft = getDaysUntilDate(tender.submission_deadline);
  
  if (daysLeft < 0) {
    return {
      type: 'deadline_urgent',
      message: 'Дедлайн просрочен',
      shortMessage: 'Просрочен',
      icon: '⚠️',
      color: 'gray',
      priority: 'low',
    };
  }
  
  if (daysLeft === 0) {
    return {
      type: 'deadline_urgent',
      message: 'Дедлайн СЕГОДНЯ!',
      shortMessage: 'Сегодня!',
      icon: '🔥',
      color: 'red',
      priority: 'urgent',
    };
  }
  
  if (daysLeft === 1) {
    return {
      type: 'deadline_urgent',
      message: 'Дедлайн ЗАВТРА!',
      shortMessage: 'Завтра',
      icon: '⚡',
      color: 'red',
      priority: 'urgent',
    };
  }
  
  if (daysLeft <= 3) {
    return {
      type: 'deadline_urgent',
      message: `Дедлайн через ${daysLeft} ${getDaysWord(daysLeft)}`,
      shortMessage: `${daysLeft} дн.`,
      icon: '🔥',
      color: 'red',
      priority: 'urgent',
    };
  }
  
  if (daysLeft <= 7) {
    return {
      type: 'deadline_soon',
      message: `Дедлайн через ${daysLeft} ${getDaysWord(daysLeft)}`,
      shortMessage: `${daysLeft} дн.`,
      icon: '⏰',
      color: 'orange',
      priority: 'high',
    };
  }
  
  return {
    type: 'deadline_normal',
    message: `Дедлайн через ${daysLeft} ${getDaysWord(daysLeft)}`,
    shortMessage: `${daysLeft} дн.`,
    icon: '📅',
    color: 'gray',
    priority: 'normal',
  };
}

/**
 * ПОДАНО - ждём результатов
 */
function getSubmittedTenderNotification(tender: Tender): TenderNotification | null {
  if (!tender.submission_deadline) return null;

  const daysUntilResults = getDaysUntilDate(tender.submission_deadline);
  
  if (daysUntilResults < 0) {
    return {
      type: 'awaiting_results',
      message: 'Результаты должны быть объявлены',
      shortMessage: 'Ждём результатов',
      icon: '⏳',
      color: 'yellow',
      priority: 'high',
    };
  }
  
  if (daysUntilResults === 0) {
    return {
      type: 'awaiting_results',
      message: 'Результаты СЕГОДНЯ',
      shortMessage: 'Сегодня',
      icon: '🎯',
      color: 'orange',
      priority: 'high',
    };
  }
  
  if (daysUntilResults === 1) {
    return {
      type: 'awaiting_results',
      message: 'Результаты ЗАВТРА',
      shortMessage: 'Завтра',
      icon: '🎯',
      color: 'orange',
      priority: 'high',
    };
  }
  
  return {
    type: 'awaiting_results',
    message: `Результаты через ${daysUntilResults} ${getDaysWord(daysUntilResults)}`,
    shortMessage: `Через ${daysUntilResults} дн.`,
    icon: '⏳',
    color: 'blue',
    priority: 'normal',
  };
}

/**
 * НА РАССМОТРЕНИИ - сколько ждём
 */
function getUnderReviewNotification(tender: Tender): TenderNotification | null {
  if (!tender.submission_date) return null;

  const daysInReview = getDaysSinceDate(tender.submission_date);
  
  if (daysInReview > 7) {
    return {
      type: 'under_review_long',
      message: `На рассмотрении ${daysInReview} ${getDaysWord(daysInReview)}`,
      shortMessage: `${daysInReview} дн. ⚠️`,
      icon: '⚠️',
      color: 'orange',
      priority: 'high',
    };
  }
  
  return {
    type: 'under_review_normal',
    message: `На рассмотрении ${daysInReview} ${getDaysWord(daysInReview)}`,
    shortMessage: `${daysInReview} дн.`,
    icon: '⏳',
    color: 'yellow',
    priority: 'normal',
  };
}

/**
 * ПОБЕДА - когда начинаем работы
 */
function getWonTenderNotification(tender: Tender): TenderNotification | null {
  // Можно добавить поле start_date в будущем
  return {
    type: 'work_start_soon',
    message: 'Готовьтесь к началу работ',
    shortMessage: 'Начало работ',
    icon: '🎉',
    color: 'purple',
    priority: 'normal',
  };
}

/**
 * В РАБОТЕ - сколько дней в работе
 */
function getInProgressNotification(tender: Tender): TenderNotification | null {
  if (!tender.submission_date) return null;

  const daysInProgress = getDaysSinceDate(tender.submission_date);
  
  return {
    type: 'work_in_progress',
    message: `В работе ${daysInProgress} ${getDaysWord(daysInProgress)}`,
    shortMessage: `${daysInProgress} дн.`,
    icon: '🔨',
    color: 'green',
    priority: 'normal',
  };
}

/**
 * ЗАВЕРШЁН
 */
function getCompletedNotification(tender: Tender): TenderNotification | null {
  return {
    type: 'completed',
    message: 'Тендер завершён',
    shortMessage: 'Завершён',
    icon: '✅',
    color: 'gray',
    priority: 'low',
  };
}

/**
 * ПРОИГРЫШ
 */
function getLostNotification(tender: Tender): TenderNotification | null {
  return {
    type: 'lost',
    message: 'Тендер проигран',
    shortMessage: 'Проигран',
    icon: '❌',
    color: 'gray',
    priority: 'low',
  };
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */

// Получить количество дней до даты
function getDaysUntilDate(dateString: string): number {
  const targetDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Получить количество дней с даты
function getDaysSinceDate(dateString: string): number {
  const startDate = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);
  const diffTime = now.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Склонение слова "день"
function getDaysWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }
  
  if (lastDigit === 1) {
    return 'день';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }
  
  return 'дней';
}
