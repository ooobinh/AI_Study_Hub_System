# AI Study Hub — Work Board

> File theo dõi công việc + đối chiếu **Business Rules (BR-01 → BR-82)** với hệ thống hiện tại.

**Dự án:** AI Study Hub System  
**Cập nhật:** 2026-05-28

---

## Chú giải

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **P0** | Đã triển khai (baseline) |
| **P1** | Giai đoạn 1 — Core (trừ Workspace / Forum / Chat hoàn thiện) |
| **P2** | Giai đoạn 2 — Workspace + Forum + Chatbot |
| **BR ✅** | Business rule đã đáp ứng đủ |
| **BR ⚠️** | Đáp ứng một phần |
| **BR ❌** | Chưa đáp ứng |
| **Done** | Task hoàn thành |
| **Partial** | Có MVP, chưa đủ BR |
| **Todo** | Chưa làm |

**Team**

| Thành viên | MSSV | Vai trò |
|------------|------|---------|
| Nguyễn Minh Thái | SE180311 | Team Leader / Backend |
| Nguyễn Trọng Bình | SE192184 | Frontend |
| Nguyễn Tấn Phát | SE193107 | Backend |
| Nguyễn Thanh Trúc | SE190755 | Backend |

---

## Mục tiêu 2 giai đoạn

| Giai đoạn | Phạm vi | Demo mục tiêu |
|-----------|---------|----------------|
| **P1 — Core** | Auth, Documents, Subjects, Notifications, Admin, Feedback, Analytics | Upload → sửa/xóa tài liệu → môn học → admin duyệt |
| **P2 — Social + AI** | Workspace, Forum, Chatbot (CRUD + bảo mật AI) | Học nhóm + forum + chat AI |

---

## Tổng quan BR (82 rules)

| Trạng thái BR | Số lượng |
|---------------|----------|
| ✅ Đã đáp ứng | 28 |
| ⚠️ Một phần | 18 |
| ❌ Chưa đáp ứng | 36 |

---

## 1. Bảng Business Rules chuẩn (BR-01 → BR-82)

### 1.1 Authentication & Authorization

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-01 | Đăng ký trước khi dùng chức năng cá nhân hóa | ✅ | T-D01, T-D02 |
| BR-02 | Mỗi email chỉ một tài khoản | ✅ | T-D01 |
| BR-03 | Mật khẩu tối thiểu 8 ký tự | ❌ | T-010 |
| BR-04 | Mật khẩu có chữ + số | ❌ | T-010 |
| BR-05 | Xác thực email trước login lần đầu | ❌ | T-011 |
| BR-06 | Từ chối login sai email/mật khẩu | ✅ | T-D03 |
| BR-07 | Khóa sau 5 lần login sai liên tiếp | ❌ | T-012 |
| BR-08 | Chỉ Admin khóa/mở khóa tài khoản | ✅ | T-D15 |
| BR-09 | Guest chỉ xem nội dung công khai | ❌ | T-015 |
| BR-10 | User phải login để upload | ✅ | T-D02, T-D10 |
| BR-11 | Admin truy cập toàn bộ tài liệu | ✅ | T-D15 |
| BR-12 | Chỉ sửa hồ sơ của chính mình | ⚠️ | T-D04 (avatar); T-016, T-017 |
| BR-13 | Phiên hết hạn khi không hoạt động | ❌ | T-013 |
| BR-14 | Đăng nhập lại sau đổi mật khẩu | ❌ | T-014 |
| BR-15 | Ghi log đăng nhập thất bại | ❌ | T-012 |

### 1.2 User Profile

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-16 | Cập nhật ảnh đại diện | ✅ | T-D04 |
| BR-17 | Tên hiển thị ≤ 50 ký tự | ❌ | T-017 |
| BR-18 | Chặn ký tự độc hại trong profile | ❌ | T-017 |
| BR-19 | Xem lịch sử hoạt động bản thân | ❌ | T-018 |
| BR-20 | Email không đổi sau xác thực | ⚠️ | Không có API đổi email; thiếu BR-05 |

