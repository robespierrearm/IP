import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

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
    // Если есть валидный токен - редирект на dashboard
    if (token) {
      try {
        jwt.verify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // Токен невалидный - удаляем и пропускаем на логин
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    }
    return NextResponse.next();
  }

  // Если путь приватный
  if (!token) {
    // Нет токена - редирект на логин
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Проверяем токен
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // Токен невалидный или истёк - удаляем и редирект на логин
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
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
