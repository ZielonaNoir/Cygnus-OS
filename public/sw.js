// Service Worker for Cygnus-OS PWA
// 艺术风格离线缓存策略
// v2 - 修复开发环境缓存问题

const CACHE_NAME = 'cygnus-os-v2';
const RUNTIME_CACHE = 'cygnus-os-runtime-v2';

// 需要预缓存的资源（仅离线页面）
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
];

// 不应该被缓存的 URL 模式
const SKIP_CACHE_PATTERNS = [
  '/_next/',        // Next.js 构建资源
  '/api/',          // API 请求
  'localhost:',     // 本地开发
  '127.0.0.1:',     // 本地开发
  'hot-update',     // HMR 热更新
  'webpack',        // Webpack HMR
  'turbopack',      // Turbopack
  '__nextjs',       // Next.js 内部
  'chrome-extension', // Chrome extensions
];

// 检查 URL 是否应该跳过缓存
function shouldSkipCache(url) {
  return SKIP_CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

// 安装 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching offline resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // 删除所有旧版本缓存
              return !cacheName.includes('v2');
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 跳过非 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过不应该缓存的资源（开发环境、API、Next.js 构建资源等）
  if (shouldSkipCache(url)) {
    return;
  }

  event.respondWith(
    // 网络优先策略
    fetch(event.request)
      .then((response) => {
        // 只缓存成功的响应
        if (!response || response.status !== 200) {
          return response;
        }

        // 克隆响应
        const responseToCache = response.clone();

        // 添加到运行时缓存（仅缓存静态资源）
        if (url.includes('/icons/') || url.endsWith('.png') || url.endsWith('.ico')) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // 网络失败，尝试从缓存获取
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // 如果是导航请求，返回离线页面
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }

          return new Response('Network error', { status: 503 });
        });
      })
  );
});

// Push Notification Handler
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

// Notification Click Handler
self.addEventListener('notificationclick', function (event) {
  console.log('[SW] Notification click received.')
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