### 1.3 Document Upload

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-21 | Chỉ PDF, DOCX, PPTX | ❌ | T-019 |
| BR-22 | Giới hạn kích thước file | ⚠️ | T-D05 (avatar 5MB); T-020 |
| BR-23 | Quét malware trước lưu | ❌ | — |
| BR-24 | Bắt buộc tiêu đề khi upload | ❌ | T-021 |
| BR-25 | Thuộc ≥ 1 môn/category | ❌ | T-021 |
| BR-26 | Lưu thời gian upload | ✅ | T-D10 |
| BR-27 | Tên file không ký tự không hợp lệ | ✅ | T-D10 |
| BR-28 | Từ chối file hỏng | ⚠️ | T-D10 |
| BR-29 | Upload khi còn dung lượng | ❌ | T-023 |
| BR-30 | Trạng thái upload real-time | ⚠️ | T-D10 (loading); T-022 |

### 1.4 Document Management

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-31 | Chủ sở hữu sửa metadata | ✅ | T-D11 |
| BR-32 | Chỉ owner/Admin xóa | ✅ | T-D11 |
| BR-33 | Lưu lịch sử chỉnh sửa | ❌ | T-026 |
| BR-34 | Tải xuống khi có quyền | ✅ | T-D11, T-D12 |
| BR-35 | Chặn tải tài liệu đã xóa | ⚠️ | T-024 |
| BR-36 | Xóa → thùng rác trước xóa vĩnh viễn | ⚠️ | T-D11 (soft delete); T-025 |
| BR-37 | Admin khôi phục tài liệu | ⚠️ | T-D15; T-025 |
| BR-38 | Tự động preview | ✅ | T-D12 |
| BR-39 | Lọc theo môn học | ✅ | T-D11 |
| BR-40 | Sắp xếp theo ngày/tên | ⚠️ | T-D11 (ngày); T-027 |

### 1.5 Search & Filter

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-41 | Tìm theo tên tài liệu | ✅ | T-D11 |
| BR-42 | Tìm gần đúng (partial) | ✅ | T-D11 |
| BR-43 | Tìm theo tag/category | ❌ | T-028 |
| BR-44 | Ưu tiên kết quả liên quan | ❌ | — |
| BR-45 | Thông báo không có kết quả | ⚠️ | T-D11 (empty UI) |
| BR-46 | Lọc theo người upload | ❌ | T-030 |
| BR-47 | Phân trang kết quả | ❌ | T-029 |
| BR-48 | Lưu lịch sử tìm kiếm | ❌ | T-031 |

### 1.6 Cloud Storage

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-49 | Lưu trên cloud sau upload | ✅ | T-D10 |
| BR-50 | Mã hóa khi truyền tải | ⚠️ | HTTPS deploy |
| BR-51 | Backup định kỳ | ❌ | — |
| BR-52 | Chỉ truy cập file có quyền | ✅ | T-D11, T-D12 |
| BR-53 | Kiểm tra trạng thái upload trước preview | ⚠️ | T-D10 |
| BR-54 | Upload fail không lưu metadata | ⚠️ | T-D10 |
| BR-55 | Đồng bộ metadata với cloud | ⚠️ | T-D10 |

### 1.7 AI Chatbot

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-56 | Chỉ truy xuất tài liệu có quyền | ❌ | T-054 |
| BR-57 | Trả lời dựa trên dữ liệu tài liệu | ⚠️ | T-D20 |
| BR-58 | Lưu lịch sử chat | ✅ | T-D20 |
| BR-59 | Xem lại lịch sử chat | ✅ | T-D20 |
| BR-60 | Thông báo khi không tìm thấy | ⚠️ | T-D20 |
| BR-61 | Ghi nhận thời gian câu hỏi | ✅ | T-D20 |
| BR-62 | Giới hạn độ dài câu hỏi | ❌ | T-055 |
| BR-63 | Phải login để dùng chatbot | ✅ | T-D20 |
| BR-64 | Không trả nội dung ngoài phạm vi | ⚠️ | T-D20; T-054 |
| BR-65 | Ghi log lỗi AI service | ❌ | T-055 |

### 1.8 Administration

