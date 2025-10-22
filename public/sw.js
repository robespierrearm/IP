/**
 * Service Worker для TenderCRM
 * Версия: v4-optimized
 * 
 * Стратегии кэширования:
 * - Навигация: Network First с fallback на кэш
 * - Статика (_next/static): Cache First с долгим TTL
 * - Изображения: Cache First с очисткой старых
 * - API: НЕ кэшируется (обрабатывает offlineSupabase)
 * 
 * Оптимизации:
 * - Предзагрузка критических ресурсов
 * - Умная очистка старых кэшей
 * - Graceful degradation при ошибках
 * - Поддержка офлайн-страницы
 */

const CACHE_VERSION = 'v4-optimized';
const CACHE_NAME = `tendercrm-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tendercrm-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `tendercrm-images-${CACHE_VERSION}`;

// Критические файлы для предзагрузки (минимум для работы офлайн)
const CRITICAL_CACHE = [
  '/',
  '/m/login',
  '/m/dashboard',
  '/manifest.json',
  '/offline.html', // Fallback страница
];

// Дополнительные страницы для кэширования (загружаются в фоне)
const EXTENDED_CACHE = [
  '/m/tenders',
  '/m/suppliers',
  '/m/accounting',
  '/m/settings',
];

// API эндпоинты для кэширования
const API_ROUTES = [
  '/api/tenders',
  '/api/suppliers',
  '/api/expenses',
];

// Время жизни кэша (в миллисекундах)
const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000, // 5 минут для API
  images: 7 * 24 * 60 * 60 * 1000, // 7 дней для изображений
  static: 30 * 24 * 60 * 60 * 1000, // 30 дней для статики
};

// === УСТАНОВКА SERVICE WORKER ===
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Установка v4-optimized...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Создаем только офлайн-страницу (не требует сети)
        await cache.put('/offline.html', new Response(
          createOfflinePage(),
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        ));
        
        console.log('✅ Service Worker установлен (страницы будут кэшироваться при первом посещении)');
        
      } catch (error) {
        console.error('❌ Ошибка установки SW:', error);
      }
    })()
  );
  
  // Активируем новый SW сразу
  self.skipWaiting();
});

// === АКТИВАЦИЯ SERVICE WORKER ===
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Активация v4-optimized');
  
  event.waitUntil(
    (async () => {
      try {
        // 1. Удаляем старые версии кэша
        const cacheNames = await caches.keys();
        const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE_NAME];
        
        await Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Удаляем старый кэш:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        // 2. Очищаем старые изображения (старше 7 дней)
        await cleanOldImages();
        
        console.log('✅ Активация завершена');
      } catch (error) {
        console.error('❌ Ошибка активации SW:', error);
      }
    })()
  );
  
  // Берем контроль над всеми клиентами
  self.clients.claim();
});

// === ПЕРЕХВАТ ЗАПРОСОВ ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем запросы к другим доменам
  if (url.origin !== location.origin) {
    return;
  }
  
  // Игнорируем Supabase (обрабатывает offlineSupabase через IndexedDB)
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Игнорируем API запросы (обрабатывает offlineSupabase)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Игнорируем WebSocket и EventSource
  if (request.mode === 'websocket' || request.destination === 'eventsource') {
    return;
  }

  // === СТРАТЕГИИ КЭШИРОВАНИЯ ===

  // 1. Изображения: Cache First с долгим TTL
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // 2. Навигация: Network First с fallback на кэш
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // 3. Next.js статика: Cache First (долгий TTL, immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleNextStaticRequest(request));
    return;
  }

  // 4. Next.js chunks и другие ресурсы: Stale While Revalidate
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(handleNextDynamicRequest(request));
    return;
  }

  // 5. Остальные статические файлы: Stale While Revalidate
  event.respondWith(handleStaticRequest(request));
});

// === Стратегии кэширования ===

// Network First для навигации (переходы между страницами)
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    
    // Кэшируем успешный ответ
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Офлайн - пытаемся вернуть из кэша
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 Возвращаем страницу из кэша:', request.url);
      return cached;
    }
    
    // Нет в кэше - возвращаем главную страницу
    const fallback = await caches.match('/m/dashboard');
    if (fallback) {
      return fallback;
    }
    
    // Совсем ничего нет - показываем офлайн страницу
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Офлайн режим</title>
          <style>
            body { 
              font-family: system-ui; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
              padding: 20px;
            }
            .container { max-width: 400px; }
            h1 { font-size: 3em; margin: 0 0 20px; }
            p { font-size: 1.2em; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔴</h1>
            <h2>Офлайн режим</h2>
            <p>Нет подключения к интернету. Пожалуйста, проверьте соединение и попробуйте снова.</p>
          </div>
        </body>
      </html>`,
      { 
        status: 503,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// Network First для API (свежие данные приоритет)
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Кэшируем успешные GET запросы
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Офлайн - возвращаем из кэша
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 Возвращаем API из кэша:', request.url);
      return cached;
    }
    
    // Нет кэша - возвращаем ошибку
    return new Response(
      JSON.stringify({ error: 'Офлайн режим', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Network First для Next.js статических ресурсов (с fallback на кэш без версии)
async function handleNextStaticRequest(request) {
  // Убираем параметры версии из URL для стабильного кэша
  const url = new URL(request.url);
  url.searchParams.delete('v');
  const cleanUrl = url.toString();
  const cleanRequest = new Request(cleanUrl, {
    method: request.method,
    headers: request.headers,
  });

  try {
    // Пытаемся загрузить с сервера
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(cleanRequest, response.clone());
      return response;
    }
  } catch (error) {
    // Офлайн - ищем в кэше
  }

  // Fallback на кэш (с версией или без)
  const cached = await caches.match(cleanRequest) || await caches.match(request);
  if (cached) {
    return cached;
  }

  // Совсем нет - 404
  return new Response('Not found', { status: 404 });
}

// Cache First для изображений
async function handleImageRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(IMAGE_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Возвращаем placeholder если нет изображения
    return new Response('', { status: 404 });
  }
}

// Stale While Revalidate для Next.js динамических ресурсов
async function handleNextDynamicRequest(request) {
  const cached = await caches.match(request);
  
  // Обновляем кэш в фоне
  const fetchPromise = fetch(request).then(async (response) => {
    if (response && response.ok) {
      try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
      } catch (err) {
        console.warn('⚠️ Ошибка кэширования:', err);
      }
    }
    return response;
  }).catch(() => {
    // Офлайн - возвращаем кэш
    return cached || new Response('Not found', { status: 404 });
  });

  // Возвращаем кэш сразу если есть, иначе ждём сеть
  return cached || fetchPromise;
}

