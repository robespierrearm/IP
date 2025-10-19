import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Функция определения мобильного устройства
function isMobileDevice(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export function middleware(request: NextRequest) {
  // Получаем путь и User-Agent
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = isMobileDevice(userAgent);

  // Публичные пути (доступны без авторизации)
  const publicPaths = ['/login', '/test-env'];
  const isPublicPath = publicPaths.includes(path);

  // Получаем токен из cookies
  const token = request.cookies.get('auth-token')?.value;

  // Если это мобильный путь (/m/*), пропускаем
  // Авторизацию проверит layout мобильной версии
  if (path.startsWith('/m')) {
    return NextResponse.next();
  }

  // Автоматический редирект на мобильную версию для мобильных устройств
  if (isMobile && !path.startsWith('/m') && !isPublicPath && path !== '/' && token) {
    const mobilePath = `/m${path}`;
    return NextResponse.redirect(new URL(mobilePath, request.url));
  }

  // Если пользователь на мобильном и зашёл на главную - редирект на /m
  if (isMobile && path === '/' && token) {
    return NextResponse.redirect(new URL('/m/dashboard', request.url));
  }
  
  // Если пользователь НЕ на мобильном, но зашёл на главную - редирект на десктоп
  if (!isMobile && path === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если путь публичный и пользователь авторизован
  if (isPublicPath && token) {
    if (isMobile) {
      return NextResponse.redirect(new URL('/m/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если путь приватный и нет токена - редирект на логин
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Есть токен - пропускаем
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
