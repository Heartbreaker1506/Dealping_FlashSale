// DealPing WebApp Bridge (Isolated Content Script)
// Nhiệm vụ:
// Đọc `dealping_price_cache` từ chrome.storage.local của extension
// và bắn sự kiện `dealping-cache-sync` sang MAIN world cho `page_interceptor.js` đón lấy.

(function () {
  function syncCacheToPage() {
    try {
      chrome.storage.local.get(["dealping_price_cache"], (res) => {
        const cache = res.dealping_price_cache || {};
        window.dispatchEvent(
          new CustomEvent("dealping-cache-sync", {
            detail: JSON.stringify(cache),
          })
        );
      });
    } catch (e) {}
  }

  // Đồng bộ ngay khi load trang
  syncCacheToPage();

  // Lắng nghe thay đổi trong storage để cập nhật theo thời gian thực
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.dealping_price_cache) {
        window.dispatchEvent(
          new CustomEvent("dealping-cache-sync", {
            detail: JSON.stringify(changes.dealping_price_cache.newValue || {}),
          })
        );
      }
    });
  }

  // Nhận thông điệp trực tiếp nếu có
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === "DEALPING_DOM_SCRAPED") {
        syncCacheToPage();
      }
    });
  }
})();