| BR | Nội dung rule | Trạng thái | Task liên quan |
|----|---------------|------------|----------------|
| BR-66 | Chỉ Admin vào trang quản trị | ✅ | T-D15 |
| BR-67 | Xem danh sách user | ✅ | T-D15 |
| BR-68 | Khóa/mở khóa user | ✅ | T-D15 |
| BR-69 | Admin xóa tài liệu vi phạm | ⚠️ | T-D15 (đổi status) |
| BR-70 | Quản lý category/môn học | ⚠️ | T-D13 (tạo); T-032, T-033 |
| BR-71 | Cấu hình giới hạn upload | ❌ | T-037 |
| BR-72 | Log thao tác Admin | ❌ | T-036 |
| BR-73 | Thống kê user/tài liệu | ✅ | T-D16; T-035 |
| BR-74 | Xem lịch sử hoạt động user | ❌ | T-018 |
| BR-75 | Admin không xem mật khẩu | ✅ | T-D15 |
| BR-76 | Phân quyền Guest/User/Admin | ⚠️ | T-D01; T-015 |
| BR-77 | Tìm user theo email/tên | ✅ | T-D15 |
| BR-78 | Lọc tài liệu theo status/category | ⚠️ | T-D15 |
| BR-79 | Gửi thông báo cho user | ✅ | T-D14, T-D15 |
| BR-80 | Chỉ Admin tạo tài khoản Admin | ❌ | T-038 |
| BR-81 | Admin xác thực lại mật khẩu | ❌ | T-039 |
| BR-82 | Danh sách tài liệu bị báo cáo | ⚠️ | T-D15 (reports); T-045 |

---

## 2. Task đã hoàn thành (Done)

### 2.1 Auth & User

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D01 | Auth | Đăng ký tài khoản (email unique) | BR-01, 02 | ✅ | ✅ | Done |
| T-D02 | Auth | Đăng nhập email/password | BR-01, 06, 10 | ✅ | ✅ | Done |
| T-D03 | Auth | Từ chối credential sai | BR-06 | ✅ | ✅ | Done |
| T-D04 | Auth | Google OAuth login | BR-01, 06 | ✅ | ✅ | Done |
| T-D05 | Auth | Quên mật khẩu + reset qua email | — | ✅ | ✅ | Done |
| T-D06 | Auth | Lấy thông tin user theo ID | — | ✅ | ✅ | Done |
| T-D07 | Auth | Upload / xóa avatar | BR-16 | ✅ | ✅ | Done |
| T-D08 | Auth | Session lưu localStorage (dev token) | — | ✅ | ✅ | Done |
| T-D09 | Auth | Dashboard bắt buộc login | BR-01, 10 | — | ✅ | Done |

### 2.2 Documents & Upload

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D10 | Upload | Upload file (Supabase / local fallback) | BR-26, 27, 49 | ✅ | ✅ | Done |
| T-D11 | Documents | List / detail / create / update / delete (soft) | BR-31, 32, 34, 39, 41, 42 | ✅ | ✅ | Done |
| T-D12 | Documents | Preview, download, shared link | BR-34, 38, 52 | ✅ | ✅ | Done |
| T-D13 | Documents | Favorite / view count / download count | — | ✅ | ✅ | Done |
| T-D14 | Documents | Share token (VIEW permission) | BR-52 | ✅ | ✅ | Done |
| T-D15 | Documents | Lọc theo subject + search keyword | BR-39, 41, 42 | ✅ | ✅ | Done |
| T-D16 | Documents | AI xử lý metadata + tags sau upload | — | ✅ | — | Done |

### 2.3 Subjects

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D17 | Subjects | List / detail / tạo môn học | BR-70 (một phần) | ✅ | ✅ | Done |
| T-D18 | Subjects | Gán document vào subject (qua update doc) | BR-25 (một phần) | ✅ | ✅ | Done |

### 2.4 Notifications & Feedback

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D19 | Notifications | List notification theo user | — | ✅ | ✅ | Done |
| T-D20 | Notifications | Mark read / mark all read | — | ✅ | ✅ | Done |
| T-D21 | Feedback | Gửi feedback từ UI | — | ✅ | ✅ | Done |

### 2.5 Admin & Analytics

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D22 | Admin | Trang admin (role check) | BR-66 | — | ✅ | Done |
| T-D23 | Admin | List users + search client-side | BR-67, 77 | ✅ | ✅ | Done |
| T-D24 | Admin | Khóa/mở user (status) | BR-08, 68 | ✅ | ✅ | Done |
| T-D25 | Admin | Xóa user | — | ✅ | ✅ | Done |
| T-D26 | Admin | Duyệt tài liệu pending + đổi status | BR-69, 78 | ✅ | ✅ | Done |
| T-D27 | Admin | Xử lý reports | BR-82 (một phần) | ✅ | ✅ | Done |
| T-D28 | Admin | Gửi notification hệ thống | BR-79 | ✅ | ✅ | Done |
| T-D29 | Analytics | API dashboard summary | BR-73 | ✅ | — | Done |
| T-D30 | Analytics | Trang analytics UI | BR-73 | — | ⚠️ mock | Partial |

