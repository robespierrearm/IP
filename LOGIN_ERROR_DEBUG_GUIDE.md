# 🔍 LOGIN ERROR DEBUGGING GUIDE
**Дата:** 2025-10-26  
**Проблема:** "Произошла ошибка при входе"

---

## 📋 ЧТО БЫЛО СДЕЛАНО

### **1. Улучшена обработка ошибок в формах логина**

#### **Desktop Login** (`/app/login/page.tsx`):
```typescript
// ДО:
catch (err) {
  setError('Произошла ошибка при входе'); // Без деталей!
}

// ПОСЛЕ:
catch (err) {
  console.error('Login error:', err); // Логируем в консоль
  const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка при входе';
  setError(errorMessage); // Показываем реальную ошибку
  setIsLoading(false); // Правильно сбрасываем состояние
}
```

#### **Mobile Login** (`/app/m/login/page.tsx`):
- ✅ Те же улучшения применены к мобильной версии

---

### **2. Добавлено детальное логирование в API**

#### **Login API** (`/app/api/auth/login/route.ts`):

**Новые точки логирования:**

```typescript
// 1. Начало запроса
logger.debug('Login API called');

// 2. Парсинг body
logger.debug('Request body parsed', { hasEmail, hasPassword });

// 3. Нормализация email
logger.debug('Normalized email', { normalizedEmail });

// 4. Поиск пользователя
logger.debug('User found', { email, userId });

// 5. Проверка пароля
logger.debug('Password hash check', { isBcryptHash, userId });
logger.debug('Password verification (bcrypt)', { userId, valid });

// 6. Создание JWT
logger.debug('Creating JWT token', { userId });
logger.debug('JWT token created');

// 7. Обновление статуса
logger.debug('Updating user status', { userId });
logger.debug('User status updated', { userId });

// 8. Успешный вход
logger.info('Login successful', { userId, email, username });
```

---

## 🔬 КАК ОТЛАДИТЬ ОШИБКУ

### **STEP 1: Проверьте консоль браузера**

1. Откройте DevTools (F12)
2. Перейдите на вкладку **Console**
3. Попробуйте войти
4. Смотрите на ошибки:

```javascript
// Пример ошибки:
Login error: TypeError: Failed to fetch
// ➜ Проблема с сетью или API недоступен

Login error: SyntaxError: Unexpected token
// ➜ API вернул не JSON (возможно, HTML ошибка)

Login error: Неверный email или пароль
// ➜ Неправильные учётные данные
```

---

### **STEP 2: Проверьте Network Tab**

1. DevTools → **Network** tab
2. Попробуйте войти
3. Найдите запрос `/api/auth/login`
4. Проверьте:

#### **Request:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### **Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

#### **Response (Error):**
```json
{
  "error": "Неверный email или пароль"
}
```

---

### **STEP 3: Проверьте логи сервера**

#### **Development (локально):**

В терминале где запущен `npm run dev`:

```bash
# Успешный вход:
[21:30:45] [debug]: Login API called
[21:30:45] [debug]: Request body parsed { hasEmail: true, hasPassword: true }
[21:30:45] [debug]: Normalized email { normalizedEmail: 'test@example.com' }
[21:30:45] [debug]: User found { email: 'test@example.com', userId: 1 }
[21:30:45] [debug]: Password hash check { isBcryptHash: true, userId: 1 }
[21:30:45] [debug]: Password verification (bcrypt) { userId: 1, valid: true }
[21:30:45] [info]: Auth: Login success { email: 'test@example.com' }
[21:30:45] [debug]: Creating JWT token { userId: 1 }
[21:30:45] [debug]: JWT token created
[21:30:45] [debug]: Updating user status { userId: 1 }
[21:30:45] [debug]: User status updated { userId: 1 }
[21:30:45] [info]: Login successful { userId: 1, email: 'test@example.com', username: 'testuser' }
```

#### **Production (Vercel):**

```bash
# Смотрите логи в Vercel Dashboard:
vercel logs https://your-app.vercel.app

# Или через CLI:
vercel logs
```

---

## 🐛 ТИПИЧНЫЕ ОШИБКИ И РЕШЕНИЯ

### **Error 1: "Failed to fetch"**

**Причина:** API недоступен или неправильный URL

**Решение:**
```bash
# 1. Проверьте что dev server запущен
npm run dev

# 2. Проверьте URL в браузере
http://localhost:3000

# 3. Проверьте что API доступен
curl http://localhost:3000/api/auth/login
```

---

### **Error 2: "Неверный email или пароль"**

**Причина:** Неправильные учётные данные или пользователь не найден

**Решение:**
```sql
-- Проверьте пользователя в Supabase:
SELECT id, email, username, is_active 
FROM users 
WHERE LOWER(email) = 'test@example.com';

-- Проверьте что is_active = true
```

---

### **Error 3: "Email и пароль обязательны"**

**Причина:** Форма отправляет пустые значения

**Решение:**
```typescript
// Проверьте в DevTools → Network → Request Payload:
{
  "email": "",      // ❌ Пустой!
  "password": ""    // ❌ Пустой!
}

// Должно быть:
{
  "email": "test@example.com",
  "password": "password123"
}
```

---

### **Error 4: "Ошибка сервера при входе"**

**Причина:** Внутренняя ошибка в API (database, JWT, etc.)

