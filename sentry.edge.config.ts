import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Трассировка производительности
  tracesSampleRate: 1.0,
  
  // Окружение
  environment: process.env.NODE_ENV,
  
  // Включаем только в production
  enabled: process.env.NODE_ENV === 'production',
});
