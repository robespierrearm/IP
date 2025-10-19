import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        // Декодируем токен чтобы получить userId
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        
        // Обновляем статус пользователя
        await supabase
          .from('users')
          .update({ 
            is_online: false,
            last_activity: new Date().toISOString()
          })
          .eq('id', decoded.userId);
      } catch (error) {
        // Токен невалидный, но это ок - всё равно выходим
        console.log('Token invalid during logout, continuing...');
      }
    }

    // Удаляем cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Даже при ошибке удаляем cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    return response;
  }
}
