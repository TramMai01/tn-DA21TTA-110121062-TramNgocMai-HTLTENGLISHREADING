# 📚 Reading Practice System
## Hệ thống Luyện tập Đọc hiểu Tiếng Anh

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

> **Đồ án Tốt nghiệp - Khóa luận Tốt nghiệp**  
> **Sinh viên thực hiện**: Trầm Ngọc Mai  
> **MSSV**:  110121062 
> **Lớp**:  DA21TTA   
> **Khoa**:  CÔNG NGHỆ THÔNG TIN 

---

## 🎯 MỤC TIÊU ĐỒ ÁN

### Mục tiêu chính
Phát triển một **hệ thống web hoàn chỉnh** hỗ trợ việc luyện tập kỹ năng đọc hiểu tiếng Anh, cung cấp môi trường học tập tương tác với nhiều loại câu hỏi đa dạng và hệ thống quản lý nội dung mạnh mẽ.

### Mục tiêu cụ thể
- ✅ **Xây dựng platform học tập**: Tạo môi trường luyện tập đọc hiểu hiệu quả
- ✅ **Đa dạng hóa câu hỏi**: Hỗ trợ 5 loại câu hỏi khác nhau (Multiple Choice, Fill Blank, Matching, True/False/Not Given, Short Answer)
- ✅ **Tự động hóa chấm điểm**: Hệ thống chấm điểm thông minh với thang điểm IELTS chuẩn
- ✅ **Quản lý nội dung**: Admin panel để tạo và quản lý bài đọc, câu hỏi, bài kiểm tra
- ✅ **Theo dõi tiến độ**: Hệ thống thống kê và báo cáo chi tiết cho học viên và quản trị viên
- ✅ **Responsive design**: Giao diện thân thiện trên mọi thiết bị

### Đối tượng sử dụng
- **Học viên**: Sinh viên, người học tiếng Anh muốn cải thiện kỹ năng đọc hiểu
- **Giáo viên**: Tạo và quản lý nội dung, theo dõi tiến độ học viên
- **Tổ chức giáo dục**: Trung tâm anh ngữ, trường học cần công cụ đánh giá năng lực

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Kiến trúc tổng thể
Hệ thống được xây dựng theo mô hình **MVC (Model-View-Controller)** với kiến trúc **Client-Server** 3 tầng:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   User Portal   │  │  Admin Portal   │  │ Public Pages │ │
│  │   (EJS + CSS)   │  │   (EJS + CSS)   │  │  (EJS + CSS) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Auth Controller │  │ User Controller │  │Admin Control │ │
│  │                 │  │                 │  │              │ │
│  │ - Registration  │  │ - Take Tests    │  │- Manage Pass │ │
│  │ - Login/Logout  │  │ - View Results  │  │- Create Ques │ │
│  │ - Session Mgmt  │  │ - History       │  │- Create Tests│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  User Model     │  │  Test Models    │  │Content Models│ │
│  │                 │  │                 │  │              │ │
│  │ - User          │  │ - Test          │  │- ReadingPass │ │
│  │ - UserAttempt   │  │ - Question      │  │              │ │
│  │                 │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                         │
│                    MongoDB Database                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Collections: users, tests, questions, passages,        ││
│  │  userattempts, sessions                                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Kiến trúc kỹ thuật chi tiết

#### Backend Architecture
- **Framework**: Express.js (Node.js web framework)
- **Architecture Pattern**: MVC (Model-View-Controller)
- **Database ORM/ODM**: Mongoose (MongoDB Object Document Mapping)
- **Authentication**: Session-based với bcrypt password hashing
- **API Design**: RESTful APIs với JSON responses

#### Frontend Architecture
- **Template Engine**: EJS (Embedded JavaScript Templates)
- **CSS Framework**: Tailwind CSS 3.4+ với responsive design
- **JavaScript**: Vanilla ES6+ với modern browser APIs
- **Build System**: NPM scripts với Tailwind CLI

#### Database Architecture
- **Database Type**: NoSQL (MongoDB)
- **Data Modeling**: Document-based với embedded và referenced relationships
- **Indexing**: Optimized indexes cho performance
- **Session Store**: MongoDB-based session storage

---

## 💻 PHẦN MẦM CẦN THIẾT ĐỂ TRIỂN KHAI

### Yêu cầu hệ thống tối thiểu

#### Software Requirements

##### 1. Runtime Environment
```bash
# Node.js (JavaScript Runtime)
Version: 16.0+ (khuyến nghị 18.x LTS)
Download: https://nodejs.org/
Purpose: Chạy JavaScript server-side code

# NPM (Package Manager) 
Version: 8.0+ (đi kèm với Node.js)
Purpose: Quản lý dependencies và scripts
```

##### 2. Database System
```bash
# MongoDB (NoSQL Database)
Version: 5.0+ (khuyến nghị 6.0+)
Download: https://www.mongodb.com/try/download/community
Purpose: Lưu trữ dữ liệu ứng dụng

# MongoDB Compass (Optional - GUI Tool)
Purpose: Quản lý database qua giao diện đồ họa
```

