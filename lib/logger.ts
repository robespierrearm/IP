/**
 * Server-side Logger using Winston
 * 
 * Usage:
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Failed to process', { error: err.message });
 * logger.warn('Rate limit approaching', { count: 95 });
 */

import winston from 'winston';

// Определяем формат логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Формат для консоли (более читаемый)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Создаём logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'tender-crm' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    
    // File transport для ошибок (только в production)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

// Helper functions для частых случаев
export const logAPI = {
  request: (method: string, path: string, meta?: Record<string, any>) => {
    logger.info(`API Request: ${method} ${path}`, meta);
  },
  response: (method: string, path: string, status: number, meta?: Record<string, any>) => {
    logger.info(`API Response: ${method} ${path} - ${status}`, meta);
  },
  error: (method: string, path: string, error: any, meta?: Record<string, any>) => {
    logger.error(`API Error: ${method} ${path}`, {
      error: error.message || error,
      stack: error.stack,
      ...meta,
    });
  },
};

export const logAuth = {
  login: (email: string, success: boolean) => {
    logger.info(`Auth: Login ${success ? 'success' : 'failed'}`, { email });
  },
  logout: (email: string) => {
    logger.info('Auth: Logout', { email });
  },
};

export const logTelegram = {
  webhook: (chatId: number, messageType: string, meta?: Record<string, any>) => {
    logger.info('Telegram: Webhook received', { chatId, messageType, ...meta });
  },
  sent: (chatId: number, success: boolean) => {
    logger.info(`Telegram: Message ${success ? 'sent' : 'failed'}`, { chatId });
  },
};
