import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pet_info')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    // 1. ペットの基本情報を登録
    const { data: petData, error: petError } = await supabase
      .from('pet_info')
      .insert([body])
      .select();

    if (petError) throw petError;
    const newPet = petData[0];

    // 2. お迎え日や誕生日があれば自動的に記録を追加
    const autoRecords = [];
    if (body.acquisition_date) {
      autoRecords.push({
        pet_id: newPet.id,
        record_type: 'お迎え',
        recorded_at: new Date(body.acquisition_date).toISOString(),
        note: 'お迎えしました！'
      });
    }
    if (body.birthday) {
      autoRecords.push({
        pet_id: newPet.id,
        record_type: '誕生日',
        recorded_at: new Date(body.birthday).toISOString(),
        note: 'お誕生日です'
      });
    }

    if (autoRecords.length > 0) {
      await supabase.from('pet_records').insert(autoRecords);
    }

    return NextResponse.json(newPet);
  } catch (error) {
    console.error('Error creating pet:', error);
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
      .from('pet_info')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error updating pet:', error);
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
      .from('pet_info')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pet:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
