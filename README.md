# Hệ thống Quản lý Lịch công tác Đảng ủy Xã

Ứng dụng hiện đại dành cho công tác quản lý lịch hội họp, công tác và điều hành của Đảng ủy, HĐND, UBND cấp xã.

## 🚀 Tính năng chính
- **Quản lý lịch tập trung:** Thêm, sửa, xóa lịch công tác dễ dàng.
- **Phân quyền người dùng:** Admin, Văn phòng, Lãnh đạo và Chế độ chỉ xem.
- **Lịch tuần chuẩn hành chính:** Chế độ xem bảng biểu chuẩn nhà nước, hỗ trợ in ấn.
- **Thống kê thông minh:** Biểu đồ và số liệu tổng quan về các cuộc họp.
- **Responsive:** Hoạt động mượt mà trên cả máy tính và điện thoại di động.
- **Bảo mật:** Xác thực qua Firebase Auth và Rules bảo vệ dữ liệu.

## 🛠 Công nghệ sử dụng
- **Vite + React 19**
- **Tailwind CSS 4**
- **Firebase (Auth & Firestore)**
- **date-fns** (Xử lý thời gian)
- **Lucide React** (Icons)
- **Motion** (Animations)

## 📋 Hướng dẫn cài đặt local
1. Sao chép project này về máy.
2. Chạy lệnh: `npm install` để cài đặt dependencies.
3. Chạy lệnh: `npm run dev` để khởi động môi trường phát triển.
4. Mở trình duyệt tại: `http://localhost:3000`.

## 🌐 Triển khai (Deployment)
Ứng dụng có thể triển khai lên **Vercel**, **Netlify** hoặc **Firebase Hosting** hoàn toàn miễn phí.
1. Chạy `npm run build` để đóng gói ứng dụng.
2. Tải thư mục `dist` lên dịch vụ hosting bạn chọn.

## 🛡 Phân quyền mặc định
- **Admin:** Toàn quyền quản lý lịch, người dùng và cài đặt.
- **Văn phòng:** Soạn thảo lịch, quản lý lịch tuần.
- **Lãnh đạo:** Xem lịch, có quyền phê duyệt/sửa.
- **Chỉ xem:** Cán bộ công chức xem để nắm bắt kế hoạch.

---
*Phát triển bởi Google AI Studio Build - 2026*
