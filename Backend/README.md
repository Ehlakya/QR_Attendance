# QR Code Based Attendance Management System Backend

This is the backend for the QR Code Based Attendance Management System built with Node.js, Express, Sequelize, and MySQL.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Update the `.env` file with your MySQL credentials, JWT secret, and Google Client ID.

3. **Database Seeding**
   This will sync tables and create an initial Admin and some Departments.
   **Warning**: This will drop existing tables if run with `force: true`.
   ```bash
   npm run seed
   ```

4. **Run Server**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:5000`

## API Endpoints

All endpoints are prefixed with `/api/v1`

### Authentication (`/auth`)
* `POST /google` - Login via Google OAuth (Requires `idToken`)

### Departments (`/departments`)
* `POST /` - Create department (Admin)
* `GET /` - Get all departments (Authenticated)
* `PUT /:id` - Update department (Admin)
* `DELETE /:id` - Delete department (Admin)

### Sections (`/sections`)
* `POST /` - Create section (Admin, HOD)
* `GET /` - Get all sections (Authenticated)
* `PUT /:id` - Update section (Admin, HOD)
* `DELETE /:id` - Delete section (Admin, HOD)

### Teachers (`/teachers`)
* `POST /` - Create teacher (Admin, HOD)
* `GET /` - Get all teachers
* `GET /:id` - Get teacher details
* `PUT /:id` - Update teacher
* `DELETE /:id` - Delete teacher

### Students (`/students`)
* `POST /` - Register student (Admin, HOD)
* `GET /` - Get all students
* `GET /:id` - Get student details
* `PUT /:id` - Update student
* `DELETE /:id` - Delete student

### QR Code (`/qr`)
* `POST /generate` - Generate QR (Class/Subject Teacher, HOD, Admin)
* `GET /` - Get generated QRs by the logged-in teacher

### Attendance (`/attendance`)
* `POST /mark` - Student marks attendance by sending scanned QR ID
* `GET /history/:studentId` - Get attendance history for student
* `GET /daily` - Get daily attendance (query: `date`, `sectionId`)
* `GET /monthly` - Get monthly attendance (query: `year`, `month`, `studentId`)

### Notifications (`/notifications`)
* `POST /` - Send notification
* `GET /` - Get my notifications
* `PUT /:id/read` - Mark notification as read

### Dashboard (`/dashboard`)
* `GET /admin` - Admin stats
* `GET /hod` - HOD stats
* `GET /class-teacher` - Class Teacher stats
