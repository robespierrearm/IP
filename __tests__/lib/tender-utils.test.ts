import { describe, it, expect } from 'vitest';
import { 
  getStatusColor, 
  getStatusEmoji, 
  formatPrice, 
  formatDate,
  isDeadlineSoon,
  getDaysUntilDeadline 
} from '@/lib/tender-utils';

describe('tender-utils', () => {
  describe('getStatusColor', () => {
    it('возвращает правильный цвет для статуса "новый"', () => {
      expect(getStatusColor('новый')).toContain('bg-blue');
    });

    it('возвращает правильный цвет для статуса "победа"', () => {
      expect(getStatusColor('победа')).toContain('bg-green');
    });

    it('возвращает правильный цвет для статуса "проигрыш"', () => {
      expect(getStatusColor('проигрыш')).toContain('bg-red');
    });
  });

  describe('getStatusEmoji', () => {
    it('возвращает эмодзи для каждого статуса', () => {
      expect(getStatusEmoji('новый')).toBe('🆕');
      expect(getStatusEmoji('победа')).toBe('🏆');
      expect(getStatusEmoji('проигрыш')).toBe('❌');
    });
  });

  describe('formatPrice', () => {
    it('форматирует цену правильно', () => {
      expect(formatPrice(1000000)).toContain('1');
      expect(formatPrice(1000000)).toContain('000');
      expect(formatPrice(1000000)).toContain('₽');
    });

    it('возвращает "—" для null', () => {
      expect(formatPrice(null)).toBe('—');
    });

    it('возвращает "—" для undefined', () => {
      expect(formatPrice(undefined)).toBe('—');
    });
  });

  describe('formatDate', () => {
    it('форматирует дату правильно', () => {
      const result = formatDate('2025-01-15');
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it('возвращает "—" для null', () => {
      expect(formatDate(null)).toBe('—');
    });
  });

  describe('isDeadlineSoon', () => {
    it('возвращает true для дедлайна через 2 дня', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      expect(isDeadlineSoon(tomorrow.toISOString())).toBe(true);
    });

    it('возвращает false для дедлайна через 5 дней', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(isDeadlineSoon(future.toISOString())).toBe(false);
    });

    it('возвращает false для null', () => {
      expect(isDeadlineSoon(null)).toBe(false);
    });
  });

  describe('getDaysUntilDeadline', () => {
    it('возвращает количество дней до дедлайна', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(getDaysUntilDeadline(future.toISOString())).toBe(5);
    });

    it('возвращает null для null', () => {
      expect(getDaysUntilDeadline(null)).toBe(null);
    });
  });
});
