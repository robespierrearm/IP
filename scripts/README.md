# 🛠️ Utility Scripts

Набор утилит для управления пользователями в TenderCRM.

## 📋 Доступные скрипты

### 1. **check-user.ts** - Проверка пользователей

Показывает всех пользователей в базе с детальной информацией.

```bash
npx tsx scripts/check-user.ts
```

**Что показывает:**
- ✅ Список всех пользователей
- 🔒 Тип пароля (bcrypt или plain text)
- ✅/❌ Статус активации
- ⚠️ Предупреждения о проблемах

**Если пользователей нет:**
- Автоматически создаёт тестового пользователя
- Email: `admin@example.com`
- Пароль: `admin123`

---

### 2. **activate-user.ts** - Активация пользователя

Активирует неактивного пользователя.

```bash
npx tsx scripts/activate-user.ts <email>
```

**Пример:**
```bash
npx tsx scripts/activate-user.ts user@example.com
```

---

### 3. **reset-password.ts** - Сброс пароля

Меняет пароль пользователя и автоматически его активирует.

```bash
npx tsx scripts/reset-password.ts <email> <новый-пароль>
```

**Пример:**
```bash
npx tsx scripts/reset-password.ts user@example.com newpassword123
```

**Требования:**
- Минимум 6 символов
- Автоматически хешируется через bcrypt

---

## 🚀 Быстрый старт

### Проблема: Не могу войти

**Шаг 1:** Проверьте список пользователей
```bash
npx tsx scripts/check-user.ts
```

**Шаг 2:** Если ваш пользователь неактивен:
```bash
npx tsx scripts/activate-user.ts your@email.com
```

**Шаг 3:** Если забыли пароль:
```bash
npx tsx scripts/reset-password.ts your@email.com newpassword
```

---

## 📝 Примеры использования

### Создать нового админа
```bash
# 1. Проверить существующих
npx tsx scripts/check-user.ts

# 2. Если нет пользователей - скрипт создаст тестового
# Или создайте вручную в Supabase Dashboard

# 3. Сбросьте пароль на нужный
npx tsx scripts/reset-password.ts admin@example.com mypassword123
```

### Активировать всех неактивных
```bash
# Сначала смотрим список
npx tsx scripts/check-user.ts

# Активируем каждого
npx tsx scripts/activate-user.ts user1@example.com
npx tsx scripts/activate-user.ts user2@example.com
```

---

## ⚠️ Важные замечания

### Безопасность паролей

**Правильно:**
```bash
# Пароль автоматически хешируется
npx tsx scripts/reset-password.ts user@example.com password123
```

**Неправильно:**
```sql
-- НЕ вставляйте пароли напрямую в базу!
INSERT INTO users (email, password) VALUES ('user@example.com', 'plaintext');
```

### is_active флаг

- `true` - пользователь может войти ✅
- `false` - вход заблокирован ❌

API login проверяет: `.eq('is_active', true)`

---

## 🔍 Troubleshooting

### "User not found"
```bash
# Проверьте точный email
npx tsx scripts/check-user.ts

# Email регистронезависим, но проверьте опечатки
```

### "Error connecting to database"
```bash
# Проверьте .env.local:
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Убедитесь что Supabase проект активен
```

### "Permission denied"
```bash
# Проверьте Row Level Security в Supabase
# Должны быть политики для anon key
```

---

## 📊 Вывод check-user.ts

```
🔍 ПРОВЕРКА ПОЛЬЗОВАТЕЛЕЙ В БАЗЕ

============================================================

✅ Найдено пользователей: 2

1. admin@example.com
   Username: Admin
   Пароль: 🔒 bcrypt
   Активен: ✅
   ID: 1

2. user@example.com
   Username: User
   Пароль: ⚠️  plain text
   Активен: ❌
   ID: 2
   ⚠️  ВНИМАНИЕ: Пароль НЕ захеширован!
   Текущий пароль: "test123"

============================================================

💡 РЕКОМЕНДАЦИИ:

⚠️  У некоторых пользователей НЕ захеширован пароль!
   При первом входе пароль автоматически захешируется.

📝 Для входа используйте:
   Email: user@example.com
   Пароль: test123

⚠️  НЕАКТИВНЫЕ ПОЛЬЗОВАТЕЛИ:
   - user@example.com (ID: 2)
   Для активации выполните:
   npx tsx scripts/activate-user.ts user@example.com
```

---

## 🎯 Use Cases

### 1. Первая настройка проекта
```bash
npx tsx scripts/check-user.ts
# Если пользователей нет - создастся admin@example.com / admin123
```

### 2. Пользователь забыл пароль
```bash
npx tsx scripts/reset-password.ts user@example.com newpass123
```

### 3. Пользователь деактивирован
```bash
npx tsx scripts/activate-user.ts user@example.com
```

### 4. Проверка перед деплоем
```bash
npx tsx scripts/check-user.ts
# Убедитесь что все пароли хешированы
# Убедитесь что админ активен
```

---

**Created:** 2025-10-26  
**Status:** Production Ready ✅
