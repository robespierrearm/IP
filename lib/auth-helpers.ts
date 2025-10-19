import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Проверка авторизации для API routes
export async function checkAuth(request: NextRequest): Promise<{ authorized: boolean; userId?: string }> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken || !authToken.value) {
      return { authorized: false };
    }

    // В будущем здесь можно добавить проверку JWT токена
    // Пока просто проверяем наличие токена
    return { 
      authorized: true, 
      userId: authToken.value 
    };
  } catch (error) {
    console.error('Auth check error:', error);
    return { authorized: false };
  }
}

// Обработчик неавторизованного доступа
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized. Please login.' },
    { status: 401 }
  );
}

// Обработчик ошибок сервера
export function serverErrorResponse(error: any) {
  console.error('Server error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Обработчик ошибок валидации
export function validationErrorResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

// Успешный ответ
export function successResponse<T>(data: T, count?: number) {
  return NextResponse.json({
    data,
    count,
    success: true
  });
}
