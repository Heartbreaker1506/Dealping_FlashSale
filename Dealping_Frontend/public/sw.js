// DealPing Service Worker - Background Web Push Notification
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Lắng nghe sự kiện Push từ Server gửi về (khi điện thoại tắt màn hình hoặc đóng app)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🚨 DEALPING: BÁO ĐỘNG SẬP GIÁ!';
  const options = {
    body: data.body || 'Sản phẩm bạn đang theo dõi vừa sập giá đáy! Chạm để vào xem ngay!',
    icon: data.icon || data.imageUrl || '/logo.png',
    badge: '/logo.png',
    vibrate: [300, 100, 300, 100, 400],
    tag: data.tag || 'dealping-price-drop-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/?alarm=1',
      productName: data.productName,
      newPrice: data.newPrice,
      oldPrice: data.oldPrice,
      imageUrl: data.imageUrl,
      trackingItemId: data.trackingItemId,
    },
    actions: [
      { action: 'open_app', title: '⚡ Xem Deal & Chốt Ngay' },
      { action: 'dismiss', title: 'Đóng' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Khi người dùng bấm vào thông báo trên màn hình khóa / thanh thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/?alarm=1';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Nếu đã có tab đang mở, focus vào tab đó và điều hướng
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Nếu chưa có tab nào mở (app đang đóng), mở cửa sổ mới
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
