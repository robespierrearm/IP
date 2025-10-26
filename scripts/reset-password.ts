/**
 * Скрипт для сброса пароля пользователя
 * 
 * Использование:
 * npx tsx scripts/reset-password.ts <email> <новый-пароль>
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Загружаем переменные из .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Ошибка: Переменные окружения не найдены!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetPassword(email: string, newPassword: string) {
  console.log('\n🔐 СБРОС ПАРОЛЯ\n');
  console.log('='.repeat(60));

  try {
    // Ищем пользователя
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.toLowerCase().trim())
      .single();

    if (findError || !user) {
      console.error(`❌ Пользователь с email "${email}" не найден!`);
      return;
    }

    console.log(`\n✅ Найден пользователь:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   ID: ${user.id}\n`);

    // Хешируем новый пароль
    console.log('🔒 Хеширую пароль...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        is_active: true // Заодно активируем, если был неактивен
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Ошибка при обновлении пароля:', updateError.message);
      return;
    }

    console.log('\n✅ Пароль успешно изменён!\n');
    console.log('📝 Новые данные для входа:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Пароль: ${newPassword}`);
    console.log(`   Username: ${user.username}\n`);

  } catch (err) {
    console.error('❌ Ошибка:', err instanceof Error ? err.message : err);
  }
}

// Получаем аргументы из командной строки
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('\n❌ Ошибка: Укажите email и новый пароль!\n');
  console.log('Использование: npx tsx scripts/reset-password.ts <email> <новый-пароль>\n');
  console.log('Пример: npx tsx scripts/reset-password.ts user@example.com newpassword123\n');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('\n❌ Ошибка: Пароль должен быть минимум 6 символов!\n');
  process.exit(1);
}

resetPassword(email, newPassword);
