import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/files - получить файлы
export async function GET(request: NextRequest) {
  try {
    const dashboardOnly = request.nextUrl.searchParams.get('dashboard') === 'true';
    const tenderId = request.nextUrl.searchParams.get('tender_id');
    const limit = request.nextUrl.searchParams.get('limit');
    
    let query = supabase.from('files').select('*');
    
    if (dashboardOnly) {
      query = query.eq('show_on_dashboard', true);
    }
    
    if (tenderId) {
      query = query.eq('tender_id', parseInt(tenderId));
    }
    
    query = query.order('uploaded_at', { ascending: false });
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Ошибка получения файлов:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error('Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/files - создать запись о файле
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация обязательных полей
    if (!body.name || !body.url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, url' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('files')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания файла:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error('Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/files - обновить метаданные файла
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления файла:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (error) {
    console.error('Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/files - удалить файл
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Ошибка удаления файла:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (error) {
    console.error('Критическая ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