**Решение:**
```bash
# 1. Смотрите полные логи в терминале:
[error]: Login API error {
  error: 'connect ECONNREFUSED',
  stack: '...'
}

# 2. Проверьте Supabase connection:
# - NEXT_PUBLIC_SUPABASE_URL правильный?
# - NEXT_PUBLIC_SUPABASE_ANON_KEY правильный?

# 3. Проверьте JWT_SECRET:
# - Установлен в .env.local?
```

---

### **Error 5: Cookie не устанавливается**

**Причина:** Проблемы с CORS или secure cookies

**Решение:**
```typescript
// В production проверьте:
response.cookies.set('auth-token', token, {
  secure: true,  // ✅ HTTPS required
  sameSite: 'lax',
  httpOnly: true
});

// В development:
response.cookies.set('auth-token', token, {
  secure: false, // ✅ HTTP ok for localhost
  sameSite: 'lax',
  httpOnly: true
});
```

---

## 📊 CHECKLIST ДИАГНОСТИКИ

### **Базовые проверки:**
- [ ] Dev server запущен (`npm run dev`)
- [ ] Порт 3000 доступен
- [ ] Нет ошибок компиляции в терминале
- [ ] Браузер не блокирует cookies
- [ ] JavaScript включен в браузере

### **Environment проверки:**
- [ ] `.env.local` существует
- [ ] `NEXT_PUBLIC_SUPABASE_URL` установлен
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` установлен
- [ ] `JWT_SECRET` установлен
- [ ] Supabase проект активен

### **Database проверки:**
- [ ] Таблица `users` существует
- [ ] Колонка `is_active` существует
- [ ] Есть хотя бы один активный пользователь
- [ ] Email формат правильный (lowercase)

### **API проверки:**
- [ ] `/api/auth/login` доступен
- [ ] Возвращает JSON (не HTML)
- [ ] Status codes правильные (200/401/500)
- [ ] Cookies устанавливаются

---

## 🔧 БЫСТРЫЕ ФИКСЫ

### **Fix 1: Сбросить кеш браузера**
```bash
# Chrome/Edge:
Ctrl+Shift+Delete → Clear cookies and cache

# Firefox:
Ctrl+Shift+Delete → Cookies and Site Data
```

### **Fix 2: Проверить Supabase connection**
```bash
# В терминале dev server должно быть:
✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 500ms
# Никаких ошибок Supabase!
```

### **Fix 3: Создать тестового пользователя**
```sql
-- В Supabase SQL Editor:
INSERT INTO users (email, username, password, is_active)
VALUES (
  'test@example.com',
  'testuser',
  '$2a$10$...', -- bcrypt hash of 'password123'
  true
);
```

### **Fix 4: Пересобрать проект**
```bash
rm -rf .next
npm run dev
```

---

## 📝 LOG LEVELS

Winston logger использует следующие уровни:

| Level | Когда использовать | Production |
|-------|-------------------|------------|
| **debug** | Детальная информация для отладки | ❌ Off |
| **info** | Важные события (login, создание данных) | ✅ On |
| **warn** | Предупреждения (не блокирующие) | ✅ On |
| **error** | Ошибки (требуют внимания) | ✅ On |

```typescript
// Development: все уровни
logger.level = 'debug';

// Production: только info и выше
logger.level = 'info';
```

---

## 🎯 ЧТО ДЕЛАТЬ ДАЛЬШЕ

### **Если ошибка не решена:**

1. **Соберите информацию:**
   - Точное сообщение ошибки
   - Логи из консоли браузера
   - Логи из терминала dev server
   - Скриншот Network tab

2. **Проверьте базу:**
   ```sql
   -- Количество активных пользователей:
   SELECT COUNT(*) FROM users WHERE is_active = true;
   
   -- Ваш пользователь:
   SELECT * FROM users WHERE email = 'your@email.com';
   ```

3. **Проверьте environment:**
   ```bash
   # Выведите (без значений!) список переменных:
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   echo $JWT_SECRET
   ```

4. **Тестовый запрос напрямую:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

---

## ✅ ПРОВЕРКА УСПЕШНОГО ВХОДА

После успешного входа должно произойти:

1. ✅ **API возвращает 200 OK**
2. ✅ **Cookie `auth-token` установлена** (DevTools → Application → Cookies)
3. ✅ **localStorage содержит `currentUser`**
4. ✅ **Редирект на `/dashboard` или `/m/dashboard`**
5. ✅ **В логах:** `Login successful`

---

## 🚀 PRODUCTION TROUBLESHOOTING

### **Vercel Deployment:**

```bash
# 1. Проверьте Environment Variables в Vercel Dashboard:
# ✅ NEXT_PUBLIC_SUPABASE_URL
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
# ✅ JWT_SECRET

# 2. Проверьте Function Logs:
# Vercel Dashboard → Your Project → Functions → Logs

# 3. Проверьте Analytics:
# Смотрите на Failed Requests

# 4. Re-deploy:
git push origin main
# Или в Vercel Dashboard → Deployments → Redeploy
```

---

## 📞 SUPPORT

Если проблема не решена после всех проверок:

1. **Откройте issue** с:
   - Описанием проблемы
   - Логами (без sensitive data!)
   - Скриншотами
   - Environment info (Node version, OS, etc.)

2. **Временное решение:**
   - Используйте другой браузер
   - Очистите все cookies/cache
   - Попробуйте в режиме инкогнито
   - Проверьте на другом устройстве

---

**Debugging Guide Created:** 2025-10-26  
**Status:** Ready for troubleshooting  
**Logging:** Enhanced with detailed debug info ✅
