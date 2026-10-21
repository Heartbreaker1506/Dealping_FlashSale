// DealPing Auto Worker & Bridge — Background Service Worker (MV3)
// Nhiệm vụ:
// 1. Khi bật "Chế độ Máy Trạm (Auto Worker)" trên máy Kiệt/Quân:
//    Định kỳ hỏi Backend xem có link Shopee nào khách vừa dán trên điện thoại cần đọc Giá Sau Voucher không.
// 2. Tự động mở tab Shopee ngầm (active: false), đợi content.js bóc xong giá (244.072₫ / 29.000₫),
//    bắn kết quả về Backend của Quân rồi LẬP TỨC ĐÓNG TAB (chrome.tabs.remove) để không tốn RAM!

const DEFAULT_BACKEND_URL = "http://localhost:3000";
const workerTabs = new Map(); // tabId -> { itemId, timeoutId }
let isProcessingJob = false;

function getWorkerConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["dealping_worker_enabled", "dealping_backend_url", "dealping_worker_stats"],
      (res) => {
        resolve({
          enabled: Boolean(res.dealping_worker_enabled),
          backendUrl: (res.dealping_backend_url || DEFAULT_BACKEND_URL).replace(/\/+$/, ""),
          stats: res.dealping_worker_stats || { completed: 0, lastItem: null, lastTime: null }
        });
      }
    );
  });
}

async function submitPriceToBackend(backendUrl, payload) {
  try {
    await fetch(`${backendUrl}/api/worker/submit-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Backend chưa mở endpoint hoặc đang offline -> bỏ qua an toàn
  }
}

// Lắng nghe dữ liệu DOM từ content.js gửi về ngay khi trang Shopee vừa load xong
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "DEALPING_DOM_SCRAPED" && message.data) {
    const scrapedData = message.data;
    const tabId = sender && sender.tab ? sender.tab.id : null;

    getWorkerConfig().then(async (config) => {
      // Gửi dữ liệu giá thực tế (Giá Sau Voucher) về Backend của Quân
      await submitPriceToBackend(config.backendUrl, scrapedData);

      // Nếu tab này do Auto Worker tự mở ngầm -> ĐÓNG TAB NGAY LẬP TỨC để giải phóng RAM!
      if (tabId && workerTabs.has(tabId)) {
        const jobInfo = workerTabs.get(tabId);
        if (jobInfo && jobInfo.timeoutId) {
          clearTimeout(jobInfo.timeoutId);
        }
        workerTabs.delete(tabId);
        isProcessingJob = false;

        const nextStats = {
          completed: (config.stats.completed || 0) + 1,
          lastItem: `${scrapedData.itemId} (${Number(scrapedData.detectedPrice).toLocaleString("vi-VN")}₫)`,
          lastTime: new Date().toLocaleTimeString("vi-VN")
        };
        chrome.storage.local.set({ dealping_worker_stats: nextStats });

        try {
          chrome.tabs.remove(tabId);
        } catch (e) {}
      }
    });

    sendResponse({ ok: true });
    return true;
  }
});

// Vòng lặp hỏi Backend mỗi 3 giây khi bật chế độ Máy Trạm (Auto Worker)
async function pollPendingTasks() {
  if (isProcessingJob) return;

  const config = await getWorkerConfig();
  if (!config.enabled || !config.backendUrl) return;

  try {
    const res = await fetch(`${config.backendUrl}/api/worker/pending-tasks`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    if (!res.ok) return;

    const json = await res.json();
    const task = json && (json.task || json.data);
    if (!task || !task.url) return;

    isProcessingJob = true;

    // Mở tab Shopee ở chế độ chạy ngầm (active: false) để không làm phiền Kiệt/Quân đang dùng máy
    chrome.tabs.create({ url: task.url, active: false }, (tab) => {
      if (!tab || !tab.id) {
        isProcessingJob = false;
        return;
      }

      const tabId = tab.id;
      // Bảo hiểm an toàn: Tự động đóng tab sau 12 giây nếu mạng lag hoặc link lỗi
      const timeoutId = setTimeout(() => {
        if (workerTabs.has(tabId)) {
          workerTabs.delete(tabId);
          isProcessingJob = false;
          try {
            chrome.tabs.remove(tabId);
          } catch (e) {}
        }
      }, 12000);

      workerTabs.set(tabId, {
        itemId: task.itemId || null,
        timeoutId
      });
    });
  } catch (err) {
    isProcessingJob = false;
  }
}

setInterval(pollPendingTasks, 3000);
