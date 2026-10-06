const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Lấy giá và thông tin sản phẩm Shopee qua AddLiveTag API
 * @param {string|number} itemId 
 * @param {string|number} shopId 
 * @param {string} url 
 * @returns 
 */
async function fetchCurrentPrice(itemId, shopId, url = "") {
  const apiKey = process.env.ADDLIVETAG_API_KEY;
  
  if (!itemId) {
    return defaultFallback();
  }

  try {
    const apiUrl = `https://data.addlivetag.com/product-data/product-data.php?item_id=${itemId}`;
    const response = await axios.get(apiUrl, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      params: apiKey ? { key: apiKey } : {}, // Gửi kèm query string dự phòng
      timeout: 15000
    });

    const data = response.data;
    console.log("[Shopee API Response]:", JSON.stringify(data).slice(0, 300));
    
    // Nếu API trả về object có productInfo, data, hoặc trả trực tiếp
    const product = data.productInfo ? data.productInfo : (data.data ? data.data : data);
    
    // API có thể trả về trường 'name' hoặc 'productName'
    const name = product.productName || product.name;
    const priceVal = product.price;

    if (product && (priceVal !== undefined || name)) {
      const price = parseFloat(priceVal) || 0;
      const productName = name || "Sản phẩm Shopee";
      const imageUrl = product.imageUrl || product.image || product.image_url || null;

      // Lưu/Cập nhật bản ghi cache vào DB
      try {
        await prisma.shopeeProductCache.upsert({
          where: { itemId: BigInt(itemId) },
          update: {
            productName: productName,
            price: price,
            imageUrl: imageUrl
          },
          create: {
            itemId: BigInt(itemId),
            productName: productName,
            price: price,
            imageUrl: imageUrl
          }
        });
      } catch (dbErr) {
        console.error("[DB Error] Lỗi khi lưu cache Shopee:", dbErr.message);
      }

      const rawModels = product.models || [];
      const variants = rawModels.map(m => ({
        modelId: m.modelid,
        name: m.name,
        price: (m.price && m.price > 100000) ? m.price / 100000 : m.price, // Format price
        stock: m.stock
      }));

      return {
        price: price,
        productName: productName,
        imageUrl: imageUrl,
        isXtra: false,
        sellerComFinal: 0,
        variants: variants.length > 0 ? variants : (product.variants || product.tier_variations || []),
        flashSalePrice: parseFloat(product.flashSalePrice) || null,
        cashbackCommission: 0,
        discountCodes: []
      };
    }
  } catch (err) {
    console.error(`[Shopee API Error] Lỗi khi lấy giá Shopee (itemId: ${itemId}):`, err.message);
    
    // CƠ CHẾ FALLBACK: Truy vấn vào Cache DB nếu API AddLiveTag chết
    try {
      const cached = await prisma.shopeeProductCache.findUnique({
        where: { itemId: BigInt(itemId) }
      });

      if (cached) {
        console.log(`[Shopee Fallback] Dùng data dự phòng cho itemId ${itemId}`);
        return {
          price: Number(cached.price) || 0,
          productName: cached.productName || "Đang cập nhật...",
          imageUrl: cached.imageUrl || null,
          isXtra: false,
          sellerComFinal: 0,
          variants: [],
          flashSalePrice: null,
          cashbackCommission: 0,
          discountCodes: []
        };
      }
    } catch (fallbackErr) {
      console.error("[DB Error] Lỗi khi lấy data fallback:", fallbackErr.message);
    }
  }

  return defaultFallback();
}

function defaultFallback() {
  return {
    price: 0,
    productName: "Đang cập nhật...",
    imageUrl: null,
    isXtra: false,
    sellerComFinal: 0,
    variants: [],
    flashSalePrice: null,
    cashbackCommission: 0,
    discountCodes: []
  };
}

/**
 * Lấy giá hàng loạt từ AddLiveTag Batch API
 * @param {Array<string|number>} itemIds 
 * @returns {Promise<Object>} Map { itemId: productData }
 */
