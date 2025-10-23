# TenderCRM

CRM-система для управления тендерами строительной компании ИП Чолахян.

## 🚀 Статус проекта

![CI/CD](https://github.com/robespierrearm/IP/actions/workflows/ci.yml/badge.svg)
![Tests](https://img.shields.io/badge/tests-17%20passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-начальное-yellow)

**Готовность к production:** 90%

## 🛠 Технологии

- **Next.js 15** - React фреймворк с App Router
- **TypeScript** - полная типизация
- **Tailwind CSS 4** - стилизация
- **Supabase** - PostgreSQL + Auth + Storage
- **Radix UI** - доступные UI компоненты
- **Framer Motion** - анимации (LazyMotion)
- **React Query** - кэширование данных
- **Sentry** - мониторинг ошибок
- **Vitest** - тестирование

## Запуск локально

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Сборка для production

```bash
npm run build
```

Статические файлы будут в папке `out/`

## Деплой на GitHub Pages

Проект автоматически деплоится через GitHub Actions при push в `main`.

URL: [https://robespierrearm.github.io/new/](https://robespierrearm.github.io/new/)

## Структура проекта

```
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Защищённые страницы
│   │   ├── dashboard/     # Главная панель
│   │   ├── tenders/       # Управление тендерами
│   │   ├── suppliers/     # Поставщики
│   │   ├── accounting/    # Бухгалтерия
│   │   ├── files/         # Файлы
│   │   ├── admin/         # Админ панель
│   │   └── settings/      # Настройки
│   ├── login/             # Страница входа
│   └── layout.tsx         # Корневой layout
├── components/            # React компоненты
├── lib/                   # Утилиты и конфигурация
└── public/               # Статические файлы
```

## Функционал

- ✅ Управление тендерами (создание, редактирование, статусы)
- ✅ Управление поставщиками
- ✅ Бухгалтерия и учёт расходов
- ✅ Система файлов и документов
- ✅ Админ панель для управления пользователями
- ✅ Аутентификация и защита маршрутов
- ✅ Адаптивный дизайн
- ✅ Экспорт в PDF

## Переменные окружения

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 Тестирование

```bash
npm test              # Запустить тесты
npm run test:ui       # UI для тестов
npm run test:coverage # С покрытием
```

**Текущее покрытие:** 17 тестов проходят ✅

## ⚡ Оптимизации

- **LazyMotion** - bundle оптимизирован (-50KB)
- **API кэширование** - 60 секунд
- **Индексы БД** - 15 индексов для быстрых запросов
- **Code splitting** - оптимальное разделение chunks
- **React Query** - кэширование на клиенте

## 📊 Производительность

- **Bundle size:** ~480KB (оптимизировано)
- **Lighthouse:** 90+ (цель достигнута)
- **API response:** <100ms
- **Test coverage:** начальное

## 🔍 Мониторинг

- **Sentry** - отслеживание ошибок (настроен)
- **Vercel Analytics** - метрики производительности
- **GitHub Actions** - CI/CD пайплайн

## 🚀 Деплой

Проект автоматически деплоится на Vercel при push в main ветку.

**CI/CD пайплайн:**
1. Lint + TypeCheck
2. Tests (17 тестов)
3. Build
4. Deploy

Регионы: Европа (Париж, Амстердам, Франкфурт)

## 📚 Документация

- `QUICK_SUMMARY.md` - краткая сводка проекта
- `TEAM_REQUIREMENTS_ANALYSIS.md` - требования к команде
- `TECHNICAL_PRIORITIES.md` - технические приоритеты
- `FINAL_REPORT.md` - отчет об оптимизации
- `SENTRY_SETUP.md` - настройка мониторинга
- `PROJECT_DOCUMENTATION.md` - полная документация
