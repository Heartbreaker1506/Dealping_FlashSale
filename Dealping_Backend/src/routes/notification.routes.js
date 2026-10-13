const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");

router.get("/", notificationController.list);
router.post("/device-token", notificationController.registerDeviceToken);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);
router.delete("/:id", notificationController.remove);

module.exports = router;