// Stale While Revalidate для статики
async function handleStaticRequest(request) {
  const cached = await caches.match(request);
  
  // Обновляем кэш в фоне (только для GET запросов)
  const fetchPromise = fetch(request).then(async (response) => {
    if (response && response.ok && request.method === 'GET') {
      try {
        const responseToCache = response.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, responseToCache);
      } catch (err) {
        // Игнорируем ошибки кэширования
      }
    }
    return response;
  }).catch((error) => {
    // Офлайн - возвращаем из кэша если есть
    if (cached) {
      return cached;
    }
    // Нет кэша - возвращаем 404
    return new Response('Not found', { 
      status: 404,
      statusText: 'Not Found'
    });
  });

  // Возвращаем кэш сразу если есть, иначе ждём сеть
  return cached || fetchPromise;
}

// === Background Sync ===
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    // Отправляем сообщение клиенту для запуска синхронизации
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_REQUEST' });
    });
    console.log('✅ Синхронизация запущена');
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
  }
}

// === Push уведомления ===
self.addEventListener('push', (event) => {
  console.log('🔔 Push уведомление получено');
  
  let data = { title: 'TenderCRM', body: 'Новое уведомление' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    vibrate: [200, 100, 200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TenderCRM', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/m/dashboard')
    );
  }
});

// === Периодическая синхронизация ===
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-tenders') {
    event.waitUntil(syncData());
  }
});

// === Сообщения от клиента ===
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// === Утилиты ===

// Создание офлайн-страницы
function createOfflinePage() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Офлайн режим | TenderCRM</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container {
      max-width: 400px;
      animation: fadeIn 0.5s ease-in;
    }
    .icon {
      font-size: 4em;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 10px;
      font-weight: 600;
    }
    p {
      font-size: 1.1em;
      opacity: 0.9;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid white;
      border-radius: 25px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔴</div>
    <h1>Офлайн режим</h1>
    <p>Нет подключения к интернету. Пожалуйста, проверьте соединение и попробуйте снова.</p>
    <button class="button" onclick="window.location.reload()">Попробовать снова</button>
  </div>
</body>
</html>`;
}

// Очистка старых изображений
async function cleanOldImages() {
  try {
    const cache = await caches.open(IMAGE_CACHE_NAME);
    const requests = await cache.keys();
    const now = Date.now();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const age = now - new Date(dateHeader).getTime();
          // Удаляем изображения старше 7 дней
          if (age > CACHE_EXPIRATION.images) {
            await cache.delete(request);
            console.log('🗑️ Удалено старое изображение:', request.url);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка очистки изображений:', error);
  }
}
