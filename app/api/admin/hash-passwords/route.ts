import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

/**
 * API для хеширования паролей в базе данных
 * Вызвать один раз: GET /api/admin/hash-passwords
 */
export async function GET() {
  try {
    console.log('🔐 Начинаем хеширование паролей...');

    // 1. Получаем всех пользователей
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password');

    if (error) {
      console.error('❌ Ошибка получения пользователей:', error);
      return NextResponse.json(
        { error: 'Ошибка получения пользователей', details: error },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Пользователи не найдены' });
    }

    const results = [];

    // 2. Хешируем пароли
    for (const user of users) {
      // Проверяем, не захеширован ли уже пароль
      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      
      if (isBcryptHash) {
        results.push({ email: user.email, status: 'already_hashed' });
        continue;
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Обновляем в базе
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        results.push({ email: user.email, status: 'error', error: updateError });
      } else {
        results.push({ email: user.email, status: 'hashed' });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Хеширование завершено',
      results,
    });
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Критическая ошибка', details: error },
      { status: 500 }
    );
  }
}
