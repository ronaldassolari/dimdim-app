import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Request logging for API routes
  if (pathname.startsWith('/api/')) {
    const start = Date.now();
    response.headers.set('X-Request-Start', start.toString());
    console.log(`[API] ${request.method} ${pathname}`);
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Cache-Control headers for API routes
  if (pathname === '/api/health') {
    response.headers.set('Cache-Control', 'public, max-age=30');
  } else if (pathname === '/api/cartoes/catalogo') {
    response.headers.set('Cache-Control', 'public, max-age=3600');
  } else if (pathname === '/api/aulas') {
    response.headers.set('Cache-Control', 'public, max-age=3600');
  } else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store');
  }

  // Rate limiting for login
  if (request.nextUrl.pathname === '/api/auth/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 10;

    const entry = rateLimitMap.get(ip);
    if (entry && now - entry.timestamp < windowMs) {
      if (entry.count >= maxAttempts) {
        return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' }, { status: 429 });
      }
      entry.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    // Cleanup old entries
    if (rateLimitMap.size > 1000) {
      rateLimitMap.forEach((val, key) => {
        if (now - val.timestamp > windowMs) rateLimitMap.delete(key);
      });
    }
  }

  // CSRF protection for state-changing requests
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type') || '';
    const xRequested = request.headers.get('x-requested-with');
    // Allow JSON API calls (fetch with Content-Type: application/json)
    // Block form submissions from other origins
    if (!contentType.includes('application/json') && !xRequested) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host && !origin.includes(host)) {
        return NextResponse.json({ error: 'CSRF: requisição bloqueada' }, { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
