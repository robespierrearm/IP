/**
 * Simple Console Logger for Vercel compatibility
 * Winston doesn't work on Vercel Edge Runtime
 */

const formatMeta = (meta?: Record<string, any>): string => {
  if (!meta || Object.keys(meta).length === 0) return '';
  return ' ' + JSON.stringify(meta);
};

export const logger = {
  debug: (message: string, meta?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${message}${formatMeta(meta)}`);
    }
  },
  info: (message: string, meta?: Record<string, any>) => {
    console.log(`[INFO] ${message}${formatMeta(meta)}`);
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[WARN] ${message}${formatMeta(meta)}`);
  },
  error: (message: string, meta?: Record<string, any>) => {
    console.error(`[ERROR] ${message}${formatMeta(meta)}`);
  },
};

// Helper functions
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