### 2.6 Forum (MVP — chưa đủ BR)

| ID | Module | Task chi tiết | BR | BE | FE | Trạng thái |
|----|--------|---------------|-----|----|----|------------|
| T-D31 | Forum | List / search / filter post | — | ✅ | ✅ | Done |
| T-D32 | Forum | Chi tiết post + answers | — | ✅ | ✅ | Done |
| T-D33 | Forum | Tạo post text | — | ✅ | ✅ | Done |
| T-D34 | Forum | Upload post kèm document + AI | — | ✅ | ✅ | Done |
| T-D35 | Forum | Trả lời post | — | ✅ | ✅ | Done |
| T-D36 | Forum | Rankings + presence active users | — | ✅ | ✅ | Done |

### 2.7 Workspace (MVP — chưa đủ BR)

| ID | Module | Task chi tiết | BR | BE | FE | Trạng thái |
|----|--------|---------------|-----|----|----|------------|
| T-D37 | Workspace | CRUD workspace + join + invite accept | — | ✅ | ✅ | Done |
| T-D38 | Workspace | Members: invite / role / remove / leave | — | ✅ | ✅ | Done |
| T-D39 | Workspace | Upload document vào workspace | — | ✅ | ✅ | Done |
| T-D40 | Workspace | Tasks create + update status | — | ✅ | ✅ | Done |
| T-D41 | Workspace | Posts + comments + pin | — | ✅ | ✅ | Done |
| T-D42 | Workspace | AI summary / quiz / flashcard trong WS | — | ✅ | ✅ | Done |
| T-D43 | Workspace | Quiz attempt + flashcard progress | — | ✅ | ✅ | Done |
| T-D44 | Workspace | Activity log trong workspace detail | — | ✅ | ✅ | Done |

### 2.8 Chatbot (MVP — chưa đủ BR)

| ID | Module | Task chi tiết | BR đáp ứng | BE | FE | Trạng thái |
|----|--------|---------------|------------|----|----|------------|
| T-D45 | Chat | List / tạo session | BR-58, 63 | ✅ | ✅ | Done |
| T-D46 | Chat | Lịch sử message | BR-59, 61 | ✅ | ✅ | Done |
| T-D47 | Chat | Gửi tin + hỏi AI (Gemini) | BR-57, 60, 64 (một phần) | ✅ | ✅ | Done |
| T-D48 | Chat | Floating assistant UI | — | — | ✅ | Done |

### 2.9 UI / Hạ tầng

| ID | Module | Task chi tiết | BR | BE | FE | Trạng thái |
|----|--------|---------------|-----|----|----|------------|
| T-D49 | UI | Landing page | — | — | ✅ | Done |
| T-D50 | UI | Dashboard layout + sidebar + i18n | — | — | ✅ | Done |
| T-D51 | UI | Dark/light theme (settings) | — | — | ✅ | Done |
| T-D52 | DB | SQL Server schema + migrations | — | ✅ | — | Done |

---

## 3. Bảng task tổng hợp (Done + Todo + Business Rules)

> **Cột BR:** `✅` = đã đáp ứng · `⚠️` = một phần · `(cần)` = task Todo phải hoàn thành để đạt BR.

### 3.1 P0 — Đã hoàn thành

