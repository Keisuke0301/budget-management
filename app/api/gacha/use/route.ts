import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { inventory_id } = await request.json();

    if (!inventory_id) {
      return NextResponse.json({ error: 'Inventory ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('chore_records_prizes')
      .update({ 
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', inventory_id);

    if (error) {
      console.error('Error using reward:', error);
      return NextResponse.json({ error: 'Failed to use reward' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
