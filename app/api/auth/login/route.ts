import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Токен живёт 7 дней

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // 1. Находим пользователя
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 2. Проверяем пароль
    // Проверяем, захеширован ли пароль в базе
    const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    
    let isValidPassword = false;
    if (isBcryptHash) {
      // Пароль захеширован - используем bcrypt
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // Пароль не захеширован - прямое сравнение (для обратной совместимости)
      isValidPassword = password === user.password;
      
      // Автоматически хешируем пароль при успешном входе
      if (isValidPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id);
      }
    }
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 3. Создаём JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Обновляем статус пользователя
    await supabase
      .from('users')
      .update({
        is_online: true,
        last_activity: new Date().toISOString(),
      })
      .eq('id', user.id);

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

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при входе' },
      { status: 500 }
    );
  }
}
