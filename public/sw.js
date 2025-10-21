const CACHE_VERSION = 'v2';
const CACHE_NAME = `tendercrm-${CACHE_VERSION}`;
const API_CACHE_NAME = `tendercrm-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `tendercrm-images-${CACHE_VERSION}`;

// Статические файлы для кэширования
const STATIC_CACHE = [
  '/',
  '/login',
  '/m/login',
  '/m/dashboard',
  '/m/tenders',
  '/m/tenders/add',
  '/m/accounting',
  '/m/suppliers',
  '/m/suppliers/add',
  '/m/chat',
  '/m/files',
  '/m/menu',
  '/m/ai',
  '/m/admin',
  '/m/settings',
  '/manifest.json',
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

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('📦 Кэшируем статические файлы');
      // Кэшируем файлы по одному, чтобы один сбой не ломал всё
      for (const url of STATIC_CACHE) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`⚠️ Не удалось закэшировать ${url}:`, err.message);
        }
      }
      console.log('✅ Кэширование завершено');
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Активация');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем старые версии кэша
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== API_CACHE_NAME &&
            cacheName !== IMAGE_CACHE_NAME
          ) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорируем запросы к другим доменам
  if (url.origin !== location.origin) {
    return;
  }

  // API запросы - Network First с кэшем
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Изображения - Cache First
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Навигационные запросы (переходы между страницами) - Network First с fallback
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Next.js статические ресурсы (_next/static/*) - Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleNextStaticRequest(request));
    return;
  }

  // Статические файлы - Stale While Revalidate
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