##### 3. Development Tools
```bash
# Git (Version Control)
Purpose: Clone repository và version control
Download: https://git-scm.com/

# Text Editor/IDE (Khuyến nghị)
- Visual Studio Code: https://code.visualstudio.com/
- WebStorm: https://www.jetbrains.com/webstorm/
- Sublime Text: https://www.sublimetext.com/

# Web Browser (Modern browser)
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
```

### Dependencies chính (được cài tự động)

#### Backend Dependencies
```json
{
  "express": "^4.18.2",           // Web framework
  "mongoose": "^7.5.0",           // MongoDB ODM
  "ejs": "^3.1.9",                // Template engine
  "express-session": "^1.17.3",   // Session management
  "connect-mongo": "^5.0.0",      // MongoDB session store
  "bcrypt": "^5.1.1",             // Password hashing
  "express-ejs-layouts": "^2.5.1", // Layout engine
  "method-override": "^3.0.0",    // HTTP method override
  "dotenv": "^16.3.1",            // Environment variables
  "moment": "^2.29.4"             // Date manipulation
}
```

#### Frontend Dependencies
```json
{
  "tailwindcss": "^3.4.17",      // CSS framework
  "autoprefixer": "^10.4.15",    // CSS post-processing
  "postcss": "^8.4.28"           // CSS transformation
}
```

#### Development Dependencies
```json
{
  "nodemon": "^3.0.1"            // Development server với auto-restart
}
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI

### Cài đặt nhanh (Quick Setup)

```bash
# 1. Clone repository
git clone <repository-url>
cd reading-practice-system

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa file .env với thông tin database

# 4. Build CSS
npm run tailwind:build

