import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json(); // { records: [...] }
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'records array is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('plant_records')
      .insert(records)
      .select();

    if (error) throw error;

    // 「収穫終了」があればステータスを更新
    for (const record of records) {
      if (record.record_type === '収穫終了') {
        await supabase
          .from('plant_info')
          .update({ status: 'ended' })
          .eq('id', record.plant_id);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating bulk plant records:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
