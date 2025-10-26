/**
 * Скрипт для проверки и создания пользователя
 * 
 * Использование:
 * npx tsx scripts/check-user.ts
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
  console.error('\n❌ Ошибка: Не найдены переменные окружения!');
  console.error('Убедитесь что файл .env.local существует и содержит:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  is_active: boolean;
  is_online: boolean;
  last_activity: string;
  telegram_id: string | null;
  created_at: string;
  updated_at: string;
}

async function checkUser() {
  console.log('\n🔍 ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ В БАЗЕ\n');
  console.log('='.repeat(60));

  try {
    // Получаем всех пользователей
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('id');

    if (error) {
      console.error('❌ Ошибка при получении пользователей:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('\n⚠️  В базе НЕТ ПОЛЬЗОВАТЕЛЕЙ!\n');
      console.log('Давайте создадим тестового пользователя...\n');
      await createTestUser();
      return;
    }

    console.log(`\n✅ Найдено пользователей: ${users.length}\n`);

    // Показываем всех пользователей
    users.forEach((user: any, index: number) => {
      const isBcryptHash = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$');
      const passwordType = isBcryptHash ? '🔒 bcrypt' : '⚠️  plain text';
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Пароль: ${passwordType}`);
      console.log(`   Активен: ${user.is_active ? '✅' : '❌'}`);
      console.log(`   ID: ${user.id}`);
      
      if (!isBcryptHash) {
        console.log(`   ⚠️  ВНИМАНИЕ: Пароль НЕ захеширован!`);
        console.log(`   Текущий пароль: "${user.password}"`);
      }
      
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('\n💡 РЕКОМЕНДАЦИИ:\n');

    const usersWithPlainPassword = users.filter((u: any) => {
      const isBcrypt = u.password?.startsWith('$2a$') || u.password?.startsWith('$2b$');
      return !isBcrypt;
    });

    if (usersWithPlainPassword.length > 0) {
      console.log('⚠️  У некоторых пользователей НЕ захеширован пароль!');
      console.log('   При первом входе пароль автоматически захешируется.\n');
      
      console.log('📝 Для входа используйте:');
      usersWithPlainPassword.forEach((u: any) => {
        console.log(`   Email: ${u.email}`);
        console.log(`   Пароль: ${u.password}\n`);
      });
    }

    const inactiveUsers = users.filter((u: any) => !u.is_active);
    if (inactiveUsers.length > 0) {
      console.log('⚠️  НЕАКТИВНЫЕ ПОЛЬЗОВАТЕЛИ:');
      inactiveUsers.forEach((u: any) => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
      console.log('   Для активации выполните:');
      console.log('   npx tsx scripts/activate-user.ts <email>\n');
    }

  } catch (err) {
    console.error('❌ Ошибка:', err instanceof Error ? err.message : err);
  }
}

async function createTestUser() {
  console.log('Создаём тестового пользователя...\n');

  const testEmail = 'admin@example.com';
  const testPassword = 'admin123';
  const testUsername = 'Admin';

  try {
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: testEmail,
          username: testUsername,
          password: hashedPassword,
          is_active: true,
          is_online: false,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка при создании пользователя:', error.message);
      return;
    }

    console.log('✅ Тестовый пользователь создан!\n');
    console.log('📝 Данные для входа:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Пароль: ${testPassword}`);
    console.log(`   Username: ${testUsername}\n`);

  } catch (err) {
    console.error('❌ Ошибка:', err instanceof Error ? err.message : err);
  }
}

// Запускаем проверку
checkUser();
