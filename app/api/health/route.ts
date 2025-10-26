import { NextResponse } from 'next/server';

/**
 * Health Check API
 * 
 * Использование:
 * GET /api/health
 * 
 * Показывает статус всех environment variables
 * и помогает диагностировать проблемы на production
 */
export async function GET() {
  const checks = {
    // Критические (без них не работает)
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    
    // Опциональные
    sentryDsn: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  };
  
  // Проверяем что все критические переменные настроены
  const allCriticalSet = checks.supabaseUrl && checks.supabaseKey && checks.jwtSecret;
  
  const health = {
    status: allCriticalSet ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks,
    warnings: [] as string[],
  };
  
  // Добавляем warnings
  if (!checks.supabaseUrl) health.warnings.push('NEXT_PUBLIC_SUPABASE_URL not set');
  if (!checks.supabaseKey) health.warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY not set');
  if (!checks.jwtSecret) health.warnings.push('JWT_SECRET not set');
  if (!checks.sentryDsn) health.warnings.push('NEXT_PUBLIC_SENTRY_DSN not set (optional)');
  
  // Возвращаем 503 если критические переменные не настроены
  const status = allCriticalSet ? 200 : 503;
  
  return NextResponse.json(health, { status });
}
