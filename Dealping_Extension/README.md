# ⚡ DealPing Extension & Auto Worker (Manifest V3)

Extension cầu nối thông minh và máy trạm tự động bóc **Giá Sau Voucher** trên Shopee truyền trực tiếp về Web App DealPing.

---

## 🚀 Hướng Dẫn Cài Đặt Vào Chrome / Cốc Cốc / Edge

1. Mở trình duyệt Chrome (hoặc Cốc Cốc / Edge / Brave).
2. Truy cập vào đường dẫn: `chrome://extensions/`
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
4. Bấm vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
5. Chọn thư mục:
   ```
   d:\FA26\EXE101\Dealping_FlashSale\Dealping_Extension
   ```
6. Tiện ích **"DealPing Bridge & Auto Worker"** sẽ xuất hiện trên thanh công cụ của trình duyệt!

---

## 🎯 2 Chế Độ Hoạt Động Cực Kỳ Tiện Lợi

### 1. Chế độ Cầu Nối Tự Động (Bridge Mode - Mặc định)
* Bạn chỉ cần mở bất kỳ sản phẩm nào trên `shopee.vn`.
* Extension tự động quét nhãn **"Giá Sau Voucher"** và hiển thị 1 thông báo nhỏ màu xanh góc trên màn hình.
* Khi bạn quay lại Web App DealPing dán link Shopee vào ô theo dõi: Extension sẽ **tự động bơm giá voucher thực tế** vào ô xem trước sản phẩm, không lo bị Shopee chặn bot!

### 2. Chế độ Máy Trạm (Auto Worker Mode - Dành cho Admin/Kiệt/Quân)
* Bấm vào icon DealPing trên thanh tiện ích của trình duyệt để mở Popup.
* Tích chọn **"🤖 Chế độ Máy Trạm"**.
* Nhập Backend URL (mặc định: `http://localhost:3000` hoặc link Backend Render).
* Bấm **"Lưu cấu hình Máy Trạm"**.
* **Cơ chế hoạt động:**
  - Định kỳ mỗi 3 giây, Extension hỏi Backend xem có khách hàng nào vừa dán link Shopee trên điện thoại không.
  - Tự động mở 1 tab Shopee chạy ngầm (`active: false`) để bóc giá voucher thực tế.
  - Sau khi bóc xong, gửi giá về Backend rồi **LẬP TỨC ĐÓNG TAB NGAY** để không tốn RAM máy tính.

---

## 📂 Danh sách các file trong Extension:
* `manifest.json`: Khai báo quyền MV3, host permissions Shopee và Web App.
* `background.js`: Service worker quản lý vòng lặp Worker, tự mở và đóng tab ngầm.
* `content.js`: Chạy trên Shopee, bóc giá sau voucher và hiển thị thanh thông báo nhỏ gọn.
* `webapp_bridge.js`: Cầu nối đồng bộ dữ liệu giá từ extension vào trang Web App.
* `page_interceptor.js`: Chặn và chèn giá thực tế vào API preview của Web App.
* `popup.html` & `popup.js`: Giao diện xem giá vừa bắt và bật/tắt chế độ máy trạm.
