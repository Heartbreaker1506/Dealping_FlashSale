function formatVnd(num) {
  if (!num) return "---";
  return Number(num).toLocaleString("vi-VN") + "₫";
}

document.addEventListener("DOMContentLoaded", () => {
  const contentEl = document.getElementById("content");
  const workerToggle = document.getElementById("workerToggle");
  const backendUrlInput = document.getElementById("backendUrl");
  const saveWorkerBtn = document.getElementById("saveWorkerBtn");
  const workerStatsEl = document.getElementById("workerStats");

  // 1. Tải trạng thái hiện tại từ chrome.storage.local
  chrome.storage.local.get(
    [
      "dealping_worker_enabled",
      "dealping_backend_url",
      "dealping_worker_stats",
      "lastCapturedDealPingProduct",
    ],
    (res) => {
      // Hiển thị sản phẩm vừa bắt được
      const prod = res.lastCapturedDealPingProduct;
      if (prod && prod.detectedPrice && contentEl) {
        contentEl.innerHTML = `
          <div class="card">
            <div class="title" title="${prod.productName || ''}">${prod.productName || "Sản phẩm Shopee"}</div>
            <div class="price">${formatVnd(prod.detectedPrice)}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
              ${prod.isVoucherPrice ? "🏷️ Đã áp dụng Giá Sau Voucher" : "📌 Giá niêm yết hiện tại"} • Lúc ${prod.capturedAt || ""}
            </div>
            <div class="tiers">
              <div class="tier">
                <div class="tier-label">Gợi ý chốt -10%</div>
                <div class="tier-val">${formatVnd(prod.tier1)}</div>
              </div>
              <div class="tier">
                <div class="tier-label">Săn Sale sâu -28%</div>
                <div class="tier-val">${formatVnd(prod.tier2)}</div>
              </div>
            </div>
          </div>
        `;
      }

      // Cấu hình Worker
      if (workerToggle) {
        workerToggle.checked = Boolean(res.dealping_worker_enabled);
      }
      if (backendUrlInput) {
        backendUrlInput.value = res.dealping_backend_url || "http://localhost:3000";
      }
      if (workerStatsEl && res.dealping_worker_stats) {
        const stats = res.dealping_worker_stats;
        workerStatsEl.innerHTML = `
          Đã xử lý: <b>${stats.completed || 0}</b> sản phẩm<br/>
          Mới nhất: ${stats.lastItem || "Chưa có"}<br/>
          Thời gian: ${stats.lastTime || "---"}
        `;
      }
    }
  );

  // 2. Lưu cấu hình khi bấm nút
  if (saveWorkerBtn) {
    saveWorkerBtn.addEventListener("click", () => {
      const enabled = workerToggle ? workerToggle.checked : false;
      const backendUrl = backendUrlInput ? backendUrlInput.value.trim() : "http://localhost:3000";

      chrome.storage.local.set(
        {
          dealping_worker_enabled: enabled,
          dealping_backend_url: backendUrl,
        },
        () => {
          saveWorkerBtn.innerText = "✓ Đã lưu thành công!";
          saveWorkerBtn.style.background = "#16a34a";
          setTimeout(() => {
            saveWorkerBtn.innerText = "Lưu cấu hình Máy Trạm";
            saveWorkerBtn.style.background = "#0284c7";
          }, 2000);
        }
      );
    });
  }
});
