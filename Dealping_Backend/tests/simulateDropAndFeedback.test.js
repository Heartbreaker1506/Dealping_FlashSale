const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const feedbackRouter = require("../src/routes/feedback.routes");

test("Feedback route phản hồi thành công và trả về unlockedSlot3: true", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/feedback", feedbackRouter);

  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "test-user-exe101",
        rating: 5,
        feedback: "App săn sale rất mượt, hy vọng có thêm lọc theo ngành hàng!",
        contact: "0901234567"
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.unlockedSlot3, true);
    assert.ok(data.message.includes("Cảm ơn"));
  } finally {
    server.close();
  }
});

test("Feedback route xử lý gracefully khi body rỗng", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/feedback", feedbackRouter);

  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://localhost:${port}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.unlockedSlot3, true);
  } finally {
    server.close();
  }
});
