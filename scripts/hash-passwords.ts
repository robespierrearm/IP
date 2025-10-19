/**
 * Скрипт для хеширования паролей в базе данных
 * Запустить один раз: npx tsx scripts/hash-passwords.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Загружаем переменные окружения
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Ошибка: NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY не найдены в .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashPasswords() {
  console.log('🔐 Начинаем хеширование паролей...\n');

  try {
    // 1. Получаем всех пользователей
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password');

    if (error) {
      console.error('❌ Ошибка получения пользователей:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  Пользователи не найдены');
      return;
    }

    console.log(`📊 Найдено пользователей: ${users.length}\n`);

    // 2. Хешируем пароли
    for (const user of users) {
      // Проверяем, не захеширован ли уже пароль
      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      
      if (isBcryptHash) {
        console.log(`✅ ${user.email} - пароль уже захеширован, пропускаем`);
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
        console.error(`❌ Ошибка обновления пароля для ${user.email}:`, updateError);
      } else {
        console.log(`✅ ${user.email} - пароль успешно захеширован`);
      }
    }

    console.log('\n🎉 Хеширование завершено!');
    console.log('💡 Теперь можно включить bcrypt в /api/auth/login/route.ts');
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

// Запускаем
hashPasswords();
