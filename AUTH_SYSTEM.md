# 🔐 СИСТЕМА АВТОРИЗАЦИИ - ФИНАЛЬНАЯ ВЕРСИЯ

## 📋 АРХИТЕКТУРА

### 1. API Routes

#### `/api/auth/login` (POST)
- Принимает: `{ email, password }`
- Проверяет credentials через Supabase
- Создаёт JWT токен (7 дней)
- Устанавливает httpOnly cookie
- **Production**: `sameSite: 'none'` (для PWA на iOS)
- **Development**: `sameSite: 'lax'`
- Возвращает: `{ success: true, user: {...} }`

#### `/api/auth/logout` (POST)
- Удаляет cookie `auth-token`
- Обновляет статус `is_online: false` в БД
- ВСЕГДА успешный (даже при ошибках)

#### `/api/auth/me` (GET)
- Проверяет JWT токен из cookies
- Возвращает данные пользователя
- Используется AuthProvider для проверки сессии

---

### 2. AuthProvider Component

**Расположение**: `/components/AuthProvider.tsx`

**Функции**:
1. Проверяет авторизацию через `/api/auth/me`
2. Обновляет каждые 60 секунд
3. Слушает событие `auth-change`
4. Синхронизирует cookies ↔ localStorage
5. Редиректит неавторизованных на `/login`
6. Показывает loader при проверке

**Публичные пути** (без авторизации):
- `/login`
- `/test-env`
- `/clear-cache`

---

### 3. Middleware

**Расположение**: `/middleware.ts`

**Логика**:
1. Проверяет `auth-token` cookie
2. Определяет Mobile/Desktop (User-Agent)
3. Редиректит:
   - Нет токена → `/login`
   - Есть токен + Mobile → `/m/dashboard`
   - Есть токен + Desktop → `/dashboard`
4. Исключает API routes и статику

---

### 4. Login Page

**Расположение**: `/app/login/page.tsx`

**Процесс авторизации**:
\`\`\`typescript
1. Пользователь вводит email/password
2. Валидация на клиенте
3. POST /api/auth/login
4. Получение response
5. localStorage.setItem('currentUser', user)
6. dispatchEvent('auth-change')
7. router.push('/dashboard')
8. AuthProvider перехватывает → редирект на правильный dashboard
\`\`\`

**Обработка ошибок**:
- Пустой ответ
- Невалидный JSON
- HTTP ошибки (4xx, 5xx)
- Network ошибки

---

## 🔄 FLOW ДИАГРАММА

### Успешный Login:
\`\`\`
User → /login
  ↓
Ввод credentials
  ↓
POST /api/auth/login
  ↓
✅ 200 OK + Set-Cookie(auth-token)
  ↓
localStorage('currentUser')
  ↓
dispatch('auth-change')
  ↓
router.push('/dashboard')
  ↓
Middleware: token exists → next()
  ↓
AuthProvider: check /api/auth/me → OK
  ↓
✅ Dashboard
\`\`\`

### Logout:
\`\`\`
User клик "Выйти"
  ↓
POST /api/auth/logout
  ↓
Clear cookie (auth-token)
  ↓
localStorage.removeItem('currentUser')
  ↓
dispatch('auth-change')
  ↓
router.replace('/login')
  ↓
✅ Login Page
\`\`\`

### Сессия истекла:
\`\`\`
AuthProvider interval (60s)
  ↓
GET /api/auth/me
  ↓
❌ 401 Unauthorized
  ↓
localStorage.removeItem('currentUser')
  ↓
setIsAuthenticated(false)
  ↓
useEffect: не авторизован
  ↓
router.replace('/login')
  ↓
✅ Login Page (без белого экрана!)
\`\`\`

---

## ⚙️ КОНФИГУРАЦИЯ VERCEL

### Environment Variables:
\`\`\`
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
\`\`\`

### Важно для Vercel:
1. ✅ Winston НЕ используется (только console)
2. ✅ sameSite: 'none' для PWA
3. ✅ httpOnly cookies работают
4. ✅ Middleware не применяется к /api/*
5. ✅ Edge Runtime compatible

---

## 🐛 РЕШЁННЫЕ ПРОБЛЕМЫ

### 1. 405 Method Not Allowed
**Причина**: Winston logger падал на Vercel  
**Решение**: Заменён на console logger

### 2. Белый экран при истечении сессии
**Причина**: AuthProvider не проверял cookies  
**Решение**: Добавлена проверка через `/api/auth/me`

### 3. PWA не авторизуется на iOS
**Причина**: sameSite: 'lax' блокировал cookies  
**Решение**: sameSite: 'none' в production

### 4. Релогин в PWA
**Причина**: localStorage не синхронизировался с cookies  
**Решение**: Проверка через API каждые 60 секунд

---

## ✅ ЧЕКЛИСТ РАБОТОСПОСОБНОСТИ

### Desktop:
- [ ] Вход с правильными credentials
- [ ] Вход с неправильными credentials (ошибка)
- [ ] Редирект с /login на /dashboard при наличии токена
- [ ] Logout корректный (редирект на /login)
- [ ] Истечение сессии (редирект на /login)

### Mobile/PWA:
- [ ] Вход через /login на мобильном
- [ ] Редирект на /m/dashboard
- [ ] Logout через /m/menu или /m/settings
- [ ] Сессия сохраняется при перезапуске PWA
- [ ] Истечение сессии (редирект на /login)

### Vercel Deployment:
- [ ] POST /api/auth/login работает
- [ ] GET /api/auth/me работает
- [ ] POST /api/auth/logout работает
- [ ] Cookies устанавливаются (httpOnly)
- [ ] Нет ошибок в логах

---

## 🚀 DEPLOYMENT

\`\`\`bash
git add -A
git commit -m "fix: полная настройка системы авторизации"
git push origin main
\`\`\`

Vercel автоматически задеплоит через 2-3 минуты.

---

**Система авторизации полностью настроена для PWA + Vercel!**
