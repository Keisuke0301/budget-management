import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: chores, error } = await supabase
      .from("chores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`家事ログの取得に失敗しました: ${error.message}`);
    }

    return NextResponse.json(chores);
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { chore_name, note } = await request.json();

    if (!chore_name) {
      return NextResponse.json(
        { error: '家事の内容を入力してください。' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chores')
      .insert([{ chore_name, note }])
      .select()
      .single();

    if (error) {
      throw new Error(`家事の記録に失敗しました: ${error.message}`);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません。' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`削除に失敗しました: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
