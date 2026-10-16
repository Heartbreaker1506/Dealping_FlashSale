const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Lấy giá và thông tin sản phẩm Lazada qua ScraperAPI
 * @param {string} url - URL sản phẩm Lazada
 */
async function fetchCurrentPrice(url = "") {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    console.error("SCRAPER_API_KEY is not set in environment variables");
    return defaultFallback();
  }

  try {
    const scraperUrl = `http://api.scrape.do?token=${apiKey}&url=${encodeURIComponent(url)}&super=true`;
    const { data: html } = await axios.get(scraperUrl, { timeout: 30000 });

    const $ = cheerio.load(html);
    let productName = "";
    let price = 0;
    let imageUrl = "";

    const stateMatch = html.match(/(?:window\.pageData|var\s+__moduleData__)\s*=\s*({[\s\S]*?});/);
    if (stateMatch && stateMatch[1]) {
      try {
        const state = JSON.parse(stateMatch[1]);
        if (state.core && state.core.title) {
          productName = state.core.title;
        }

        let priceCandidates = [];
        function extractPrices(obj) {
          if (!obj || typeof obj !== 'object') return;
          // Look for discounted price fields first
          const fields = ['discountPrice', 'campaignPrice', 'promotionPrice', 'flashSalePrice', 'price', 'salePrice'];
          for (const f of fields) {
            if (obj[f]) {
              let val = obj[f];
              if (typeof val === 'object' && val.value) val = val.value;
              else if (typeof val === 'object' && val.text) val = val.text;

              const clean = val.toString().replace(/[^\d]/g, '');
              if (clean) priceCandidates.push(parseInt(clean, 10));
            }
          }
          for (let k in obj) {
            // Don't recurse into original prices to avoid grabbing high prices
            if (k.toLowerCase().includes('original') || k.toLowerCase().includes('old')) continue;
            if (typeof obj[k] === 'object') extractPrices(obj[k]);
          }
        }

        if (state.item && state.item.image) {
          imageUrl = state.item.image;
        }

        extractPrices(state);

        if (priceCandidates.length > 0) {
          price = Math.min(...priceCandidates);
        }
      } catch (e) { }
    }

    if (!productName) {
      productName = $('meta[property="og:title"]').attr('content') || $('title').text();
      productName = productName.replace(/\| Lazada\.vn$/, '').trim();
    }
    if (!imageUrl) {
      imageUrl = $('meta[property="og:image"]').attr('content');
    }
    if (!price) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const json = JSON.parse($(el).html());
          if (json && json["@type"] === "Product" && json.offers) {
            price = parseFloat(json.offers.price);
          }
        } catch (e) { }
      });
    }

    if (price > 0 || productName) {
      return {
        price: price || 0,
        productName: productName || null,
        imageUrl: imageUrl || null,
        variants: [],
        flashSalePrice: null,
        cashbackCommission: 0,
        discountCodes: []
      };
    }
  } catch (err) {
    console.error("Lỗi khi lấy giá Lazada qua ScraperAPI:", err.message);
  }

  return defaultFallback();
}

function defaultFallback() {
  return {
    price: 0,
    productName: null,
    imageUrl: null,
    variants: [],
    flashSalePrice: null,
    cashbackCommission: 0,
    discountCodes: []
  };
}

module.exports = {
  fetchCurrentPrice
};
