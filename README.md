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

## Docker backend

Build image backend từ thư mục gốc của dự án:

~~~powershell
docker build -t mhaojr/backend ./backend
~~~

Chạy container local bằng cấu hình trong backend/.env. Tệp này chỉ tồn tại trên máy local và không được đưa vào image hoặc GitHub:

~~~powershell
docker run --rm --name backend-235304 -p 3000:3000 --env-file backend/.env mhaojr/backend
~~~

Kiểm tra http://localhost:3000/health. Khi chạy container hoặc triển khai, truyền MONGODB_URI, MONGODB_DB, PORT và CLIENT_ORIGIN qua biến môi trường. Không đặt URI MongoDB hoặc thông tin xác thực trong Dockerfile hay image.

Đẩy image lên Docker Hub sau khi đăng nhập tài khoản mhaojr:

~~~powershell
docker push mhaojr/backend
~~~

## Docker frontend

Build image frontend từ thư mục gốc của dự án:

~~~powershell
docker build -t mhaojr/frontend ./frontend
~~~

Chạy frontend container tại http://localhost:8080:

~~~powershell
docker run --rm --name frontend-235304 -p 8080:80 -e API_BASE_URL=http://localhost:3000 mhaojr/frontend
~~~

Trong môi trường triển khai, đặt API_BASE_URL thành URL backend Render thực tế, không thêm /api/devices. Cấu hình CLIENT_ORIGIN của backend thành URL frontend thực tế để bật CORS. Khi kiểm tra local trên cổng 8080, thêm http://localhost:8080 vào CLIENT_ORIGIN.

Đẩy image lên Docker Hub sau khi đăng nhập tài khoản mhaojr:

~~~powershell
docker push mhaojr/frontend
~~~

## MongoDB Atlas
- Database: 235304_NguyenMinhHao
- Collection: devices
- Tạo backend/.env từ backend/.env.example và điền URI Atlas.
- Không commit backend/.env hoặc thông tin xác thực.
