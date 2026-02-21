import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: chores, error } = await supabase
      .from("chore_records")
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
    const { category, task, note, base_score, assignees, created_at, multiplier: clientMultiplier } = await request.json();

    if (!category || !task) {
      return NextResponse.json(
        { error: '分類とタスクを入力してください。' },
        { status: 400 }
      );
    }
    
    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
      return NextResponse.json(
        { error: '担当者を指定してください。' },
        { status: 400 }
      );
    }

    // --- 倍率とメッセージの計算をループの外に移動 ---
    let multiplier = clientMultiplier || 1;
    let multiplier_message = null;

    if (base_score) {
      const rand = Math.random(); // 0.0 <= rand < 1.0
      if (rand < 0.01) { // 1/100
        multiplier *= 10;
        multiplier_message = "\n💎爆裂大当たり！！一生分の運を使い切ったかも！！！ポイント10倍！！！";
      } else if (rand < 0.03) { // 1/50 (0.01 + 0.02)
        multiplier *= 5;
        multiplier_message = "\n🌟スーパー当たりラッキー！運だけかよ！ポイント5倍！！";
      } else if (rand < 0.13) { // 1/10 (0.03 + 0.1)
        multiplier *= 2;
        multiplier_message = "\n🎊ラッキーだ！運も実力うんちだ！ポイント2倍！";
      }
    }
    // --- ここまで ---

    // スコアを人数で分割
    const scorePerAssignee = base_score && assignees.length > 0 ? base_score / assignees.length : base_score;

    const recordsToInsert = assignees.map(assignee => {
      const insertData: any = {
        note,
        category,
        task,
        score: scorePerAssignee,
        multiplier, // 全員に同じ倍率を適用
        assignee,
      };
      if (created_at) {
        insertData.created_at = created_at;
      }
      return insertData;
    });

    const { data, error } = await supabase
      .from('chore_records')
      .insert(recordsToInsert)
      .select();

    if (error) {
      throw new Error(`家事の記録に失敗しました: ${error.message}`);
    }

    // レスポンスデータに、計算したメッセージを付与する
    const responseData = data.map(d => ({
      ...d,
      multiplier_message
    }));

    return NextResponse.json(responseData, { status: 201 });

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
      .from('chore_records')
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
