# Non-Academic Scholar Application Management System (NASAM)
 
NASAM is a web-based information system developed to digitize the application process for Non-Academic Scholarships (NAS) at Cebu Institute of Technology – University (CIT-U).
 
---
 
## Developers
 
- **Cutab, John Rey D.**
- **Paquera, Ronan Jake C.**
- **Clabisellas, Genesis T.**
- **Vijar, Justin Carl S.**
- **Paquit, Asher Caleb N.**
 
---
 
## Tech Stack
 
### Backend
 
| Technology | Version | Description |
|------------|---------|-------------|
| Node.js | v18+ (LTS) | JavaScript runtime |
| Express.js | 5.1.0 | Web application framework |
| MongoDB | Atlas | Cloud database service |
| Mongoose | 8.15.1 | MongoDB object modeling |
| Argon2 | 0.41.1 | Password hashing |
| JSON Web Token | 9.0.2 | Authentication tokens |
| Multer | 2.0.0 | File upload handling |
| Nodemailer | 7.0.9 | Email sending |
| PDFKit | 0.17.2 | PDF generation |
| Puppeteer | 24.9.0 | Headless browser automation |
| Helmet | 8.1.0 | Security middleware |
| CORS | 2.8.5 | Cross-origin resource sharing |
| Cookie Parser | 1.4.7 | Cookie handling |
| dotenv | 16.4.7 | Environment variables |
| ExcelJS | 4.4.0 | Excel file generation |
| Fast CSV | 5.0.5 | CSV parsing/generation |
| UUID | 11.1.0 | Unique identifier generation |
 
### Frontend
 
| Technology | Version | Description |
|------------|---------|-------------|
| Next.js | 15.5.4 | React framework |
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4.17 | Utility-first CSS framework |
| Radix UI | Various (1.x-2.x) | Accessible UI primitives |
| shadcn/ui | Latest | UI component library |
| Lucide React | 0.454.0 | Icon library |
| Axios | 1.9.0 | HTTP client |
| React Hook Form | 7.54.1 | Form handling |
| Zod | 3.24.1 | Schema validation |
| date-fns | 3.6.0 | Date utilities |
| Recharts | 2.15.0 | Charting library |
| jsPDF | 3.0.1 | PDF generation |
| @react-pdf/renderer | 4.3.0 | React PDF rendering |
| Sonner | 1.7.1 | Toast notifications |
| cmdk | 1.0.4 | Command menu |
| next-auth | 4.24.11 | Authentication |
| next-themes | Latest | Theme management |
 
### Development Tools
 
| Tool | Version | Description |
|------|---------|-------------|
| Nodemon | 3.1.10 | Development auto-restart |
| ESLint | 9.25.1 | Code linting |
| PostCSS | 8.x | CSS processing |
 
---
 
## System Architecture
 
```
NASAM/
├── backend/                 # Express.js API server
│   ├── controllers/         # Request handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic
│   ├── middleware/          # Auth & permission checks
│   ├── utils/               # Helper functions
│   ├── scripts/             # Database seeders
│   └── index.js             # Application entry point
│
├── frontend/nas-system/     # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable UI components
│   ├── services/            # API service functions
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   └── styles/              # Global styles
│
└── documents/               # Uploaded documents storage
```
 
---
 
## Deployment Instructions
 
### Prerequisites
 
- Node.js v18+ (LTS recommended)
- npm v9+
- MongoDB Atlas account (or local MongoDB instance)
- Git
 
### Environment Variables
 
#### Backend (.env)
 
Create a `.env` file in the `backend/` directory:
 
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
 
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nasm_database
 
# Authentication
JWT_SECRET=your-secure-jwt-secret-key
 
# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001
 
# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password
```
 
#### Frontend (.env.local)
 
Create a `.env.local` file in the `frontend/nas-system/` directory:
 
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
 
### Local Development Setup
 
#### 1. Clone the Repository
 
```bash
git clone https://github.com/JohnRey7/NASAM.git
cd NASAM
```
 
#### 2. Backend Setup
 
```bash
# Navigate to backend directory
cd backend
 
# Install dependencies
npm install
 
# Create .env file (copy from example above)
 
# Seed the database (optional but recommended)
npm run seed:roles
npm run seed:courses
 
# Start development server
npm run dev
```
 
The backend will run on `http://localhost:3000`
 
#### 3. Frontend Setup
 
```bash
# Navigate to frontend directory
cd frontend/nas-system
 
# Install dependencies
npm install
 
# Create .env.local file (copy from example above)
 
# Start development server
npm run dev
```
 
