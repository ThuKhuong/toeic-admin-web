# Giao diện quản trị TOEIC

- Theme Ant Design: `src/App.jsx`; bố cục và thông tin từng trang: `src/layouts/MainLayout.jsx`.
- CSS dùng chung: `src/App.css`. Các trang nghiệp vụ giữ service/API, form, import và bảng dữ liệu hiện có.
- Dashboard lấy dữ liệu từ `/admin/dashboard-stats`; không có số liệu mẫu trong mã giao diện.
- Đăng xuất xóa token và thông tin admin trong cả localStorage và sessionStorage.

## Kiểm tra

Chạy `npm run build`. Chạy Vite ở cổng 5174 rồi `node scripts/check-admin-ui.cjs` khi có Playwright. Có thể đặt biến môi trường `PLAYWRIGHT_MODULE` đến bản Playwright/Playwright Core đã cài sẵn.

Script kiểm tra 7 trang ở 1440px và 390px, tab Listening, đăng xuất và xác thực form đăng nhập. API được giả lập để kiểm tra giao diện, không ghi vào database. Ảnh trong `artifacts/admin-ui` là ảnh kiểm thử, số liệu dashboard trong ảnh là dữ liệu giả lập.

Các thao tác import, sửa/xóa dữ liệu thật cần kiểm tra với backend và bộ dữ liệu của dự án. Build có cảnh báo bundle lớn do Ant Design và thư viện xử lý Excel hiện tại.
