# NASAM Frontend

This is the frontend application for the NASAM system.

## Connecting to the Backend

To connect the frontend to the backend:

1. **Create a `.env.local` file** in the root directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

2. **Start the backend server** (see backend README for instructions)

3. **Start the frontend development server**
   ```
   npm run dev
   ```

## Registration Flow

The registration process works as follows:

1. User fills out the registration form with:
   - Full Name
   - Email
   - ID Number
   - Password
   - Course selection

2. The form submits this data to the backend API at `/api/auth/register`

3. The backend:
   - Validates the input
   - Checks for existing users with the same ID or email
   - Creates a new user in the database
   - Sends a verification email if an email was provided
   - Returns a JWT token in an HTTP-only cookie

4. The frontend:
   - Stores user information in localStorage
   - Redirects the user to the dashboard
   - Shows a success message

## Development Notes

- The frontend uses Next.js 13+ with App Router
- Authentication is managed through the AuthContext
- API calls are made directly to the backend with credentials included
- CORS is configured on the backend to allow requests from the frontend

## Troubleshooting

If you encounter issues with registration:

1. Make sure MongoDB is running and accessible
2. Ensure the backend server is running on port 3000
3. Check that the courses have been seeded in the database
4. Verify that CORS is properly configured in the backend 