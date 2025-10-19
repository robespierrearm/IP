import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Получаем путь
  const path = request.nextUrl.pathname;

  // Публичные пути (доступны без авторизации)
  const publicPaths = ['/login', '/test-env'];
  const isPublicPath = publicPaths.includes(path);

  // Получаем токен из cookies
  const token = request.cookies.get('auth-token')?.value;

  // Если путь публичный
  if (isPublicPath) {
    // Если есть токен - редирект на dashboard (без проверки JWT в Edge)
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Если путь приватный и нет токена - редирект на логин
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Есть токен - пропускаем (проверка JWT будет на сервере)
  return NextResponse.next();
}

// Применяем middleware ко всем путям кроме статических файлов
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
