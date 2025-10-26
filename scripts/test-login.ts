/**
 * Скрипт для тестирования API login
 */

async function testLogin(email: string, password: string) {
  console.log('\n🔐 ТЕСТИРОВАНИЕ API LOGIN\n');
  console.log('='.repeat(60));
  console.log(`\nEmail: ${email}`);
  console.log(`Password: ${password}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ ВХОД УСПЕШЕН!');
      console.log(`\nПользователь: ${data.user.username}`);
      console.log(`Email: ${data.user.email}`);
      console.log(`ID: ${data.user.id}`);
    } else {
      console.log('\n❌ ОШИБКА ВХОДА!');
      console.log(`\nСообщение: ${data.error}`);
    }

  } catch (err) {
    console.error('\n❌ Ошибка запроса:', err instanceof Error ? err.message : err);
    console.error('\nУбедитесь что dev server запущен (npm run dev)');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Получаем аргументы
const email = process.argv[2] || 'Armen@gmail.com';
const password = process.argv[3] || 'test123';

testLogin(email, password);
