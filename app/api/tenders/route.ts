import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Кэширование на 60 секунд
export const revalidate = 60;

// GET - получить все тендеры
export async function GET(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем параметры из URL
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Строим запрос
    let query = supabase
      .from('tenders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Фильтр по статусу
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Пагинация
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : 0;
      query = query.range(offsetNum, offsetNum + limitNum - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching tenders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tenders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      count,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - создать новый тендер
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Валидация - только name и publication_date обязательны
    if (!body.name || !body.publication_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name and publication_date' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tenders')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error creating tender:', error);
      return NextResponse.json(
        { error: 'Failed to create tender' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - обновить тендер
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing tender ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tenders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tender:', error);
      return NextResponse.json(
        { error: 'Failed to update tender' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - удалить тендер
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing tender ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('tenders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting tender:', error);
      return NextResponse.json(
        { error: 'Failed to delete tender' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
