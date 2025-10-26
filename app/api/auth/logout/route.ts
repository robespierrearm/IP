import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logAuth, logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    logger.debug('Logout API called');
    const token = request.cookies.get('auth-token')?.value;

    if (token) {
      try {
        // Декодируем токен чтобы получить userId
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
        logger.debug('Token decoded', { userId: decoded.userId, email: decoded.email });
        
        // Пытаемся обновить статус пользователя (не критично если упадёт)
        try {
          const { error } = await supabase
            .from('users')
            .update({ 
              is_online: false,
              last_activity: new Date().toISOString()
            })
            .eq('id', decoded.userId);
          
          if (error) {
            logger.warn('Failed to update user status during logout (non-critical)', { 
              error: error.message,
              userId: decoded.userId 
            });
          } else {
            logger.debug('User status updated', { userId: decoded.userId });
          }
        } catch (supabaseError) {
          // Supabase недоступен - не страшно, продолжаем logout
          logger.warn('Supabase unavailable during logout (non-critical)', { 
            error: supabaseError instanceof Error ? supabaseError.message : 'Unknown'
          });
        }
        
        logAuth.logout(decoded.email);
        logger.info('Logout successful', { email: decoded.email, userId: decoded.userId });
      } catch (error) {
        // Токен невалидный, но это ок - всё равно выходим
        logger.debug('Token invalid during logout, continuing...', { 
          error: error instanceof Error ? error.message : 'Unknown' 
        });
      }
    } else {
      logger.debug('No token found, logging out anyway');
    }

    // ВСЕГДА удаляем cookie (даже если были ошибки)
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');

    logger.debug('Auth cookie deleted');
    return response;
  } catch (error) {
    logger.error('Logout API error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    
    // КРИТИЧНО: Даже при любой ошибке - ВСЕГДА удаляем cookie!
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth-token');
    
    return response;
  }
}
