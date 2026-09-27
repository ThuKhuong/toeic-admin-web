# TOEIC Admin - React Vite + Ant Design

## Mô tả

Dự án quản trị hệ thống TOEIC được xây dựng bằng React + Vite + Ant Design, chuyển đổi từ dự án EJS ban đầu.

## Công nghệ sử dụng

- **React** - Thư viện JavaScript để xây dựng giao diện người dùng
- **Vite** - Build tool nhanh và hiện đại
- **Ant Design** - Thư viện UI components cho React
- **React Router** - Điều hướng trong ứng dụng SPA
- **Ant Design Icons** - Bộ icon chuyên dụng

## Cấu trúc dự án

```
src/
├── components/          # Các component tái sử dụng
├── layouts/            # Layout components
│   └── MainLayout.jsx  # Layout chính với sidebar và header
├── pages/              # Các trang chính
│   ├── Dashboard.jsx   # Trang dashboard với thống kê
│   ├── Login.jsx       # Trang đăng nhập
│   ├── Tests.jsx       # Quản lý bài test
│   └── Vocabulary.jsx  # Quản lý từ vựng
├── App.jsx            # Component chính với routing
├── main.jsx           # Entry point
├── App.css            # Styles cho App
└── index.css          # Global styles
```

## Tính năng chính

### Xác thực
- Trang đăng nhập với validation
- Bảo vệ route (Protected Routes)
- Local storage để lưu token

### Dashboard
- Thống kê tổng quan (học viên, từ vựng, bài test, câu hỏi, thẻ SRS)
- Hoạt động gần đây
- Quick actions để truy cập nhanh

### Quản lý Từ vựng
- Danh sách từ vựng với phân trang
- Tìm kiếm theo từ khóa
- Thêm/sửa/xóa từ vựng
- Phân loại theo chủ đề và độ khó
- Hiển thị phiên âm

### Quản lý Bài test
- Danh sách bài test theo loại (Listening, Reading, Full Test)
- Tạo mới và chỉnh sửa bài test
- Quản lý thời gian và số câu hỏi
- Trạng thái xuất bản/bản nháp

## Cài đặt và chạy dự án

### Yêu cầu
- Node.js >= 16
- npm hoặc yarn

### Cài đặt
```bash
# Clone project
cd toeic_admin_vite

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

### Build production
```bash
npm run build
```
