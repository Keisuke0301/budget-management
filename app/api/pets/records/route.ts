import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get('petId');

  if (!petId) {
    return NextResponse.json({ error: 'petId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pet_records')
      .select('*')
      .eq('pet_id', petId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pet records:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // 1. 記録を挿入
    const { data: recordData, error: recordError } = await supabase
      .from('pet_records')
      .insert([body])
      .select();

    if (recordError) throw recordError;

    // 2. もし記録タイプが「お別れ」なら、ペットのステータスを memorial に更新
    if (body.record_type === 'お別れ') {
      await supabase
        .from('pet_info')
        .update({ status: 'memorial' })
        .eq('id', body.pet_id);
    }

    return NextResponse.json(recordData[0]);
  } catch (error) {
    console.error('Error creating pet record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
