const test = require("node:test");
const assert = require("node:assert/strict");
const { serializeItem, formatTimeAgo } = require("../src/services/trackingItems.service");

test("serializeItem trả về đúng lastCheckedAt, status 'monitoring', statusLabel 'Đang rình giá' và lời khuyên", () => {
  const mockItem = {
    id: "item-123",
    userId: "user-456",
    productName: "Áo Thun Cotton",
    itemId: 12345678n,
    shopId: 87654321n,
    selectedModelId: null,
    targetPrice: 150000,
    originalPrice: 200000,
    status: "TRACKING",
    lastCheckedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 phút trước
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  };

  const result = serializeItem(mockItem);

  assert.equal(result.status, "monitoring");
  assert.equal(result.statusLabel, "Đang rình giá");
  assert.equal(result.statusText, "Đang rình giá");
  assert.equal(result.advice, "Giá vẫn neo cao, khuyên chưa nên mua vội");
  assert.equal(result.recommendation, "Giá vẫn neo cao, khuyên chưa nên mua vội");
  assert.equal(result.rawStatus, "TRACKING");
  assert.ok(result.lastCheckedAt);
  assert.equal(result.lastCheckedAgo, "5 phút trước");
  assert.equal(result.lastCheckedText, "5 phút trước");
  assert.equal(result.itemId, "12345678");
  assert.equal(result.shopId, "87654321");
});

test("serializeItem xử lý trạng thái TARGET_HIT đúng với lời khuyên mua ngay", () => {
  const mockItem = {
    id: "item-hit",
    userId: "user-456",
    productName: "Giày Sneaker",
    itemId: 999999n,
    shopId: 111111n,
    targetPrice: 300000,
    originalPrice: 350000,
    status: "TARGET_HIT",
    lastCheckedAt: new Date(Date.now() - 30 * 1000), // 30s trước
    createdAt: new Date(),
  };

  const result = serializeItem(mockItem);

  assert.equal(result.status, "target_hit");
  assert.equal(result.statusLabel, "Đã sập giá");
  assert.equal(result.advice, "Giá đã chạm đáy mục tiêu, nên mua ngay kẻo lỡ!");
  assert.equal(result.lastCheckedAgo, "Vừa xong");
});

test("formatTimeAgo tính toán thời gian tương đối chính xác", () => {
  const now = Date.now();
  assert.equal(formatTimeAgo(new Date(now - 10 * 1000)), "Vừa xong");
  assert.equal(formatTimeAgo(new Date(now - 5 * 60 * 1000)), "5 phút trước");
  assert.equal(formatTimeAgo(new Date(now - 2 * 60 * 60 * 1000)), "2 giờ trước");
  assert.equal(formatTimeAgo(new Date(now - 24 * 60 * 60 * 1000)), "1 ngày trước");
  assert.equal(formatTimeAgo(null), "Vừa xong");
});
