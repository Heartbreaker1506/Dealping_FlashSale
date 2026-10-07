const asyncHandler = require("../utils/asyncHandler");
const trackingItemsService = require("../services/trackingItems.service");

const create = asyncHandler(async (req, res) => {
  console.log("CREATE ITEM REQ BODY:", req.body);
  const { userId, shopeeUrl, targetPrice, variantName, selectedModelId, productName, originalPrice, imageUrl } = req.body;
  const item = await trackingItemsService.createTrackingItem({
    userId,
    shopeeUrl,
    targetPrice,
    variantName,
    selectedModelId,
    productName,
    originalPrice,
    imageUrl,
  });
  res.status(201).json({ success: true, data: item });
});

const list = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const items = await trackingItemsService.listTrackingItems(userId);
  res.status(200).json({ success: true, data: items });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await trackingItemsService.deleteTrackingItem(id, userId);
  res.status(204).send();
});

const getHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await trackingItemsService.getTrackingItemHistory(id);
  res.status(200).json({ success: true, data: history });
});

const getChartHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await trackingItemsService.getTrackingItemChartHistory(id);
  res.status(200).json({ success: true, data: history });
});

const preview = asyncHandler(async (req, res) => {
  const { url, shopeeUrl } = req.body;
  const targetUrl = url || shopeeUrl;
  const data = await trackingItemsService.previewTrackingItem(targetUrl);
  res.status(200).json({ success: true, data });
});

const getBatch = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const items = await trackingItemsService.listBatchTrackingItems(userId);
  res.status(200).json({ success: true, data: items });
});

module.exports = { create, list, remove, getHistory, getChartHistory, preview, getBatch };
