const CACHE_NAME = 'lct-cache-v2';
const urlsToCache = ['/', '/index.html'];

// Các domain KHÔNG được cache - để Firebase hoạt động bình thường
const BYPASS_DOMAINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'firebaseapp.com',
  'identitytoolkit',
  'securetoken',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bỏ qua tất cả request đến Firebase/Google - không cache
  if (BYPASS_DOMAINS.some(domain => url.includes(domain))) {
    return; // Để trình duyệt xử lý bình thường
  }

  // Chỉ cache các file tĩnh của app
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(r => r || caches.match('/index.html'))
    )
  );
});