| ID | Phase | Module | Task | BR (chuẩn) | Owner | Ưu tiên | Trạng thái |
|----|-------|--------|------|------------|-------|---------|------------|
| T-D01 | P0 | Auth | Đăng ký tài khoản (email unique) | BR-01✅, BR-02✅ | Thái (BE), Bình (FE) | — | Done |
| T-D02 | P0 | Auth | Đăng nhập email/password | BR-01✅, BR-06✅, BR-10✅ | Thái (BE), Bình (FE) | — | Done |
| T-D03 | P0 | Auth | Từ chối credential sai | BR-06✅ | Thái | — | Done |
| T-D04 | P0 | Auth | Google OAuth login | BR-01✅, BR-06✅ | Thái (BE), Bình (FE) | — | Done |
| T-D05 | P0 | Auth | Quên mật khẩu + reset email | — | Thái (BE), Bình (FE) | — | Done |
| T-D06 | P0 | Auth | API lấy thông tin user | — | Thái | — | Done |
| T-D07 | P0 | Auth | Upload / xóa avatar | BR-16✅ | Thái (BE), Bình (FE) | — | Done |
| T-D08 | P0 | Auth | Session localStorage (dev token) | — | Bình | — | Done |
| T-D09 | P0 | Auth | Dashboard bắt buộc đăng nhập | BR-01✅, BR-10✅ | Bình | — | Done |
| T-D10 | P0 | Upload | Upload file Supabase / local | BR-26✅, BR-27✅, BR-49✅ | Phát (BE), Bình (FE) | — | Done |
| T-D11 | P0 | Documents | CRUD tài liệu + soft delete | BR-31✅, BR-32✅, BR-39✅, BR-41✅, BR-42✅ | Phát (BE), Bình (FE) | — | Done |
| T-D12 | P0 | Documents | Preview / download / share link | BR-34✅, BR-38✅, BR-52✅ | Phát (BE), Bình (FE) | — | Done |
| T-D13 | P0 | Documents | Favorite / view / download count | — | Phát, Bình | — | Done |
| T-D14 | P0 | Documents | Share token (VIEW) | BR-52✅ | Phát, Bình | — | Done |
| T-D15 | P0 | Documents | Search + lọc theo subject | BR-39✅, BR-41✅, BR-42✅ | Phát, Bình | — | Done |
| T-D16 | P0 | Documents | AI metadata + tags sau upload | — | Phát | — | Done |
| T-D17 | P0 | Subjects | List / detail / tạo môn học | BR-70⚠️ | Phát (BE), Bình (FE) | — | Done |
| T-D18 | P0 | Subjects | Gán document vào subject | BR-25⚠️ | Phát, Bình | — | Done |
| T-D19 | P0 | Notifications | List notification | — | Trúc (BE), Bình (FE) | — | Done |
| T-D20 | P0 | Notifications | Mark read / read all | — | Trúc, Bình | — | Done |
| T-D21 | P0 | Feedback | Gửi feedback | — | Trúc (BE), Bình (FE) | — | Done |
| T-D22 | P0 | Admin | Trang admin + role check | BR-66✅ | Bình (FE), Trúc (BE) | — | Done |
| T-D23 | P0 | Admin | List users + search | BR-67✅, BR-77✅ | Trúc (BE), Bình (FE) | — | Done |
| T-D24 | P0 | Admin | Khóa/mở user (status) | BR-08✅, BR-68✅ | Trúc, Bình | — | Done |
| T-D25 | P0 | Admin | Xóa user | — | Trúc, Bình | — | Done |
| T-D26 | P0 | Admin | Duyệt tài liệu + đổi status | BR-69⚠️, BR-78⚠️ | Trúc, Bình | — | Done |
| T-D27 | P0 | Admin | Xử lý reports | BR-82⚠️ | Trúc, Bình | — | Done |
| T-D28 | P0 | Admin | Gửi notification hệ thống | BR-79✅ | Trúc, Bình | — | Done |
| T-D29 | P0 | Analytics | API dashboard summary | BR-73✅ | Trúc | — | Done |
| T-D30 | P0 | Analytics | Trang analytics UI | BR-73⚠️ | Bình | — | Partial |
| T-D31 | P0 | Forum | List / search / filter post | — | Trúc (BE), Bình (FE) | — | Done |
| T-D32 | P0 | Forum | Chi tiết post + answers | — | Trúc, Bình | — | Done |
| T-D33 | P0 | Forum | Tạo post text | — | Trúc, Bình | — | Done |
| T-D34 | P0 | Forum | Upload post + document + AI | — | Trúc, Bình | — | Done |
| T-D35 | P0 | Forum | Trả lời post | — | Trúc, Bình | — | Done |
| T-D36 | P0 | Forum | Rankings + presence | — | Trúc, Bình | — | Done |
| T-D37 | P0 | Workspace | CRUD workspace + join + invite | — | Thái (BE), Bình (FE) | — | Done |
| T-D38 | P0 | Workspace | Members: invite / role / remove | — | Thái, Bình | — | Done |
| T-D39 | P0 | Workspace | Upload document vào workspace | — | Phát, Bình | — | Done |
| T-D40 | P0 | Workspace | Tasks create + update status | — | Phát, Bình | — | Done |
| T-D41 | P0 | Workspace | Posts + comments + pin | — | Phát, Bình | — | Done |
| T-D42 | P0 | Workspace | AI summary / quiz / flashcard | — | Thái, Bình | — | Done |
| T-D43 | P0 | Workspace | Quiz attempt + flashcard progress | — | Phát, Bình | — | Done |
| T-D44 | P0 | Workspace | Activity log trong workspace | — | Thái | — | Done |
| T-D45 | P0 | Chat | List / tạo session | BR-58✅, BR-63✅ | Trúc (BE), Bình (FE) | — | Done |
| T-D46 | P0 | Chat | Lịch sử message | BR-59✅, BR-61✅ | Trúc, Bình | — | Done |
| T-D47 | P0 | Chat | Gửi tin + hỏi AI (Gemini) | BR-57⚠️, BR-60⚠️, BR-64⚠️ | Trúc, Bình | — | Done |
| T-D48 | P0 | Chat | Floating assistant UI | — | Bình | — | Done |
| T-D49 | P0 | UI | Landing page | — | Bình | — | Done |
| T-D50 | P0 | UI | Dashboard layout + sidebar + i18n | — | Bình | — | Done |
| T-D51 | P0 | UI | Dark/light theme | — | Bình | — | Done |
| T-D52 | P0 | DB | SQL Server schema + migrations | — | Thái | — | Done |

