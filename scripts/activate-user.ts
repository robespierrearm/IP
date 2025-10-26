/**
 * Скрипт для активации пользователя
 * 
 * Использование:
 * npx tsx scripts/activate-user.ts <email>
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Загружаем переменные из .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Ошибка: Переменные окружения не найдены!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function activateUser(email: string) {
  console.log('\n🔓 АКТИВАЦИЯ ПОЛЬЗОВАТЕЛЯ\n');
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
    console.log(`   Текущий статус: ${user.is_active ? '✅ Активен' : '❌ Неактивен'}\n`);

    if (user.is_active) {
      console.log('ℹ️  Пользователь уже активен! Ничего не делаем.\n');
      return;
    }

    // Активируем пользователя
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Ошибка при активации:', updateError.message);
      return;
    }

    console.log('✅ Пользователь успешно активирован!\n');
    console.log('Теперь можно входить в систему.\n');

  } catch (err) {
    console.error('❌ Ошибка:', err instanceof Error ? err.message : err);
  }
}

// Получаем email из аргументов командной строки
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Ошибка: Укажите email пользователя!\n');
  console.log('Использование: npx tsx scripts/activate-user.ts <email>\n');
  console.log('Пример: npx tsx scripts/activate-user.ts user@example.com\n');
  process.exit(1);
}

activateUser(email);
