const express = require("express");
const controller = require("../controllers/trackingItems.controller");

const router = express.Router();

router.post("/preview", controller.preview); // POST /api/tracking-items/preview
router.get("/batch", controller.getBatch); // GET /api/tracking-items/batch?userId=...
router.post("/", controller.create); // POST /api/tracking-items
router.get("/", controller.list); // GET  /api/tracking-items?userId=...
router.delete("/:id", controller.remove); // DELETE /api/tracking-items/:id
router.get("/:id/history", controller.getHistory); // GET /api/tracking-items/:id/history
router.get("/:id/chart-history", controller.getChartHistory); // GET /api/tracking-items/:id/chart-history

module.exports = router;
