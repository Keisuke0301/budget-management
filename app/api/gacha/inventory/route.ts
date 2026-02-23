import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // インベントリと景品情報を結合して取得
    const { data, error } = await supabase
      .from('chore_user_inventory')
      .select(`
        id,
        assignee,
        is_used,
        created_at,
        prize:chore_records_gachaprizes (*)
      `)
      .eq('is_used', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
