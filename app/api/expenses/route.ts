import { getSupabaseClient } from "../../lib/supabaseClient";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay, getDay, subDays, addDays, format } from "date-fns";

// 週の範囲を計算するヘルパー関数 (土曜〜金曜)
const getWeekRange = (date: Date) => {
  const today = startOfDay(date);
  const diff = today.getDay() === 6 ? 0 : today.getDay() + 1;
  const startOfWeek = subDays(today, diff);
  const endOfWeek = endOfDay(addDays(startOfWeek, 6));
  return { startOfWeek, endOfWeek };
};

/**
 * GET: 今週の支出履歴を取得します
 */
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { startOfWeek, endOfWeek } = getWeekRange(new Date());

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("id, created_at, category, amount")
      .gte("created_at", startOfWeek.toISOString())
      .lte("created_at", endOfWeek.toISOString())
      .order("created_at", { ascending: true }); // 日付の昇順で取得

    if (error) {
      throw new Error(`履歴の取得に失敗しました: ${error.message}`);
    }

    // GASの `getWeeklyExpenses` の戻り値の形式に近づける
    const formattedExpenses = expenses.map(e => {
      const createdAt = new Date(e.created_at);
      return {
        // GASではrowを使っていたが、DBのidを代わりに使う
        row: e.id,
        timestamp: createdAt.getTime(),
        dateString: format(createdAt, "M/d(E)", { weekStartsOn: 1 /*月曜始まり*/ }),
        category: e.category,
        categoryIcon: e.category === "食費" ? "🥗" : "🧻",
        amount: e.amount,
      };
    });

    return NextResponse.json(formattedExpenses);

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


/**
 * POST: 新しい支出を記録します
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { category, amount } = await request.json();

    // バリデーション
    const numAmount = Number(amount);
    if (!category || !numAmount || !Number.isInteger(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: '費目を選択し、正しい金額(正の整数)を入力してください。' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ category, amount: numAmount }])
      .select()
      .single(); // 追加したレコードを返す

    if (error) {
      throw new Error(`支出の記録に失敗しました: ${error.message}`);
    }

    return NextResponse.json(data, { status: 201 });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