async function fetchBatchPrices(itemIds) {
  if (!itemIds || itemIds.length === 0) return {};
  
  const apiKey = process.env.ADDLIVETAG_API_KEY;
  const resultMap = {};
  
  try {
    const apiUrl = `https://data.addlivetag.com/product-data/product-data-batch.php`;
    const response = await axios.post(apiUrl, { item_ids: itemIds }, {
      headers: apiKey ? { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      params: apiKey ? { key: apiKey } : {}, 
      timeout: 30000
    });
    
    const data = response.data;
    const items = data.data ? data.data : data;
    
    if (items) {
      // API có thể trả về mảng hoặc object key-value, xử lý cả 2
      const results = Array.isArray(items) ? items : Object.values(items);
      for (const item of results) {
        // Có thể API dùng 'item_id' hoặc 'itemId'
        const itemId = item.item_id || item.itemId;
        if (item && itemId) {
          const priceVal = item.price;
          const name = item.productName || item.name;
          const price = parseFloat(priceVal) || 0;
          const productName = name || "Sản phẩm Shopee";
          const imageUrl = item.imageUrl || item.image || item.image_url || null;
          
          const rawModels = item.models || [];
          const variants = rawModels.map(m => ({
            modelId: m.modelid,
            name: m.name,
            price: (m.price && m.price > 100000) ? m.price / 100000 : m.price,
            stock: m.stock
          }));
          
          resultMap[itemId.toString()] = {
            price: price,
            productName: productName,
            imageUrl: imageUrl,
            isXtra: false,
            sellerComFinal: 0,
            variants: variants,
            flashSalePrice: parseFloat(item.flashSalePrice) || null
          };
          
          // Upsert db
          try {
            await prisma.shopeeProductCache.upsert({
              where: { itemId: BigInt(itemId) },
              update: { productName, price, imageUrl },
              create: { itemId: BigInt(itemId), productName, price, imageUrl }
            });
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error(`[Shopee Batch API Error] Lỗi khi lấy giá batch:`, err.message);
    // CƠ CHẾ FALLBACK: Truy vấn vào Cache DB cho danh sách itemIds
    try {
      const cachedItems = await prisma.shopeeProductCache.findMany({
        where: { itemId: { in: itemIds.map(id => BigInt(id)) } }
      });
      for (const cached of cachedItems) {
        resultMap[cached.itemId.toString()] = {
          price: Number(cached.price) || 0,
          productName: cached.productName || "Đang cập nhật...",
          imageUrl: cached.imageUrl || null,
          isXtra: false,
          sellerComFinal: 0,
          variants: [],
          flashSalePrice: null
        };
      }
    } catch (fallbackErr) {
       console.error("[DB Error] Lỗi khi lấy data fallback batch:", fallbackErr.message);
    }
  }
  
  return resultMap;
}

/**
 * Lấy lịch sử giá để vẽ biểu đồ
 * @param {string|number} itemId 
 * @returns {Promise<Object>} { labels: [], price: [] }
 */
async function fetchPriceHistory(itemId) {
  const apiKey = process.env.ADDLIVETAG_API_KEY;
  if (!itemId) return { labels: [], price: [] };

  try {
    const apiUrl = `https://data.addlivetag.com/price-tracking/history.php?item_ids=${itemId}&days=90&changes_only=1&format=chart`;
    const response = await axios.get(apiUrl, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      params: apiKey ? { key: apiKey } : {},
      timeout: 10000
    });
    
    if (response.data) {
       const data = response.data.data || response.data;
       const labels = data.labels || [];
       const price = data.price || [];
       
       if (labels.length > 0 && price.length > 0) {
         return { labels, price };
       }
    }
  } catch (err) {
    console.error(`[Shopee History API Error] Lỗi khi lấy lịch sử giá cho ${itemId}:`, err.message);
  }
  return { labels: [], price: [] };
}

module.exports = { fetchCurrentPrice, fetchBatchPrices, fetchPriceHistory };
