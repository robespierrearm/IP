# 🏗️ АРХИТЕКТУРНЫЙ ОБЗОР ПРОЕКТА IP

**Дата:** 23 октября 2025

---

## 📐 ТЕКУЩАЯ АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐              ┌──────────────┐            │
│  │   Desktop    │              │   Mobile     │            │
│  │   Version    │              │   Version    │            │
│  │              │              │   (PWA)      │            │
│  │ /dashboard   │              │ /m/dashboard │            │
│  │ /tenders     │              │ /m/tenders   │            │
│  │ /suppliers   │              │ /m/suppliers │            │
│  │ /accounting  │              │ /m/accounting│            │
│  └──────────────┘              └──────────────┘            │
│         │                              │                    │
│         └──────────────┬───────────────┘                    │
│                        │                                    │
│                        ▼                                    │
│              ┌──────────────────┐                          │
│              │   React Query    │                          │
│              │   (Caching)      │                          │
│              └──────────────────┘                          │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE                               │
├─────────────────────────────────────────────────────────────┤
│  • JWT Authentication                                        │
│  • Mobile Detection & Redirect                              │
│  • Route Protection                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /api/tenders        /api/suppliers      /api/expenses      │
│  /api/files          /api/dashboard      /api/auth          │
│  /api/telegram       /api/ai-chat                           │
│                                                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  PostgreSQL  │    │   Storage    │    │     Auth     │ │
│  │              │    │              │    │              │ │
│  │  • tenders   │    │  • files     │    │  • users     │ │
│  │  • suppliers │    │  • images    │    │  • sessions  │ │
│  │  • expenses  │    │  • documents │    │  • RLS       │ │
│  │  • files     │    │              │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Telegram    │    │  Google AI   │    │   Vercel     │ │
│  │     Bot      │    │   (Gemini)   │    │  Analytics   │ │
│  │              │    │              │    │              │ │
│  │  • Webhook   │    │  • Chat      │    │  • Metrics   │ │
│  │  • OCR       │    │  • OCR       │    │  • Logs      │ │
│  │  • Notify    │    │  • Analysis  │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW

### 1. Создание тендера (Desktop):

```
User Input
    ↓
AddTenderDialog (Component)
    ↓
apiClient.createTender()
    ↓
POST /api/tenders
    ↓
Supabase INSERT
    ↓
React Query Invalidation
    ↓
UI Update
```

### 2. Offline-режим (Mobile):

```
User Action (Offline)
    ↓
offlineSupabase.insert()
    ↓
IndexedDB Storage
    ↓
Sync Queue
    ↓
[Online] Auto Sync
    ↓
POST /api/tenders
    ↓
Supabase INSERT
    ↓
IndexedDB Update
```

### 3. AI Assistant:

```
User Message
    ↓
POST /api/ai-chat
    ↓
Google Gemini AI
    ↓
Parse Action (ADD_TENDER, etc.)
    ↓
Execute Function
    ↓
Supabase Operation
    ↓
Response to User
```

---

## 📦 КОМПОНЕНТЫ СИСТЕМЫ

### Frontend (Next.js 15):

**Pages:**
- `/app/(dashboard)/*` - Desktop версия
- `/app/m/*` - Mobile версия (PWA)
- `/app/api/*` - API Routes

**Components:**
- `components/` - Переиспользуемые компоненты
- `components/mobile/` - Мобильные компоненты
- `components/ui/` - UI библиотека (Radix UI)

**Hooks:**
- `useTenders()` - React Query для тендеров
- `useSuppliers()` - React Query для поставщиков
- `useApiQuery()` - Общий хук для API
- `useAutoClose()` - Автозакрытие карточек

**Libraries:**
- `lib/supabase.ts` - Supabase client
- `lib/api-client.ts` - API wrapper
- `lib/offline-supabase.ts` - Offline support
- `lib/ai-client.ts` - AI integration

### Backend (Supabase):

**Database:**
- PostgreSQL 15
- Row Level Security (RLS)
- Real-time subscriptions

**Storage:**
- File uploads
- Image optimization
- CDN delivery

**Auth:**
- JWT tokens
- httpOnly cookies
- Session management

### External:

**Telegram Bot:**
- Webhook: `/api/telegram/webhook`
- Commands: /start, /dashboard, /tenders, /ai
- OCR для чеков

**AI:**
- Google Gemini (primary)
- Intelligence.io (fallback)
- Function calling

---

## 🔐 БЕЗОПАСНОСТЬ

### Текущая реализация:

```
┌─────────────────────────────────────┐
│         Security Layers              │
├─────────────────────────────────────┤
│                                      │
│  1. Middleware (JWT Validation)     │
│     ↓                                │
│  2. API Routes (Auth Check)         │
│     ↓                                │
│  3. Supabase RLS (Row Level)        │
│     ↓                                │
│  4. Database Constraints            │
│                                      │
└─────────────────────────────────────┘
```

