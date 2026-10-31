# Hệ thống quản lý thiết bị phòng học

- MSSV: 235304
- Họ tên: NguyenMinhHao
- Đề tài: Xây dựng và triển khai hệ thống quản lý thiết bị phòng học trên nền tảng đám mây

## Công nghệ
React, Node.js, Express, MongoDB Atlas, GitHub, Docker, Docker Hub, Render.

## Cấu trúc dự án
- backend/: API quản lý thiết bị
- frontend/: giao diện React

## Cài đặt và chạy
Sau khi hoàn thiện các phần backend và frontend:

1. Tạo backend/.env từ backend/.env.example và điền thông tin kết nối MongoDB Atlas.
2. Chạy backend bằng npm install và npm run dev trong thư mục backend.
3. Tạo frontend/.env từ frontend/.env.example. Khi chạy local, đặt VITE_API_BASE_URL=http://localhost:3000.
4. Chạy frontend bằng npm install và npm run dev trong thư mục frontend.

Khi triển khai frontend, cấu hình VITE_API_BASE_URL thành URL backend Render thực tế sau khi dịch vụ backend được tạo. Không thêm đường dẫn /api/devices vào giá trị này.

## MongoDB Atlas
- Database: 235304_NguyenMinhHao
- Collection: devices
- Tạo backend/.env từ backend/.env.example và điền URI Atlas.
- Không commit backend/.env hoặc thông tin xác thực.
