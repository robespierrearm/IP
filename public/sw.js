const CACHE_NAME = 'tendercrm-mobile-v1';
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/tenders',
  '/accounting',
  '/suppliers',
  '/chat',
  '/files',
  '/admin',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
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
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем из кэша если есть
      if (response) {
        return response;
      }

      // Иначе делаем запрос
      return fetch(event.request).then((response) => {
        // Проверяем валидность ответа
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Клонируем ответ
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Офлайн fallback
      return caches.match('/');
    })
  );
});

// Push уведомления (для будущего)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('TenderCRM', options)
  );
});
