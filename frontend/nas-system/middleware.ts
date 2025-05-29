import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/dashboard': ['applicant'],
  '/oas-dashboard': ['oas_staff'],
  '/panel-dashboard': ['panelist'],
  '/nas-dashboard': ['nas_supervisor'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is a protected route
  const isProtectedRoute = Object.keys(protectedRoutes).some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // Get the user from the session cookie
    const userCookie = request.cookies.get('nas_user')
    const authHeader = request.headers.get('authorization')
    
    if (!userCookie && !authHeader) {
      // No authentication found, redirect to login
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      let user
      if (userCookie) {
        user = JSON.parse(userCookie.value)
      } else if (authHeader) {
        // Handle Authorization header if present
        const token = authHeader.replace('Bearer ', '')
        user = JSON.parse(atob(token))
      }
      
      if (!user) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Check if user has the required role for this route
      const allowedRoles = Object.entries(protectedRoutes).find(([route]) => 
        pathname.startsWith(route)
      )?.[1]

      if (!allowedRoles?.includes(user.role)) {
        // User doesn't have the required role, redirect to appropriate dashboard
        switch (user.role) {
          case 'applicant':
            return NextResponse.redirect(new URL('/dashboard', request.url))
          case 'oas_staff':
            return NextResponse.redirect(new URL('/oas-dashboard', request.url))
          case 'panelist':
            return NextResponse.redirect(new URL('/panel-dashboard', request.url))
          case 'nas_supervisor':
            return NextResponse.redirect(new URL('/nas-dashboard', request.url))
          default:
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
    } catch (error) {
      // Invalid authentication, redirect to login
      return NextResponse.redirect(new URL('/', request.url))
}
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/oas-dashboard/:path*',
    '/panel-dashboard/:path*',
    '/nas-dashboard/:path*',
  ],
} 