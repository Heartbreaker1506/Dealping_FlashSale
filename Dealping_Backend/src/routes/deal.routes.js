const express = require("express");
const router = express.Router();
const { getDeepestSaleDeal } = require("../services/dealService");

/**
 * GET /api/deals/deepest-sale
 * Quét các sàn và trả về deal đang giảm sâu nhất
 */
router.get("/deepest-sale", async (req, res, next) => {
  try {
    const deal = await getDeepestSaleDeal();
    if (!deal) {
      return res.status(404).json({ success: false, message: "Không tìm thấy deal giảm giá trên sàn" });
    }
    return res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
});

const { fetchPriceHistory } = require("../services/shopeePriceService");

/**
 * GET /api/deals/history/:itemId
 * Lấy lịch sử giá để vẽ biểu đồ
 */
router.get("/history/:itemId", async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const history = await fetchPriceHistory(itemId);

    return res.status(200).json({
      status: "success",
      data: history
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
