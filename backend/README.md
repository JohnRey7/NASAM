# Backend for NASAM Application

This is the backend API for the NASAM application.

## Setup Instructions

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a .env file**
   Create a `.env` file in the root directory with the following variables:
   ```
   # Server configuration
   PORT=3000

   # MongoDB connection string
   MONGODB_URI=mongodb://localhost:27017/nasm_database

   # JWT secret for authentication
   JWT_SECRET=your_jwt_secret_key_change_this_in_production

   # Email configuration for nodemailer
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com

   # Frontend URL for email verification redirects
   FRONTEND_URL=http://localhost:3001
   ```

3. **Seed the database with courses**
   ```
   npm run seed:courses
   ```

4. **Start the development server**
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- **POST /api/auth/register** - Register a new user
  ```
  {
    "name": "User Name",
    "idNumber": "12345678",
    "email": "user@example.com",
    "password": "password123",
    "courseId": "bsit",
    "rememberMe": true
  }
  ```

- **POST /api/auth/login** - Login a user
  ```
  {
    "idNumber": "12345678",
    "password": "password123",
    "rememberMe": true
  }
  ```

- **POST /api/auth/logout** - Logout a user

- **GET /api/auth/me** - Get current user info (requires authentication)

- **GET /api/auth/email/verify?code=123456** - Verify email with code

- **GET /api/auth/email/resend?idNumber=12345678** - Resend verification email

- **PUT /api/auth/email** - Update email (requires authentication)
  ```
  {
    "idNumber": "12345678",
    "email": "new-email@example.com"
  }
  ```

## Development

- The backend uses Express.js for the API server
- MongoDB with Mongoose for database operations
- JWT for authentication
- Argon2 for password hashing
- Nodemailer for sending emails 