# 5. Khởi chạy ứng dụng
npm run dev
```

### Cài đặt chi tiết
📖 **Xem hướng dẫn chi tiết trong file [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)**

---

## 🌟 TÍNH NĂNG CHÍNH

### Dành cho Học viên (Users)
- ✅ **Đăng ký/Đăng nhập**: Tài khoản cá nhân với xác thực bảo mật
- ✅ **Làm bài kiểm tra**: 5 loại câu hỏi đa dạng với timer tự động
- ✅ **Auto-save**: Tự động lưu câu trả lời mỗi 5 giây
- ✅ **Chấm điểm tức thì**: Kết quả chi tiết ngay sau khi nộp bài
- ✅ **Thang điểm IELTS**: Chuyển đổi điểm theo chuẩn IELTS Reading
- ✅ **Lịch sử làm bài**: Theo dõi tiến độ và xem lại các bài đã làm
- ✅ **Dashboard cá nhân**: Thống kê và bài test gợi ý

### Dành cho Quản trị viên (Admin)
- ✅ **Quản lý Reading Passages**: CRUD hoàn chỉnh với search và pagination
- ✅ **Tạo câu hỏi đa dạng**: 5 loại câu hỏi với validation thông minh
- ✅ **Quản lý bài kiểm tra**: Tổ chức câu hỏi thành bài test hoàn chỉnh
- ✅ **Thống kê chi tiết**: Dashboard với analytics và reports
- ✅ **Quản lý người dùng**: Xem thông tin và kết quả của học viên

---

## 📁 CẤU TRÚC DỰ ÁN

```
reading-practice-system/
├── 📁 app.js                    # Entry point chính của ứng dụng
├── 📁 bin/
│   └── www.js                   # Server startup script
├── 📁 config/                   # Cấu hình hệ thống
│   ├── database.js              # Cấu hình MongoDB
│   ├── routes.js                # Route configuration
│   ├── session.js               # Session management
│   └── view.js                  # View engine setup
├── 📁 controllers/              # Business Logic Layer (MVC)
│   ├── authController.js        # Xử lý đăng nhập/đăng ký
│   ├── userController.js        # Logic cho học viên
│   └── adminController.js       # Logic cho quản trị viên
├── 📁 middleware/               # Custom middleware
│   └── auth.js                  # Authentication middleware
├── 📁 models/                   # Data Models (MongoDB/Mongoose)
│   ├── User.js                  # Model người dùng
│   ├── ReadingPassage.js        # Model bài đọc
│   ├── Question.js              # Model câu hỏi (5 loại)
│   ├── Test.js                  # Model bài kiểm tra
│   └── UserAttempt.js           # Model kết quả làm bài
├── 📁 public/                   # Static Assets
│   ├── css/                     # CSS files (Tailwind compiled)
│   ├── js/                      # Client-side JavaScript
│   │   ├── admin/               # JS cho admin panel
│   │   └── user/                # JS cho user interface
│   └── images/                  # Image assets
├── 📁 routes/                   # Route Definitions
│   ├── auth.js                  # Routes xác thực
│   ├── user.js                  # Routes cho học viên
│   └── admin.js                 # Routes cho admin
├── 📁 views/                    # EJS Templates (Presentation Layer)
│   ├── layouts/                 # Layout templates
│   │   └── main.ejs             # Main layout
│   ├── auth/                    # Authentication views
│   │   ├── login.ejs            # Trang đăng nhập
│   │   └── register.ejs         # Trang đăng ký
│   ├── user/                    # User interface views
│   │   ├── dashboard.ejs        # Dashboard học viên
│   │   ├── test-attempt.ejs     # Trang làm bài
│   │   ├── test-result.ejs      # Trang kết quả
│   │   └── test-history.ejs     # Lịch sử làm bài
│   └── admin/                   # Admin interface views
│       ├── dashboard.ejs        # Dashboard admin
│       ├── passages/            # Quản lý bài đọc
│       ├── questions/           # Quản lý câu hỏi
│       ├── tests/               # Quản lý bài test
│     
├── 📁 scripts/                  # Utility scripts
│   ├── create-admin.js          # Tạo tài khoản admin
│   └── backup-db.js             # Backup database
├── 📄 package.json              # Dependencies và scripts
├── 📄 .env                      # Environment variables
├── 📄 tailwind.config.js        # Tailwind CSS config
├── 📄 README.md                 # Tài liệu này
└── 📄 SETUP_GUIDE.md            # Hướng dẫn cài đặt chi tiết
```

---

## 👥 PHÂN QUYỀN NGƯỜI DÙNG

### 🎓 Học viên (Regular Users)
- **Đăng ký tài khoản**: Tạo tài khoản cá nhân với email và mật khẩu
- **Làm bài kiểm tra**: Truy cập và hoàn thành các bài test có sẵn
- **Xem kết quả**: Chi tiết điểm số, đáp án đúng/sai cho từng câu
- **Theo dõi tiến độ**: Lịch sử làm bài và thống kê cá nhân
- **Dashboard**: Trang tổng quan với bài test gợi ý

### 👨‍💼 Quản trị viên (Administrators)
- **Quản lý nội dung**: CRUD hoàn chỉnh cho passages, questions, tests
- **Tạo bài kiểm tra**: Tổ chức câu hỏi thành bài test với cấu hình linh hoạt
- **Xem thống kê**: Analytics chi tiết về performance của học viên
- **Quản lý người dùng**: Xem thông tin và kết quả của tất cả học viên

---

## 📝 LOẠI CÂU HỎI ĐƯỢC HỖ TRỢ

### 1. 🔘 Multiple Choice (Trắc nghiệm)
- **Mô tả**: Câu hỏi với nhiều lựa chọn, chọn 1 hoặc nhiều đáp án đúng
- **Cấu hình**: Tối thiểu 2 options, hỗ trợ multiple correct answers
- **Chấm điểm**: Đúng hoàn toàn mới được điểm

### 2. ✏️ Fill in the Blank (Điền vào chỗ trống)
- **3 kiểu con**:
  - **Simple**: Điền từ/cụm từ tự do
  - **Multiple**: Chọn từ danh sách có sẵn để điền
  - **One Word Only**: Điền đúng 1 từ với giới hạn
- **Chấm điểm**: Tính theo tỷ lệ số chỗ trống điền đúng

### 3. 🔗 Matching (Nối thông tin)
- **Mô tả**: Nối headings với paragraphs hoặc thông tin tương ứng
- **Cấu hình**: Drag-and-drop hoặc dropdown selection
- **Chấm điểm**: Theo tỷ lệ số cặp nối đúng

### 4. ✅ True/False/Not Given
- **Mô tả**: Đánh giá tính đúng/sai của statement dựa trên passage
- **3 lựa chọn**: True, False, Not Given
- **Chấm điểm**: Chỉ đúng hoàn toàn mới được điểm

### 5. 📝 Short Answer (Trả lời ngắn)
- **Mô tả**: Trả lời bằng từ/cụm từ ngắn gọn
- **Cấu hình**: Giới hạn số từ, nhiều đáp án chấp nhận được
- **Chấm điểm**: So sánh với danh sách đáp án chuẩn

---

## 🎯 HỆ THỐNG KIỂM TRA

### Tổ chức nội dung
```
Reading Passage (Bài đọc)
    ↓
Questions (Câu hỏi - 5 loại)
    ↓  
Test (Bài kiểm tra - tập hợp passages + questions)

```

### Quy trình làm bài
1. **Chọn bài test** từ danh sách có sẵn
2. **Cấu hình thời gian** (mặc định/tùy chỉnh/không giới hạn)
3. **Làm bài** với auto-save mỗi 5 giây
4. **Nộp bài** tự động khi hết giờ hoặc thủ công
5. **Xem kết quả** chi tiết với điểm IELTS

### Hệ thống chấm điểm
- **Scoring Algorithm**: Thuật toán thông minh cho từng loại câu hỏi
- **IELTS Conversion**: Chuyển đổi sang thang điểm IELTS Reading chuẩn
- **Detailed Feedback**: Hiển thị đáp án đúng/sai cho từng câu
- **Progress Tracking**: Lưu lịch sử và thống kê tiến độ

---
