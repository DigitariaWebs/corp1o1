import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/aiassistant(.*)',
  '/learning(.*)',
  '/assessments(.*)',
  '/certificates(.*)',
  '/portfolio(.*)',
  '/skills(.*)',
  '/notifications(.*)',
  '/subscription(.*)',
  '/admin(.*)',
  '/enterprise(.*)',
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

// Define enterprise routes that require enterprise role
const isEnterpriseRoute = createRouteMatcher([
  '/enterprise(.*)',
]);

// Define public API routes (no auth required)
const isPublicApiRoute = createRouteMatcher([
  '/api/health',
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public API routes without authentication
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }

  // Protect all API routes (except public ones)
  if (req.nextUrl.pathname.startsWith('/api/')) {
    await auth.protect();
    return NextResponse.next();
  }

  // Protect dashboard and learning routes
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // Get user data after protection
    const { userId, sessionClaims } = await auth();
    
    // Role-based access for admin routes
    if (isAdminRoute(req)) {
      const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
      if (role !== 'admin') {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }
    
    // Role-based access for enterprise routes
    if (isEnterpriseRoute(req)) {
      const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
      if (role !== 'enterprise' && role !== 'admin') {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }
  }

  // Redirect authenticated users from auth pages to AI assistant
  const { userId, sessionClaims } = await auth();
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    // Get user role for proper redirection
    const role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    
    let redirectUrl = '/aiassistant';
    if (role === 'admin') {
      redirectUrl = '/admin';
    } else if (role === 'enterprise') {
      redirectUrl = '/enterprise';
    }
    
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};