### 3.2 P1 — Core (cần hoàn thiện)

| ID | Phase | Module | Task | BR (chuẩn) | Owner | Ưu tiên | Trạng thái |
|----|-------|--------|------|------------|-------|---------|------------|
| T-010 | P1 | Auth | Validate mật khẩu min 8 + chữ + số (BE + FE) | BR-03 (cần), BR-04 (cần) | Thái (BE), Bình (FE) | Cao | Todo |
| T-011 | P1 | Auth | Email verification trước login | BR-05 (cần) | Thái | Cao | Todo |
| T-012 | P1 | Auth | Lock 5 lần login sai + log fail | BR-07 (cần), BR-15 (cần) | Thái | Cao | Todo |
| T-013 | P1 | Auth | JWT thật + session idle timeout | BR-13 (cần) | Thái | Cao | Todo |
| T-014 | P1 | Auth | Invalidate session sau đổi MK | BR-14 (cần) | Thái | TB | Todo |
| T-015 | P1 | Auth | Luồng Guest — xem nội dung public | BR-09 (cần), BR-76 (cần) | Bình (FE), Thái (BE) | TB | Todo |
| T-016 | P1 | Profile | API `PATCH` update profile | BR-12 (cần), BR-17 (cần), BR-18 (cần) | Thái | Cao | Todo |
| T-017 | P1 | Profile | FE Settings nối API profile | BR-12 (cần), BR-17 (cần), BR-18 (cần) | Bình | Cao | Todo |
| T-018 | P1 | Profile | Lịch sử hoạt động user (API + UI) | BR-19 (cần), BR-74 (cần) | Trúc (BE), Bình (FE) | Thấp | Todo |
| T-019 | P1 | Upload | Chỉ PDF / DOCX / PPTX | BR-21 (cần) | Phát | Cao | Todo |
| T-020 | P1 | Upload | Giới hạn kích thước file | BR-22 (cần), BR-71 (cần) | Phát | Cao | Todo |
| T-021 | P1 | Upload | Bắt buộc title + subject khi upload | BR-24 (cần), BR-25 (cần) | Phát (BE), Bình (FE) | Cao | Todo |
| T-022 | P1 | Upload | Progress upload UI (%) | BR-30 (cần) | Bình | TB | Todo |
| T-023 | P1 | Upload | Quota dung lượng user | BR-29 (cần) | Phát | TB | Todo |
| T-024 | P1 | Documents | Chặn truy cập file `DELETED` | BR-35 (cần) | Phát | Cao | Todo |
| T-025 | P1 | Documents | Thùng rác + khôi phục tài liệu | BR-36 (cần), BR-37 (cần) | Phát (BE), Bình (FE) | Cao | Todo |
| T-026 | P1 | Documents | Audit lịch sử sửa metadata | BR-33 (cần) | Trúc | TB | Todo |
| T-027 | P1 | Documents | Sort theo tên / ngày | BR-40 (cần) | Bình | Thấp | Todo |
| T-028 | P1 | Search | Tìm theo tag + category | BR-43 (cần) | Trúc | TB | Todo |
| T-029 | P1 | Search | Phân trang kết quả | BR-47 (cần) | Trúc | TB | Todo |
| T-030 | P1 | Search | Lọc theo người upload | BR-46 (cần) | Trúc (BE), Bình (FE) | Thấp | Todo |
| T-031 | P1 | Search | Lưu lịch sử tìm kiếm | BR-48 (cần) | Trúc | Thấp | Todo |
| T-032 | P1 | Subjects | API update + delete subject | BR-70 (cần) | Phát | Cao | Todo |
| T-033 | P1 | Subjects | FE sửa / xóa môn học | BR-70 (cần) | Bình | Cao | Todo |
| T-034 | P1 | Feedback | Admin list + resolve feedback | — | Trúc | TB | Todo |
| T-035 | P1 | Analytics | FE dùng API thật (bỏ mock) | BR-73 (cần) | Bình | TB | Todo |
| T-036 | P1 | Admin | Admin audit log | BR-72 (cần) | Trúc | TB | Todo |
| T-037 | P1 | Admin | Cấu hình loại file / max size | BR-71 (cần) | Trúc (BE), Thái (BE) | TB | Todo |
| T-038 | P1 | Admin | API tạo tài khoản Admin | BR-80 (cần) | Thái | Thấp | Todo |
| T-039 | P1 | Admin | Re-auth mật khẩu thao tác nhạy cảm | BR-81 (cần) | Thái | Thấp | Todo |
| T-040 | P1 | UI | Nhãn Beta: Workspace / Forum / Chat | — | Bình | Cao | Todo |
| T-041 | P1 | QA | Test E2E core (auth → doc → admin) | — | Cả team | Cao | Todo |

