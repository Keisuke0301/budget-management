import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: diary, error } = await supabase
      .from("diary_records")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      throw new Error(`日記の取得に失敗しました: ${error.message}`);
    }

    return NextResponse.json(diary);
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { content, date } = await request.json();

    if (!content || !date) {
      return NextResponse.json(
        { error: '日付と内容を入力してください。' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('diary_records')
      .insert([{ content, date }])
      .select();

    if (error) {
      throw new Error(`日記の記録に失敗しました: ${error.message}`);
    }

    return NextResponse.json(data[0], { status: 201 });

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
      .from('diary_records')
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
