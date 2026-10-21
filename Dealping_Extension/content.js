(function () {
  // Xóa cái bảng to cũ nếu còn sót trên trang
  const oldWidget = document.getElementById("dealping-live-widget");
  if (oldWidget) oldWidget.remove();

  function parseVndPrice(rawText) {
    if (!rawText) return null;
    const match = rawText.match(/(\d{1,3}(?:\.\d{3})+)/);
    if (!match) return null;
    const numeric = parseInt(match[1].replace(/\./g, ""), 10);
    return numeric >= 1000 && numeric <= 500000000 ? numeric : null;
  }

  function formatVnd(num) {
    if (!num) return "---";
    return Number(num).toLocaleString("vi-VN") + "₫";
  }

  function extractShopeeProductData() {
    const url = window.location.href;
    const idMatch =
      url.match(/-i\.(\d+)\.(\d+)/) || url.match(/\/product\/(\d+)\/(\d+)/);
    if (!idMatch) return null;

    const shopId = idMatch[1];
    const itemId = idMatch[2];

    let detectedPrice = null;
    let isVoucherPrice = false;
    let originalStrikePrice = null;
    let shopVouchers = [];

    const allElements = Array.from(document.querySelectorAll("div, span, section"));

    // 1. Tìm nhãn "Giá Sau Voucher"
    for (const el of allElements) {
      if (
        el.childElementCount === 0 &&
        el.textContent &&
        el.textContent.trim().toLowerCase().includes("giá sau voucher")
      ) {
        let parent = el.parentElement;
        for (let depth = 0; depth < 4 && parent; depth++) {
          const text = parent.innerText || "";
          const priceMatches = text.match(/\d{1,3}(?:\.\d{3})+\s*₫|₫\s*\d{1,3}(?:\.\d{3})+/g);
          if (priceMatches && priceMatches.length > 0) {
            const firstPrice = parseVndPrice(priceMatches[0]);
            if (firstPrice) {
              detectedPrice = firstPrice;
              isVoucherPrice = true;
              if (priceMatches.length > 1) {
                originalStrikePrice = parseVndPrice(priceMatches[1]);
              }
              break;
            }
          }
          parent = parent.parentElement;
        }
        if (detectedPrice) break;
      }
    }

    // 2. Nếu không có "Giá Sau Voucher", tìm chữ giá to nhất (font >= 22px)
    if (!detectedPrice) {
      let bestFontSize = 0;
      for (const el of allElements) {
        if (el.childElementCount <= 2) {
          const txt = (el.textContent || "").trim();
          if (/^(\d{1,3}(?:\.\d{3})+\s*₫|₫\s*\d{1,3}(?:\.\d{3})+)$/.test(txt)) {
            const rect = el.getBoundingClientRect();
            if (rect.top > 80 && rect.top < 750 && rect.width > 0) {
              const style = window.getComputedStyle(el);
              const fontSize = parseFloat(style.fontSize) || 0;
              if (fontSize >= 22 && fontSize > bestFontSize) {
                const p = parseVndPrice(txt);
                if (p) {
                  bestFontSize = fontSize;
                  detectedPrice = p;
                }
              }
            }
          }
        }
      }
    }

    // 3. Quét các thẻ "Mã Giảm Giá Của Shop"
    for (const el of allElements) {
      if (
        el.childElementCount === 0 &&
        el.textContent &&
        el.textContent.trim().toLowerCase().includes("mã giảm giá của shop")
      ) {
        const row = el.parentElement ? el.parentElement.parentElement || el.parentElement : null;
        if (row) {
          const badges = Array.from(row.querySelectorAll("div, span"))
            .map((b) => (b.textContent || "").trim())
            .filter((t) => /^(Giảm\s+\d+%?|Giảm\s+\d+k₫?)$/i.test(t));
          shopVouchers = [...new Set(badges)];
        }
        break;
      }
    }

    const h1 = document.querySelector("h1");
    const productName = h1
      ? h1.textContent.trim()
      : document.title.replace(/\s*\|\s*Shopee.*$/i, "").trim();

    if (!detectedPrice) return null;

    const tier1 = Math.round((detectedPrice * 0.9) / 1000) * 1000;
    const tier2 = Math.round((detectedPrice * 0.72) / 1000) * 1000;

    return {
      shopId,
      itemId,
      url: url.split("?")[0],
      productName,
      detectedPrice,
      isVoucherPrice,
      originalStrikePrice,
      shopVouchers,
      tier1,
      tier2,
      capturedAt: new Date().toLocaleTimeString("vi-VN"),
      timestamp: Date.now()
    };
  }

  // Chỉ hiện 1 thanh thông báo mỏng nhỏ gọn 3 giây rồi tự ẩn, KHÔNG che màn hình Shopee
  function showMiniToast(data) {
    let pill = document.getElementById("dealping-mini-pill");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "dealping-mini-pill";
      document.body.appendChild(pill);
    }
    pill.style.cssText = `
      position: fixed;
      top: 76px;
      right: 20px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.5);
      border-radius: 999px;
      padding: 6px 14px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.35);
      z-index: 2147483647;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.4s ease;
    `;
    pill.innerHTML = `
      <span style="width:8px;height:8px;border-radius:50%;background:#4ade80;display:inline-block;"></span>
      <span>DealPing đã bắt giá <b style="color:#4ade80;">${formatVnd(data.detectedPrice)}</b> — Copy link dán vào Web App ngay!</span>
    `;
    setTimeout(() => {
      if (pill) pill.style.opacity = "0";
    }, 3500);
  }

  let lastPrice = null;
  let lastItemId = null;

  function scanAndCache() {
    const data = extractShopeeProductData();
    if (data && (data.detectedPrice !== lastPrice || data.itemId !== lastItemId)) {
      lastPrice = data.detectedPrice;
      lastItemId = data.itemId;

      try {
        chrome.storage.local.get(["dealping_price_cache"], (res) => {
          const cache = res.dealping_price_cache || {};
          cache[data.itemId] = data;
          chrome.storage.local.set({
            dealping_price_cache: cache,
            lastCapturedDealPingProduct: data
          });
        });
        chrome.runtime.sendMessage({
          type: "DEALPING_DOM_SCRAPED",
          data: data
        });
      } catch (e) {}

      showMiniToast(data);
    }
  }

  setInterval(scanAndCache, 1500);
  setTimeout(scanAndCache, 700);
})();
