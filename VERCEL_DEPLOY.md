# 🚀 Деплой на Vercel

## ✅ Что изменено для Vercel:

1. **Убран статический экспорт** - Vercel поддерживает серверные функции
2. **Убран basePath** - будет свой домен
3. **Созданы безопасные API роуты** - ключи AI на сервере
4. **AI работает через `/api/ai-chat`** - безопасно и быстро

---

## 📋 Инструкция по деплою:

### Шаг 1: Подключите GitHub репозиторий

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите **"Add New Project"**
3. Выберите **"Import Git Repository"**
4. Найдите репозиторий **`robespierrearm/IP`**
5. Нажмите **"Import"**

### Шаг 2: Настройте проект

1. **Framework Preset:** Next.js (автоматически определится)
2. **Root Directory:** `.` (оставить по умолчанию)
3. **Build Command:** `npm run build` (автоматически)
4. **Output Directory:** `.next` (автоматически)

### Шаг 3: Добавьте переменные окружения

Нажмите **"Environment Variables"** и добавьте:

#### Supabase (обязательно):
```
NEXT_PUBLIC_SUPABASE_URL = https://dauikktsjknklmyonjik.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdWlra3Rzamtua2xteW9uamlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTU2MjYsImV4cCI6MjA3NjEzMTYyNn0.k8JaOJPPbzRPeGGOcPzM17GiAxB93F4yTx-f5iAUXAU
```

#### AI Keys (обязательно для AI помощника):
```
INTELLIGENCE_API_KEY = io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjNmMzg4Yzc0LWYzZjItNDI0ZC04MmExLTFlNzhhMzUxY2NjNiIsImV4cCI6NDkxNDQxMTI2MH0.TDGo9AQD2jWlIj56dy8Vk0_EMq7jQX6bcTWgsfyZLmr-vTyv2ygvOIb03CNJWtAE6jecQyNPB2YMvRap9fqs-A

GOOGLE_AI_KEY = AIzaSyB4q--whZbW0GpezMXfJncEQibZayhRbaA
```

**Важно:** Для каждой переменной выберите **"All Environments"** (Production, Preview, Development)

### Шаг 4: Деплой!

1. Нажмите **"Deploy"**
2. Подождите 2-3 минуты
3. Готово! ✅

---

## 🎯 После деплоя:

### Ваш сайт будет доступен по адресу:
```
https://ваш-проект.vercel.app
```

### Проверьте:
1. ✅ Авторизация работает
2. ✅ AI помощник отвечает
3. ✅ Все данные из Supabase загружаются

---

## 🔒 Безопасность:

- ✅ AI ключи хранятся на сервере Vercel
- ✅ Никто не может их украсть из кода
- ✅ Все запросы к AI идут через ваш сервер

---

## 🔄 Автоматический деплой:

Теперь при каждом `git push` в репозиторий `IP`:
- Vercel автоматически пересоберёт проект
- Обновит сайт
- Уведомит вас о статусе

---

## 📱 Настройка домена (опционально):

1. В Vercel Dashboard → Settings → Domains
2. Добавьте свой домен
3. Следуйте инструкциям Vercel

---

## ⚠️ Важно:

- **GitHub Pages (`new`)** - продолжает работать как раньше
- **Vercel (`IP`)** - новая тестовая версия с безопасным AI
- Оба работают независимо!

---

## 🆘 Проблемы?

- **Ошибка сборки:** Проверьте что все переменные окружения добавлены
- **AI не работает:** Проверьте ключи `INTELLIGENCE_API_KEY` и `GOOGLE_AI_KEY`
- **База данных не работает:** Проверьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
