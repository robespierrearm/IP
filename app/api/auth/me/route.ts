import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Проверяем и декодируем токен
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      username: string;
    };

    return NextResponse.json({
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        username: decoded.username,
      },
    });
  } catch (error) {
    // Токен истёк или невалидный
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        { error: 'Сессия истекла' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Невалидный токен' },
      { status: 401 }
    );
  }
}
