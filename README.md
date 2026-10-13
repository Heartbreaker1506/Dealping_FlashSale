<div align="center">

# ⚡ DEALPING — FLASH SALE PRICE TRACKER 🎯
### *Hệ Thống Săn Deal Đáy Đa Sàn Tự Động & Cảnh Báo Sập Giá Tức Thì 24/7*

<br/>

[![Status](https://img.shields.io/badge/Status-Active_Production-00E676?style=for-the-badge&logo=statuspage&logoColor=white)](https://github.com/Heartbreaker1506/Dealping_FlashSale)
[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS_4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

<br/>

> 💡 **"Dán link sản phẩm. Đặt giá mong muốn. Radar quét 24/7 và hú còi đánh thức điện thoại ngay khi sàn sập giá!"**

[🚀 Xem Bản Trực Tiếp](#-demo--truy-cập-nhanh) • [✨ Tính Năng Nổi Bật](#-tính-năng-nổi-bật) • [🏗️ Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống) • [⚡ Cài Đặt Nhanh](#-hướng-dẫn-cài-đặt--vận-hành) • [📡 Danh Sách API](#-api-endpoints)

---

</div>

## 📌 Tổng Quan Dự Án

**DealPing** là giải pháp phần mềm thông minh đa nền tảng (Web App Mobile-first & Hybrid Mobile) giúp người tiêu dùng giải quyết triệt để vấn đề:
1. **Bị "hớ giá" hoặc gặp "sale ảo"**: Đẩy giá niêm yết lên cao rồi gắn mác giảm giá sâu.
2. **Mất thời gian canh sale**: Phải thức khuya lúc 0h, 12h, liên tục F5 trang để giật deal chớp nhoáng.
3. **Bỏ lỡ voucher chạm đáy**: Khi voucher sàn vừa mở thì sản phẩm đã hết hàng.

Với **DealPing**, người dùng chỉ cần **dán link** sản phẩm từ **Shopee**, **TikTok Shop** hoặc **Lazada**. Radar thông minh sẽ liên tục rà soát giá thời gian thực, lưu trữ lịch sử biến động và kích hoạt **hệ thống báo động đa tầng (Còi hú Web Audio Synthesizer, Dynamic Island Banner và Web Push Notification)** đánh thức điện thoại ngay cả khi tắt màn hình.

> 🎓 Dự án được nghiên cứu và phát triển trong khuôn khổ môn học **EXE101 — Khởi Nghiệp Đổi Mới Sáng Tạo (FA26)** tại **Trường Đại học FPT**.

---

## ✨ Tính Năng Nổi Bật

### 📡 1. Radar Quét Giá Thông Minh Đa Sàn 24/7
- **Tự động nhận diện nền tảng**: Tách link sản phẩm từ Shopee (cả link dài và link rút gọn `vn.shp.ee`), TikTok Shop, Lazada.
- **Trích xuất thông minh**: Lấy chính xác tên món, hình ảnh sắc nét từ CDN, giá niêm yết và phân loại biến thể (variant).
- **Radar trực quan hóa**: Giao diện vòng tròn radar xoay mượt mà chuẩn phong cách Apple Glassmorphism kèm nhịp tim đập (Radar pulse).

### 🚨 2. Hệ Thống Cảnh Báo Sập Giá Đa Tầng (Multi-Tier Alarm)
- **Web Audio Siren Synthesizer**: Trình tổng hợp âm thanh còi hú khẩn cấp đa dải tần (550Hz – 1250Hz) kết hợp chuông Ping điện tử, không cần file mp3 ngoài.
- **Dynamic Island Banner (iOS UI)**: Thông báo trôi mượt mà từ đỉnh màn hình xuống với chi tiết mức giảm, số tiền tiết kiệm và nút *"Chốt Đơn Ngay"*.
- **W3C Background Web Push**: Bắn thông báo đẩy về thiết bị qua Service Worker, có khả năng **đánh thức màn hình điện thoại và rung thiết bị (Haptic Vibration)** ngay cả khi người dùng đã đóng trình duyệt.

### 🫧 3. Cơ Chế Gamification & Giới Hạn Ô Theo Dõi
- **Mở khóa Slot #2**: Người dùng trải nghiệm mini-game bắn nổ đủ **10 bong bóng deal trôi nổi** xung quanh radar để mở thêm ô theo dõi thứ 2.
- **Tối ưu tài nguyên server**: Giới hạn slot linh hoạt, ngăn chặn spam crawler và đảm bảo tần suất kiểm tra giá luôn ở mức cao nhất.

### 📊 4. Lịch Sử Giá & Khuyến Nghị Mua Sắm Thông Minh
- Tự động ghi nhận biểu đồ giá theo từng mốc thời gian (`PriceHistory`).
- Đưa ra lời khuyên độc quyền: *"Giá đã chạm đáy mục tiêu, nên mua ngay kẻo lỡ!"* hoặc *"Chưa đạt giá hời, nên tiếp tục chờ đợt Flash Sale"*.

---

## 🏗️ Kiến Trúc Hệ Thống

```mermaid
flowchart TD
    User([📱 Người Dùng / Trình Duyệt / Điện Thoại]) -->|Dán Link & Đặt Target Price| Client[⚛️ DealPing Frontend - React 19]
    Client -->|REST API / Token Push| Server[⚙️ DealPing Backend - Express.js]
    
    subgraph Backend Core Engine
        Server --> LinkParser[🔗 Link Parser Service - Shopee/TikTok/Lazada]
        Server --> Cron[⏱️ Background Cron Job Service]
        Server --> DB[(🐘 PostgreSQL Database / Prisma ORM)]
    end
    
    Cron -->|Kiểm tra định kỳ| ExtAPIs[🌐 E-Commerce Platforms]
    Cron -->|Phát hiện sập giá| NotifService[🔔 Notification Engine]
    
    NotifService -->|Web Push Protocol / VAPID| ServiceWorker[⚡ Service Worker sw.js]
    NotifService -->|Firebase Cloud Messaging| MobileDevices[📲 Thiết Bị Di Động]
    ServiceWorker -->|Đánh thức máy & Còi hú| User
```

---

## 🗂️ Cấu Trúc Mã Nguồn

```bash
Dealping_FlashSale/
├── Dealping_Backend/              # ⚙️ Node.js + Express.js API Server
│   ├── prisma/
│   │   └── schema.prisma          # Định nghĩa Database Models (User, TrackingItem, Notification)
│   ├── src/
│   │   ├── config/                # Prisma client, Firebase, VAPID WebPush config
│   │   ├── controllers/           # trackingItems, notification, user controllers
│   │   ├── routes/                # Express REST API endpoints
│   │   ├── services/              # cronService, notificationService, linkParser, trackingItems
│   │   ├── middlewares/           # Error handler & input validator
│   │   ├── app.js                 # Express Application
│   │   └── server.js              # Server entry point
│   ├── Dockerfile                 # Container hóa Backend
│   └── package.json
│
├── Dealping_Frontend/             # 📱 React 19 + TypeScript + Vite UI
│   ├── public/
│   │   └── sw.js                  # Background Web Push Service Worker
│   ├── src/
│   │   ├── App.tsx                # Radar Engine, Web Audio Synthesizer, Glassmorphism UI
│   │   ├── main.tsx               # React DOM Entry
│   │   └── index.css              # Custom Animations, Dark Theme & Glass tokens
│   ├── capacitor.config.ts        # Cấu hình đóng gói ứng dụng di động iOS/Android
│   ├── vite.config.ts             # Vite build & PWA setup
│   └── package.json
│
├── vercel.json                    # Cấu hình triển khai Vercel
├── netlify.toml                   # Cấu hình triển khai Netlify
└── package.json                   # Root package quản lý song song Frontend & Backend
```

---

## 💻 Tech Stack & Công Nghệ Sử Dụng

| Tầng | Công Nghệ / Thư Viện | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| **Frontend** | **React 19, TypeScript, Vite 8** | Giao diện hiệu năng cao, phản hồi tức thì dưới 16ms |
| **Styling** | **TailwindCSS 4, Glassmorphism** | Giao diện chuẩn iOS Dark Mode, hiệu ứng viền phát sáng |
| **Audio** | **Web Audio API (Synthesizer)** | Tạo âm còi hụ khẩn cấp thời gian thực không cần tải file MP3 |
| **Backend** | **Node.js 20, Express.js** | Xử lý RESTful APIs, link parser & cron job rà soát giá |
| **Database** | **PostgreSQL, Prisma ORM** | Quản lý bảng dữ liệu người dùng, tracking slot & lịch sử giá |
| **Push Notif** | **Web-Push (VAPID W3C) + Firebase** | Đánh thức màn hình điện thoại và gửi thông báo khi sập giá |
| **Cron Job** | **Node-cron Engine** | Tự động quét và đối chiếu giá sàn định kỳ |
| **Mobile** | **Capacitor** | Hỗ trợ chuyển đổi Web App sang Android APK / iOS IPA |

---

## ⚡ Hướng Dẫn Cài Đặt & Vận Hành

### 1. Yêu Cầu Tiên Quyết
- **Node.js**: >= 18.x (khuyên dùng Node 20 LTS)
- **PostgreSQL**: Local instance hoặc cloud database (Neon, Supabase, Railway)
- **npm** hoặc **yarn**

### 2. Clone Dự Án
```bash
git clone https://github.com/Heartbreaker1506/Dealping_FlashSale.git
cd Dealping_FlashSale
```

### 3. Cài Đặt Dependencies Cho Cả Hai Phía
```bash
# Cài đặt toàn bộ packages ở cả root, Backend và Frontend
npm run install:all
```

### 4. Thiết Lập Biến Môi Trường (.env)

#### 🔹 Cấu hình Backend (`Dealping_Backend/.env`):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/dealping_db?schema=public"
FRONTEND_URL="http://localhost:5173"

# Web Push VAPID Keys (Tạo bằng lệnh: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:support@dealping.com"
```

#### 🔹 Cấu hình Frontend (`Dealping_Frontend/.env`):
```env
VITE_API_BASE_URL="http://localhost:3000"
```

### 5. Chạy Migration Database
```bash
cd Dealping_Backend
npx prisma db push
npx prisma generate
cd ..
```

### 6. Khởi Động Dự Án (Concurrent Dev Mode)
Từ thư mục gốc dự án:
```bash
npm run dev
```
- 🌐 **Frontend**: Mở trình duyệt tại [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend**: Chạy tại [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

### 🛒 Quản Lý Tracking Items
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `POST` | `/api/tracking-items` | Tạo sản phẩm theo dõi giá mới (tối đa 2 slot/user) |
| `GET` | `/api/tracking-items?userId=...` | Lấy danh sách sản phẩm đang theo dõi của user |
| `GET` | `/api/tracking-items/:id` | Xem chi tiết 1 sản phẩm |
| `PATCH` | `/api/tracking-items/:id/target-price` | Cập nhật lại giá mục tiêu |
| `POST` | `/api/tracking-items/:id/simulate-drop` | Kích hoạt kịch bản sập giá giả lập (Test còi & Push) |
| `DELETE` | `/api/tracking-items/:id` | Hủy theo dõi sản phẩm |

### 🔔 Quản Lý Thông Báo & Thiết Bị
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `POST` | `/api/notifications/register-token` | Đăng ký Web Push Subscription / FCM Device Token |
| `GET` | `/api/notifications?userId=...` | Lấy danh sách thông báo in-app |
| `PATCH` | `/api/notifications/:id/read` | Đánh dấu đã đọc thông báo |
| `POST` | `/api/notifications/test-price-drop` | Bắn thử nghiệm thông báo sập giá về điện thoại |

---

## 🚀 Triển Khai (Deployment)

- **Frontend**: Triển khai dễ dàng chỉ với 1 click lên **Vercel** hoặc **Netlify** (đã có sẵn file cấu hình `vercel.json` & `netlify.toml`).
- **Backend**: Triển khai lên **Railway**, **Render** hoặc chạy Docker qua `Dockerfile` có sẵn trong thư mục `Dealping_Backend`.

---

## 👥 Nhóm Tác Giả & Bản Quyền

- **Tác giả**: [Heartbreaker1506 (Trần Võ Anh Kiệt)](https://github.com/Heartbreaker1506)
- **Đồ án**: EXE101 — Dự án Khởi Nghiệp Đổi Mới Sáng Tạo (FA26)
- **Tổ chức**: Trường Đại học FPT
- **Giấy phép**: Phát hành theo giấy phép [MIT License](LICENSE).

<br/>

<div align="center">

**⭐ Hãy để lại 1 Star nếu bạn thấy dự án hữu ích hoặc truyền cảm hứng cho bạn! ⭐**

</div>
