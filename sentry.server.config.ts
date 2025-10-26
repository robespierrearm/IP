import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

// ТОЛЬКО инициализируем если DSN настроен
if (dsn && isProduction) {
  console.log('[Sentry Init] Initializing...', {
    dsn: dsn.substring(0, 30) + '...',
    env: process.env.NODE_ENV,
  });
  
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV,
    enabled: true,
  });
  
  console.log('[Sentry Init] ✅ Initialized successfully');
} else {
  if (!dsn) {
    console.warn('[Sentry Init] ⚠️  Skipped: NEXT_PUBLIC_SENTRY_DSN not configured');
  } else {
    console.log('[Sentry Init] Skipped: not production environment');
  }
}
