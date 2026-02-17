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
    const { category, task, note, base_score, assignee } = await request.json();

    if (!category || !task) {
      return NextResponse.json(
        { error: '分類とタスクを入力してください。' },
        { status: 400 }
      );
    }

    let multiplier = 1;
    let multiplier_message = null;
    let score = null;

    if (base_score) {
      const rand = Math.random(); // 0.0 <= rand < 1.0

      if (rand < 0.01) { // 1/100
        multiplier = 10;
        multiplier_message = "💎爆裂大当たり！！一生分の運を使い切ったかも！！！ポイント10倍！！！";
      } else if (rand < 0.03) { // 1/50 (0.01 + 0.02)
        multiplier = 5;
        multiplier_message = "🌟スーパー当たりラッキー！運だけかよ！ポイント5倍！！";
      } else if (rand < 0.13) { // 1/10 (0.03 + 0.1)
        multiplier = 2;
        multiplier_message = "🎊ラッキーだ！運も実力うんちだ！ポイント2倍！";
      }

      score = base_score * multiplier;
    }

    const { data, error } = await supabase
      .from('chores')
      .insert([{
        note,
        category,
        task,
        score,
        multiplier,
        multiplier_message,
        assignee
      }])
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
