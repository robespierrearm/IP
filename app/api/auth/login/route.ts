import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logAuth, logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Токен живёт 7 дней

export async function POST(request: NextRequest) {
  try {
    logger.debug('Login API called');
    
    // Проверяем что Supabase доступен (диагностика для production)
    try {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!hasUrl || !hasKey) {
        logger.error('Supabase credentials missing', { hasUrl, hasKey, env: process.env.NODE_ENV });
        return NextResponse.json(
          { 
            error: 'Ошибка конфигурации сервера',
            details: process.env.NODE_ENV === 'development' 
              ? `Missing: ${!hasUrl ? 'SUPABASE_URL' : ''} ${!hasKey ? 'SUPABASE_ANON_KEY' : ''}`
              : undefined
          },
          { status: 500 }
        );
      }
    } catch (configError) {
      logger.error('Configuration check failed', { error: configError });
      return NextResponse.json(
        { error: 'Ошибка конфигурации сервера' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    logger.debug('Request body parsed', { hasEmail: !!body.email, hasPassword: !!body.password });
    
    const { email, password } = body;

    if (!email || !password) {
      logger.warn('Login failed: missing credentials');
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Приводим email к нижнему регистру для поиска
    const normalizedEmail = email.toLowerCase().trim();
    logger.debug('Normalized email', { normalizedEmail });

    logAuth.login(normalizedEmail, false); // Will update to true if successful

    // 1. Находим пользователя (регистронезависимый поиск)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      logger.warn('Login failed: user not found', { email: normalizedEmail, error: error?.message });
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    logger.debug('User found', { email: user.email, userId: user.id });

    // 2. Проверяем пароль
    // Проверяем, захеширован ли пароль в базе
    const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    
    logger.debug('Password hash check', { isBcryptHash, userId: user.id });
    
    let isValidPassword = false;
    if (isBcryptHash) {
      // Пароль захеширован - используем bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
      logger.debug('Password verification (bcrypt)', { userId: user.id, valid: isValidPassword });
    } else {
      // Пароль не захеширован - прямое сравнение (для обратной совместимости)
      isValidPassword = password === user.password;
      logger.warn('Password verification (plain text - legacy)', { userId: user.id, valid: isValidPassword });
      
      // Автоматически хешируем пароль при успешном входе
      if (isValidPassword) {
        logger.info('Auto-hashing plain text password', { userId: user.id });
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id);
        logger.info('Password hashed successfully', { userId: user.id });
      }
    }
    
    if (!isValidPassword) {
      logger.warn('Login failed: invalid password', { email: normalizedEmail, userId: user.id });
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    logAuth.login(user.email, true); // Success!

    // 3. Создаём JWT токен
    logger.debug('Creating JWT token', { userId: user.id });
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    logger.debug('JWT token created');

    // 4. Обновляем статус пользователя
    logger.debug('Updating user status', { userId: user.id });
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_online: true,
        last_activity: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (updateError) {
      logger.warn('Failed to update user status (non-critical)', { error: updateError.message, userId: user.id });
      // Не блокируем вход, если не удалось обновить статус
    } else {
      logger.debug('User status updated', { userId: user.id });
    }

    // 5. Устанавливаем httpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,      // Недоступен из JavaScript (защита от XSS)
      secure: process.env.NODE_ENV === 'production', // HTTPS only в production
      sameSite: 'lax',     // Защита от CSRF
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    logger.info('Login successful', { userId: user.id, email: user.email, username: user.username });
    return response;
  } catch (error) {
    logger.error('Login API error', { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(
      { error: 'Ошибка сервера при входе' },
      { status: 500 }
    );
  }
}
