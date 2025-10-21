import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkChatHistory() {
  console.log('🔍 Проверка таблицы chat_history...\n');

  // Проверяем существование таблицы
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Таблица chat_history НЕ СУЩЕСТВУЕТ!');
    console.error('Ошибка:', error.message);
    console.log('\n📝 Нужно выполнить миграцию:');
    console.log('1. Открой Supabase Dashboard');
    console.log('2. Перейди в SQL Editor');
    console.log('3. Скопируй содержимое файла: supabase/migrations/20251020_chat_history.sql');
    console.log('4. Выполни SQL запрос');
    return;
  }

  console.log('✅ Таблица chat_history существует!');
  
  // Проверяем количество записей
  const { count } = await supabase
    .from('chat_history')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Записей в истории: ${count || 0}`);

  // Показываем последние 5 сообщений
  const { data: recent } = await supabase
    .from('chat_history')
    .select('telegram_id, role, content, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recent && recent.length > 0) {
    console.log('\n📝 Последние сообщения:');
    recent.forEach((msg, i) => {
      console.log(`\n${i + 1}. [${msg.role}] ${msg.telegram_id}`);
      console.log(`   ${msg.content.substring(0, 100)}...`);
      console.log(`   ${new Date(msg.created_at).toLocaleString('ru-RU')}`);
    });
  } else {
    console.log('\n📭 История пуста');
  }
}

checkChatHistory().catch(console.error);
