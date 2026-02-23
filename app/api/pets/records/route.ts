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

    // 2. もし記録タイプが「お別れ」なら、ペットの数量を減らし、0になったら memorial に更新
    if (body.record_type === 'お別れ') {
      // 現在の情報を取得
      const { data: petInfo } = await supabase
        .from('pet_info')
        .select('quantity')
        .eq('id', body.pet_id)
        .single();

      if (petInfo) {
        const newQuantity = Math.max(0, (petInfo.quantity || 1) - 1);
        const updateData: { quantity: number; status?: string } = { quantity: newQuantity };
        
        if (newQuantity === 0) {
          updateData.status = 'memorial';
        }

        await supabase
          .from('pet_info')
          .update(updateData)
          .eq('id', body.pet_id);
      }
    }

    return NextResponse.json(recordData[0]);
  } catch (error) {
    console.error('Error creating pet record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { error } = await supabase
      .from('pet_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pet record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
