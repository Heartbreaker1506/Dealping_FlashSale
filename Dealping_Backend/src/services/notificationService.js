const prisma = require("../config/prisma");
const admin = require("../config/firebase");
const webpush = require("web-push");

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:support@dealping.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Gửi Push Notification (Web Push W3C hoặc Firebase FCM)
 */
async function sendPushNotification(deviceToken, title, body, data = {}) {
  try {
    if (!deviceToken) {
      console.warn("⚠️ Không thể gửi Push: Bỏ qua vì không có deviceToken.");
      return;
    }

    // 1. Kiểm tra nếu deviceToken là PushSubscription JSON (Web Push - Đánh thức điện thoại khi tắt màn hình)
    let isWebPush = false;
    let pushSubscription = null;
    if (typeof deviceToken === "string" && (deviceToken.startsWith("{") || deviceToken.includes("endpoint"))) {
      try {
        pushSubscription = JSON.parse(deviceToken);
        if (pushSubscription && pushSubscription.endpoint) {
          isWebPush = true;
        }
      } catch (e) {}
    } else if (typeof deviceToken === "object" && deviceToken.endpoint) {
      isWebPush = true;
      pushSubscription = deviceToken;
    }

    if (isWebPush && pushSubscription) {
      const payload = JSON.stringify({
        title,
        body,
        icon: data.imageUrl || "/logo.png",
        url: `/?alarm=1&itemId=${data.trackingItemId || ""}`,
        productName: data.productName,
        newPrice: data.newPrice,
        oldPrice: data.oldPrice,
        imageUrl: data.imageUrl,
        trackingItemId: data.trackingItemId,
      });

      const res = await webpush.sendNotification(pushSubscription, payload);
      console.log("✅ Đã bắn Web Push thành công về điện thoại (kể cả khi tắt máy):", res.statusCode);
      return res;
    }

    // 2. Fallback sang Firebase Admin (FCM Token)
    const messaging = typeof admin.messaging === "function" ? admin.messaging() : admin.messaging;
    if (messaging) {
      const serializedData = {};
      for (const [key, val] of Object.entries(data)) {
        serializedData[key] = typeof val === "string" ? val : JSON.stringify(val);
      }
      const message = {
        notification: { title, body },
        data: serializedData,
        token: deviceToken,
      };
      const response = await messaging.send(message);
      console.log("✅ Đã gửi thông báo FCM thành công:", response);
      return response;
    }
  } catch (error) {
    console.error("❌ Lỗi khi gửi Push Notification:", error.message);
  }
}

/**
 * Tạo thông báo trong app (lưu vào database)
 */
async function createInAppNotification({
  userId,
  trackingItemId = null,
  title,
  message,
  productName = null,
  imageUrl = null,
  productUrl = null,
  oldPrice = null,
  newPrice = null,
  targetPrice = null,
  type = "PRICE_DROP",
}) {
  try {
    const record = await prisma.notification.create({
      data: {
        userId,
        trackingItemId,
        title,
        message,
        productName,
        imageUrl,
        productUrl,
        oldPrice: oldPrice ? Number(oldPrice) : null,
        newPrice: newPrice ? Number(newPrice) : null,
        targetPrice: targetPrice ? Number(targetPrice) : null,
        type,
      },
    });
    return record;
  } catch (error) {
    console.error("❌ Lỗi khi lưu notification vào DB:", error);
    throw error;
  }
}

/**
 * Xử lý sự kiện sập giá: lưu in-app notification & bắn FCM push
 */
async function notifyPriceDrop({
  userId,
  deviceToken,
  trackingItemId,
  productName,
  productUrl,
  imageUrl,
  oldPrice,
  newPrice,
  targetPrice,
}) {
  const formattedNew = new Intl.NumberFormat("vi-VN").format(newPrice) + "đ";
  const formattedTarget = new Intl.NumberFormat("vi-VN").format(targetPrice) + "đ";
  const savings = oldPrice && oldPrice > newPrice ? Math.round((1 - newPrice / oldPrice) * 100) : 25;

  const title = "🚨 DEALPING: BÁO ĐỘNG SẬP GIÁ!";
  const message = `"${productName || 'Sản phẩm'}" vừa sập giá còn ${formattedNew} (Mục tiêu: ${formattedTarget}, giảm -${savings}%). Vào chốt ngay!`;

  // 1. Lưu DB để hiển thị trên UI giao diện web/app
  const dbNotif = await createInAppNotification({
    userId,
    trackingItemId,
    title,
    message,
    productName,
    imageUrl,
    productUrl,
    oldPrice,
    newPrice,
    targetPrice,
    type: "PRICE_DROP",
  });

  // 2. Bắn Push Notification (Web Push / FCM) để báo về điện thoại khi tắt máy
  let tokenToSend = deviceToken;
  if (!tokenToSend && userId) {
    try {
      const userRecord = await prisma.user.findUnique({ where: { id: userId } });
      if (userRecord && userRecord.deviceToken) {
        tokenToSend = userRecord.deviceToken;
      }
    } catch (e) {}
  }

  if (tokenToSend) {
    await sendPushNotification(tokenToSend, title, message, {
      notificationId: dbNotif.id,
      trackingItemId: trackingItemId || "",
      productUrl: productUrl || "",
      newPrice: String(newPrice),
      oldPrice: String(oldPrice || ""),
      productName: productName || "",
      imageUrl: imageUrl || "",
    });
  }

  return dbNotif;
}

/**
 * Lấy danh sách thông báo của user
 */
async function listNotifications(userId) {
  if (!userId) return [];
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Đánh dấu thông báo đã đọc
 */
async function markAsRead(id, userId) {
  return await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
}

/**
 * Đánh dấu tất cả thông báo của user đã đọc
 */
async function markAllAsRead(userId) {
  return await prisma.notification.updateMany({
    where: { userId },
    data: { isRead: true },
  });
}

/**
 * Xóa thông báo
 */
async function deleteNotification(id, userId) {
  return await prisma.notification.deleteMany({
    where: { id, userId },
  });
}

/**
 * Đăng ký / cập nhật deviceToken cho user
 */
async function saveDeviceToken(userId, deviceToken) {
  if (!userId || !deviceToken) return null;
  return await prisma.user.upsert({
    where: { id: userId },
    update: { deviceToken },
    create: {
      id: userId,
      email: `guest_${userId.substring(0, 8)}@dealping.com`,
      deviceToken,
    },
  });
}

module.exports = {
  sendPushNotification,
  createInAppNotification,
  notifyPriceDrop,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveDeviceToken,
};
