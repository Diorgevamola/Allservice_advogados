
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session');
    const { pathname } = request.nextUrl;

    // Protect all routes except /login, /admin/login and static assets
    if (!session && pathname !== '/login' && pathname !== '/admin/login' && !pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect to dashboard if already logged in and trying to access /login
    if (session && (pathname === '/login' || pathname === '/admin/login')) {
        if (session.value.startsWith('admin:')) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|logo.svg).*)'],
};
