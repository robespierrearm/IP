import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/expenses - получить все расходы или по tender_id
export async function GET(request: NextRequest) {
  try {
    const tenderId = request.nextUrl.searchParams.get('tender_id');
    
    let query = supabase.from('expenses').select('*');
    
    if (tenderId) {
      query = query.eq('tender_id', parseInt(tenderId));
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка получения расходов:', error);
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

// POST /api/expenses - создать новый расход
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('expenses')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Ошибка создания расхода:', error);
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

// PUT /api/expenses - обновить расход
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Ошибка обновления расхода:', error);
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

// DELETE /api/expenses - удалить расход
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID обязателен' }, { status: 400 });
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('Ошибка удаления расхода:', error);
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