**Что есть:**
- ✅ JWT в httpOnly cookies
- ✅ Row Level Security (RLS)
- ✅ Middleware защита роутов
- ✅ HTTPS everywhere

**Что нужно добавить:**
- ❌ Rate limiting
- ❌ CSRF protection
- ❌ File validation
- ❌ Input sanitization

---

## 📊 ПРОИЗВОДИТЕЛЬНОСТЬ

### Текущие метрики:

**Frontend:**
- Bundle Size: 539 KB (vendor)
- First Load: ~2-3s
- Lighthouse: 70/100
- FPS: 45-60

**Backend:**
- API Response: 200-500ms
- Database Queries: 50-200ms
- Cache Hit Rate: 0% (нет кэша)

**Целевые метрики:**

**Frontend:**
- Bundle Size: <400 KB
- First Load: <1.5s
- Lighthouse: 90+/100
- FPS: 60 (stable)

**Backend:**
- API Response: <100ms
- Database Queries: <50ms
- Cache Hit Rate: 80%+

---

## 🎯 УЗКИЕ МЕСТА

### 1. Frontend Performance:

```
Problem: Bundle 539KB
├─ Framer Motion: 200KB
├─ Supabase: 150KB
├─ React Query: 50KB
└─ Other: 139KB

Solution:
├─ LazyMotion: -50KB
├─ Code Splitting: -100KB
└─ Tree Shaking: -50KB
```

### 2. Database Queries:

```
Problem: N+1 Queries
├─ Load tenders: 1 query
├─ For each tender:
│   ├─ Load expenses: N queries
│   └─ Load files: N queries
└─ Total: 1 + 2N queries

Solution:
├─ Use JOIN: 1 query
└─ Or: Batch loading
```

### 3. No Caching:

```
Problem: Every request → Database
├─ /api/tenders: 200ms
├─ /api/suppliers: 150ms
└─ /api/expenses: 300ms

Solution: Redis Cache
├─ First request: 200ms → Cache
├─ Next requests: 5ms (from cache)
└─ Invalidate on changes
```

---

## 🔄 РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### Добавить слои:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (No changes - already good)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    🆕 REDIS CACHE                            │
│  • 5 min TTL for lists                                       │
│  • Invalidate on mutations                                   │
│  • 80%+ cache hit rate                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES                                │
│  🆕 + Rate Limiting (100 req/min)                           │
│  🆕 + Input Validation (Zod)                                │
│  🆕 + Error Tracking (Sentry)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                 │
│  🆕 + Indexes for common queries                            │
│  🆕 + Connection pooling                                    │
│  🆕 + Query optimization                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 МАСШТАБИРОВАНИЕ

### Текущая нагрузка:
- Users: ~10-50
- Requests: ~1000/day
- Database: <1GB

### Готовность к росту:

**100 users:**
- ✅ Frontend: OK
- ✅ Backend: OK
- ✅ Database: OK

**1000 users:**
- 🟡 Frontend: Нужна оптимизация
- 🟡 Backend: Нужен Redis
- ✅ Database: OK

**10000 users:**
- 🔴 Frontend: CDN + оптимизация
- 🔴 Backend: Redis + load balancer
- 🟡 Database: Read replicas

---

## 🛠️ ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Frontend:
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI
- **State:** React Query (TanStack)
- **Forms:** React Hook Form
- **Animations:** Framer Motion
- **Icons:** Lucide React

### Backend:
- **Runtime:** Node.js 20
- **Database:** PostgreSQL 15 (Supabase)
- **Auth:** Supabase Auth (JWT)
- **Storage:** Supabase Storage
- **API:** Next.js API Routes

### DevOps:
- **Hosting:** Vercel
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network
- **Analytics:** Vercel Analytics
- **Monitoring:** 🔴 Нужен Sentry

### External:
- **AI:** Google Gemini 2.0
- **Bot:** Telegram Bot API
- **OCR:** Google Vision API

---

## ✅ ВЫВОДЫ

### Сильные стороны архитектуры:
1. ✅ Современный стек
2. ✅ Хорошее разделение desktop/mobile
3. ✅ PWA с offline-режимом
4. ✅ Масштабируемая база (Supabase)
5. ✅ Безопасность (JWT, RLS)

### Что нужно улучшить:
1. 🔴 Добавить кэширование (Redis)
2. 🔴 Оптимизировать frontend (bundle, виртуализация)
3. 🔴 Добавить мониторинг (Sentry)
4. 🟡 Оптимизировать БД (индексы)
5. 🟡 Rate limiting и валидация

### Готовность к production:
- **MVP:** ✅ Готов
- **Small Scale (100 users):** ✅ Готов
- **Medium Scale (1000 users):** 🟡 Нужна оптимизация
- **Large Scale (10000+ users):** 🔴 Требуется масштабирование

---

**Архитектура проекта хорошо спроектирована и готова к масштабированию с минимальными изменениями.**
