const asyncHandler = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

const list = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "Thiếu userId" });
  }
  const notifications = await notificationService.listNotifications(userId);
  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
  });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await notificationService.markAsRead(id, userId);
  res.status(200).json({ success: true, message: "Đã đánh dấu đã đọc" });
});

const markAllRead = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "Thiếu userId" });
  }
  await notificationService.markAllAsRead(userId);
  res.status(200).json({ success: true, message: "Đã đánh dấu tất cả đã đọc" });
});

const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  await notificationService.deleteNotification(id, userId);
  res.status(200).json({ success: true, message: "Đã xoá thông báo" });
});

const registerDeviceToken = asyncHandler(async (req, res) => {
  const { userId, deviceToken } = req.body;
  if (!userId || !deviceToken) {
    return res.status(400).json({ success: false, message: "Thiếu userId hoặc deviceToken" });
  }
  await notificationService.saveDeviceToken(userId, deviceToken);
  res.status(200).json({ success: true, message: "Đã đăng ký deviceToken thành công" });
});

module.exports = {
  list,
  markRead,
  markAllRead,
  remove,
  registerDeviceToken,
};

