import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('plant_info')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching plants:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const { data: plantData, error: plantError } = await supabase
      .from('plant_info')
      .insert([body])
      .select();

    if (plantError) throw plantError;
    const newPlant = plantData[0];

    // 植え付け日があれば自動的に記録を追加
    if (body.planting_date) {
      await supabase.from('plant_records').insert([{
        plant_id: newPlant.id,
        record_type: '植え付け',
        recorded_at: new Date(body.planting_date).toISOString(),
        note: '植え付けをしました！'
      }]);
    }

    return NextResponse.json(newPlant);
  } catch (error) {
    console.error('Error creating plant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('plant_info')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating plant:', error);
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
      .from('plant_info')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