### 3.3 P2 — Workspace / Forum / Chat

| ID | Phase | Module | Task | BR (chuẩn) | Owner | Ưu tiên | Trạng thái |
|----|-------|--------|------|------------|-------|---------|------------|
| T-042 | P2 | Forum | API update + delete post | — | Trúc | Cao | Todo |
| T-043 | P2 | Forum | API update + delete answer | — | Trúc | Cao | Todo |
| T-044 | P2 | Forum | FE edit / delete post & answer | — | Bình | Cao | Todo |
| T-045 | P2 | Forum | Report post → admin reports | BR-82 (cần) | Trúc (BE), Bình (FE) | TB | Todo |
| T-046 | P2 | Workspace | Messages CRUD + FE gửi message | — | Thái (BE), Bình (FE) | Cao | Todo |
| T-047 | P2 | Workspace | Tasks list + delete | — | Phát | Cao | Todo |
| T-048 | P2 | Workspace | Posts / Comments update + delete | — | Phát | Cao | Todo |
| T-049 | P2 | Workspace | Gỡ document khỏi workspace | — | Phát | Cao | Todo |
| T-050 | P2 | Workspace | Invitations list pending + revoke | — | Thái | TB | Todo |
| T-051 | P2 | Workspace | FE hoàn thiện CRUD workspace | — | Bình | Cao | Todo |
| T-052 | P2 | Chat | API rename / delete session + clear history | — | Trúc | Cao | Todo |
| T-053 | P2 | Chat | FE quản lý session (đổi tên, xóa) | — | Bình | Cao | Todo |
| T-054 | P2 | Chat | Kiểm tra quyền document trước AI | BR-56 (cần), BR-64 (cần) | Trúc | Cao | Todo |
| T-055 | P2 | Chat | Giới hạn độ dài câu hỏi + log lỗi AI | BR-62 (cần), BR-65 (cần) | Trúc | TB | Todo |
| T-056 | P2 | QA | Test E2E workspace + forum + chat | — | Cả team | Cao | Todo |
| T-057 | P2 | Docs | Cập nhật README + Postman | — | Thái | TB | Todo |

*TB = Trung bình · Owner ghi `(BE)` / `(FE)` khi task cần phối hợp*

---

## 4. Thống kê & phân công team

### 4.1 Thống kê task

| Loại | Số lượng |
|------|----------|
| Done (P0) | 51 |
| Partial | 1 (T-D30) |
| Todo P1 | 32 |
| Todo P2 | 16 |
| **Tổng task** | **100** |
| **BR ✅ / ⚠️ / ❌** | **28 / 18 / 36** (trên 82 BR) |

### 4.2 Phân công theo thành viên (cân bằng)

#### Nguyễn Minh Thái — Team Leader / Backend

