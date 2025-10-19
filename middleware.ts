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
  const publicPaths = ['/login', '/m/login', '/test-env'];
  const isPublicPath = publicPaths.includes(path);

  // Получаем токен из cookies
  const token = request.cookies.get('auth-token')?.value;

  // Если это мобильный путь (/m/*), пропускаем
  // Авторизацию проверит layout мобильной версии
  if (path.startsWith('/m')) {
    return NextResponse.next();
  }

  // Если путь публичный - пропускаем
  if (isPublicPath) {
    // Если есть токен - редирект на dashboard
    if (token) {
      if (isMobile) {
        return NextResponse.redirect(new URL('/m/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Если нет токена - редирект на логин
  if (!token) {
    if (isMobile) {
      return NextResponse.redirect(new URL('/m/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Есть токен - проверяем устройство и делаем редирект
  
  // Если главная страница
  if (path === '/') {
    if (isMobile) {
      return NextResponse.redirect(new URL('/m/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если мобильное устройство и не на /m - редирект на мобильную версию
  if (isMobile && !path.startsWith('/m')) {
    const mobilePath = `/m${path}`;
    return NextResponse.redirect(new URL(mobilePath, request.url));
  }

  // Пропускаем
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
