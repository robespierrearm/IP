import { Tender } from './supabase';

/**
 * Возвращает CSS классы для цвета статуса тендера
 */
export const getStatusColor = (status: Tender['status']): string => {
  switch (status) {
    case 'новый':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'подано':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'на рассмотрении':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'победа':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'в работе':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'завершён':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'проигрыш':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

/**
 * Возвращает эмодзи для статуса тендера
 */
export const getStatusEmoji = (status: Tender['status']): string => {
  switch (status) {
    case 'новый':
      return '🆕';
    case 'подано':
      return '📤';
    case 'на рассмотрении':
      return '🔍';
    case 'победа':
      return '🏆';
    case 'в работе':
      return '⚙️';
    case 'завершён':
      return '✅';
    case 'проигрыш':
      return '❌';
    default:
      return '📋';
  }
};

/**
 * Форматирует цену с разделителями
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (!price) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Форматирует дату в читаемый формат
 */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Проверяет, истекает ли дедлайн скоро (в течение 3 дней)
 */
export const isDeadlineSoon = (deadline: string | null | undefined): boolean => {
  if (!deadline) return false;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  return deadlineDate >= now && deadlineDate <= threeDaysFromNow;
};

/**
 * Возвращает количество дней до дедлайна
 */
export const getDaysUntilDeadline = (deadline: string | null | undefined): number | null => {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
