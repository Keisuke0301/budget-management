import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plantId = searchParams.get('plantId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('plant_records')
      .select('*, plant_info(name)');

    if (plantId) {
      query = query.eq('plant_id', plantId);
    }
    
    if (startDate) {
      query = query.gte('recorded_at', startDate);
    }
    if (endDate) {
      query = query.lte('recorded_at', endDate);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching plant records:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const { data: recordData, error: recordError } = await supabase
      .from('plant_records')
      .insert([body])
      .select();

    if (recordError) throw recordError;

    // もし記録タイプが「収穫終了」なら、植物のステータスを ended に更新
    if (body.record_type === '収穫終了') {
      await supabase
        .from('plant_info')
        .update({ status: 'ended' })
        .eq('id', body.plant_id);
    }

    return NextResponse.json(recordData[0]);
  } catch (error) {
    console.error('Error creating plant record:', error);
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
      .from('plant_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plant record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