| Vai trò | Task |
|---------|------|
| **Đã hoàn thành** | T-D01→D09, T-D37, T-D38, T-D42, T-D44, T-D52 |
| **P1 — Auth & Admin** | T-010→T-014, T-016, T-037 (BE), T-038, T-039, T-015 (BE) |
| **P2 — Workspace** | T-046 (BE), T-050, T-057 |
| **Tổng** | ~22 task (12 Done + 10 Todo) |

#### Nguyễn Tấn Phát — Backend

| Vai trò | Task |
|---------|------|
| **Đã hoàn thành** | T-D10→D18, T-D39→D41, T-D43 |
| **P1 — Documents & Upload** | T-019→T-025, T-032 |
| **P2 — Workspace** | T-047, T-048, T-049 |
| **Tổng** | ~24 task (14 Done + 10 Todo) |

#### Nguyễn Thanh Trúc — Backend

| Vai trò | Task |
|---------|------|
| **Đã hoàn thành** | T-D19→D21, T-D29, T-D31→D36, T-D45→D47 |
| **P1 — Search & Admin** | T-018 (BE), T-026, T-028→T-031, T-034, T-036, T-037 (BE) |
| **P2 — Forum & Chat** | T-042, T-043, T-045 (BE), T-052, T-054, T-055 |
| **Tổng** | ~28 task (16 Done + 12 Todo) |

#### Nguyễn Trọng Bình — Frontend

| Vai trò | Task |
|---------|------|
| **Đã hoàn thành** | T-D01→D02, D04→D05, D07→D09, D10→D15, D17→D18, D19→D20, D21, D22→D28, D30→D51 (toàn bộ UI/FE) |
| **P1 — FE Core** | T-010 (FE), T-015 (FE), T-017, T-018 (FE), T-021 (FE), T-022, T-025 (FE), T-027, T-033, T-035, T-040, T-041 |
| **P2 — FE Social** | T-044, T-045 (FE), T-046 (FE), T-051, T-053, T-056 |
| **Tổng** | ~45 task (30 Done + 15 Todo) — *chủ lực giao diện* |

### 4.3 Ma trận phối hợp BE ↔ FE (task quan trọng)

| Task | Backend | Frontend |
|------|---------|----------|
| T-010 | Thái: validation API | Bình: form register/login |
| T-016, T-017 | Thái: PATCH profile | Bình: Settings page |
| T-021 | Phát: validate upload | Bình: form upload |
| T-025 | Phát: trash API | Bình: UI thùng rác |
| T-033 | Phát: subjects API | Bình: subjects page |
| T-046 | Thái: messages API | Bình: tab chat workspace |
| T-054 | Trúc: check quyền AI | Bình: chat document picker |

---

## 5. Sprint gợi ý (theo BR)

| Sprint | Task | Owner chính | Mục tiêu BR thêm |
|--------|------|-------------|------------------|
| Sprint 1 | T-010→T-017, T-019→T-021, T-024, T-032, T-033, T-040 | Thái, Phát, Bình | BR-03, 04, 05, 12, 21, 24, 25, 35, 70 |
| Sprint 2 | T-022→T-031, T-025→T-037, T-034, T-035, T-041 | Phát, Trúc, Bình | BR-29, 30, 33, 36, 37, 40, 43, 47, 72, 73 |
| Sprint 3 | T-042→T-051 | Trúc, Phát, Thái, Bình | Forum + Workspace CRUD đầy đủ |
| Sprint 4 | T-052→T-057 | Trúc, Bình, Thái | BR-56, 62, 64, 65 + demo |

---

## 6. Definition of Done

- [ ] API validation + phân quyền (BE)
- [ ] UI + thông báo lỗi/thành công (FE)
- [ ] BR liên quan chuyển ✅ hoặc ⚠️ → ✅
- [ ] Test Postman / E2E
- [ ] Cập nhật bảng BR + task trong file này

---

## 7. Ghi chú cập nhật

| Ngày | Người | Nội dung |
|------|-------|----------|
| 2026-05-28 | — | Tạo work board |
| 2026-05-28 | — | Thêm task Done (T-D01→D52) + bảng BR-01→BR-82 |
| 2026-05-28 | — | Gộp bảng Done + Todo + BR; phân công lại 4 thành viên |

---

## Liên kết

- [README.md](../README.md)
- `backend/src/main/java/com/aistudyhub/controller/`
- `frontend/app/(dashboard)/`
