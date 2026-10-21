(function () {
  window.__DEALPING_CACHE__ = window.__DEALPING_CACHE__ || {};

  window.addEventListener("dealping-cache-sync", (e) => {
    try {
      if (e && e.detail) {
        window.__DEALPING_CACHE__ = JSON.parse(e.detail) || {};
      }
    } catch (err) {}
  });

  function extractShopeeItemId(urlStr) {
    if (!urlStr || typeof urlStr !== "string") return null;
    const match =
      urlStr.match(/-i\.(\d+)\.(\d+)/) || urlStr.match(/\/product\/(\d+)\/(\d+)/);
    return match ? match[2] : null;
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const reqUrl = typeof args[0] === "string" ? args[0] : (args[0] && args[0].url) || "";
    const reqInit = args[1] || {};

    // 1. Khi Web App gọi API /api/tracking-items/preview (Lúc người dùng dán link vào Ô #1, #2, #3)
    if (reqUrl.includes("/api/tracking-items/preview")) {
      let requestedItemId = null;
      try {
        if (reqInit.body && typeof reqInit.body === "string") {
          const parsedBody = JSON.parse(reqInit.body);
          requestedItemId = extractShopeeItemId(parsedBody.shopeeUrl || parsedBody.url);
        }
      } catch (e) {}

      const cached =
        requestedItemId && window.__DEALPING_CACHE__
          ? window.__DEALPING_CACHE__[requestedItemId]
          : null;

      try {
        const res = await originalFetch.apply(this, args);
        if (!cached) return res;

        const cloned = res.clone();
        const json = await cloned.json();
        if (json && json.data) {
          // Ghi đè Giá thực tế sau Voucher (ví dụ 244.072₫ hoặc 29.000₫) thẳng vào dữ liệu trả về cho Web App
          json.data.price = cached.detectedPrice;
          json.data.currentPrice = cached.detectedPrice;
          json.data.originalPrice = cached.detectedPrice;
          json.data.voucherPrice = cached.detectedPrice;
          if (
            cached.productName &&
            (!json.data.productName ||
              json.data.productName.includes("Không thể lấy") ||
              json.data.productName.includes("Sản phẩm"))
          ) {
            json.data.productName = cached.productName;
          }
          console.log(
            "[DealPing Bridge] Đã bơm giá thực tế từ màn hình Shopee vào Ô theo dõi Web App:",
            cached.detectedPrice
          );
          return new Response(JSON.stringify(json), {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers
          });
        }
        return res;
      } catch (err) {
        // Ngay cả khi Server Backend bị sập/ngủ đông, vẫn trả về dữ liệu chuẩn từ Extension cho Web App!
        if (cached) {
          return new Response(
            JSON.stringify({
              status: "success",
              data: {
                productName: cached.productName,
                price: cached.detectedPrice,
                currentPrice: cached.detectedPrice,
                originalPrice: cached.detectedPrice,
                voucherPrice: cached.detectedPrice,
                imageUrl: null,
                affiliateUrl: cached.url,
                variants: []
              }
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
        throw err;
      }
    }

    return originalFetch.apply(this, args);
  };
})();