The frontend will run on `http://localhost:3001`
 
### Production Deployment
 
#### Backend Production
 
```bash
cd backend
 
# Create .env.production file with production values
cp .env .env.production
# Edit .env.production with production settings
 
# Install production dependencies
npm install --production
 
# Start server
npm start
```
 
#### Frontend Production
 
```bash
cd frontend/nas-system
 
# Create .env.production
echo "NEXT_PUBLIC_API_URL=http://your-server-ip:3000/api" > .env.production
 
# Build the application
npm run build
 
# Start production server
npm start
```
 
#### Using Deployment Scripts
 
The project includes deployment scripts for Linux/Unix servers:
 
```bash
# Full deployment (first time)
./deploy-production.sh
 
# Restart servers
./restart-production.sh
 
# Stop servers
./stop-production.sh
```
 
### Production Server Information
 
- **Server IP:** 95.216.139.119
- **Backend URL:** http://95.216.139.119:3000
- **Frontend URL:** http://95.216.139.119:3001
 
---
 
## Sample User Credentials
 
### Default Admin Account
 
The system automatically creates an admin account on first startup:
 
| Field | Value |
|-------|-------|
| **ID Number** | `ADMIN001` |
| **Password** | `Welcome1!` |
| **Role** | Administrator |
 
### User Roles & Access Levels
 
| Role | Description | Access |
|------|-------------|--------|
| **admin** | System Administrator | Full access to all features |
| **oas_staff** | OAS Staff | Application management, interviews, evaluations (no delete) |
| **department_head** | Department Head | View assigned applicants, schedule interviews, create evaluations |
| **applicant** | Applicant/Scholar | Submit applications, take tests, view own data |
 
### Creating Test Users
 
After logging in as admin, you can create test users for each role:
 
1. Navigate to **Admin Dashboard** → **User Management**
2. Click **Create User**
3. Fill in the required fields:
   - Name
   - ID Number (unique)
   - Email
   - Password
   - Role (select from dropdown)
   - Department (for department heads)
 
### Sample Test Accounts (Create these manually)
 
| Role | Suggested ID | Suggested Password |
|------|--------------|-------------------|
| OAS Staff | `OAS001` | `OasStaff123!` |
| Department Head | `DH001` | `DeptHead123!` |
| Applicant | `APP001` | `Applicant123!` |
 
---
 
## Key Features
 
- **User Authentication** - JWT-based authentication with role-based access control
- **Application Management** - Digital scholarship application forms with status tracking
- **Document Upload** - Secure document upload and verification system
- **Personality Testing** - Built-in personality test module for applicant assessment
- **Interview Scheduling** - Schedule and manage applicant interviews
- **Evaluation System** - Scholar performance evaluation with timekeeping
- **Notification System** - Real-time notifications for status updates
- **PDF Generation** - Export applications and reports as PDF
- **Analytics Dashboard** - Application statistics and reporting
- **Department Management** - Organize applicants by department
- **Audit Logging** - Track system activities for compliance
 
---
 
## API Endpoints Overview
 
| Category | Base Route | Description |
|----------|------------|-------------|
| Authentication | `/api/auth` | Login, logout, password reset |
| Users | `/api/users` | User CRUD operations |
| Roles | `/api/roles` | Role management |
| Applications | `/api/application` | Application forms |
| Documents | `/api/documents` | Document upload/download |
| Personality Test | `/api/personality-test` | Test management |
| Interviews | `/api/interview` | Interview scheduling |
| Evaluations | `/api/evaluations` | Scholar evaluations |
| Departments | `/api/departments` | Department management |
| Courses | `/api/course` | Course management |
| Notifications | `/api/notifications` | Notification system |
| OAS Dashboard | `/api/oas` | OAS staff operations |
| Department Head | `/api/department-head` | Dept. head operations |
 
---
 
## Troubleshooting
 
### Common Issues
 
1. **MongoDB Connection Error**
   - Verify `MONGODB_URI` is correct
   - Check network connectivity to MongoDB Atlas
   - Ensure IP whitelist includes your server IP
 
2. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check allowed origins in `backend/index.js`
 
3. **Authentication Issues**
   - Clear browser cookies
   - Verify `JWT_SECRET` is set
   - Check token expiration settings
 
4. **File Upload Errors**
   - Ensure `uploads/` and `files/` directories exist
   - Check file size limits in Multer configuration
 
---
 
## License
 
This project is developed for educational purposes at Cebu Institute of Technology – University (CIT-U).
 
---
 
## Contact
 
For support or inquiries, please contact the development team.