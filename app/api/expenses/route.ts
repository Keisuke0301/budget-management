import { getSupabaseClient } from "../../lib/supabaseClient";
import { NextResponse } from "next/server";
import {
  startOfDay,
  endOfDay,
  getDay,
  subDays,
  addDays,
  startOfMonth,
  addMonths,
  subMonths,
} from "date-fns";

// GASのgetMonthRangeロジックをdate-fnsで再現
const getMonthRange = (date: Date) => {
  const today = startOfDay(date);
  const firstDayOfCurrentMonth = startOfMonth(today);

  let firstSaturday = firstDayOfCurrentMonth;
  while (getDay(firstSaturday) !== 6) {
    firstSaturday = addDays(firstSaturday, 1);
  }

  let startOfMonthDate, endOfMonthDate;

  if (today.getTime() < firstSaturday.getTime()) {
    const firstDayOfLastMonth = startOfMonth(subMonths(today, 1));
    let firstSaturdayOfLastMonth = firstDayOfLastMonth;
    while (getDay(firstSaturdayOfLastMonth) !== 6) {
      firstSaturdayOfLastMonth = addDays(firstSaturdayOfLastMonth, 1);
    }
    startOfMonthDate = firstSaturdayOfLastMonth;
    endOfMonthDate = endOfDay(subDays(firstSaturday, 1));
  } else {
    startOfMonthDate = firstSaturday;
    const firstDayOfNextMonth = startOfMonth(addMonths(today, 1));
    let firstSaturdayOfNextMonth = firstDayOfNextMonth;
    while (getDay(firstSaturdayOfNextMonth) !== 6) {
      firstSaturdayOfNextMonth = addDays(firstSaturdayOfNextMonth, 1);
    }
    endOfMonthDate = endOfDay(subDays(firstSaturdayOfNextMonth, 1));
  }

  return { startOfMonth: startOfMonthDate, endOfMonth: endOfMonthDate };
};

/**
 * GET: 今週の支出履歴を取得します
 */
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const weekParam = url.searchParams.get("week");

    const referenceDate = monthParam ? new Date(monthParam) : new Date();
    const { startOfMonth, endOfMonth } = getMonthRange(referenceDate);

    let rangeStart = startOfMonth;
    let rangeEnd = endOfMonth;

    const weekNumber = weekParam === "all" || !weekParam ? null : Number(weekParam);
    if (weekNumber && weekNumber >= 1 && weekNumber <= 5) {
      const weekStart = addDays(startOfMonth, (weekNumber - 1) * 7);
      const weekEndCandidate = endOfDay(addDays(weekStart, 6));
      rangeStart = weekStart;
      rangeEnd = weekEndCandidate.getTime() > endOfMonth.getTime() ? endOfMonth : weekEndCandidate;
    }

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("id, created_at, category, amount")
      .gte("created_at", rangeStart.toISOString())
      .lte("created_at", rangeEnd.toISOString())
      .order("created_at", { ascending: false }); // 新しい順で取得

    if (error) {
      throw new Error(`履歴の取得に失敗しました: ${error.message}`);
    }

    // GASの `getWeeklyExpenses` の戻り値の形式に近づける
    const formattedExpenses = expenses.map(e => ({
      // GASではrowを使っていたが、DBのidを代わりに使う
      row: e.id, 
      timestamp: new Date(e.created_at).getTime(),
      category: e.category,
      amount: e.amount,
    })).sort((a, b) => a.timestamp - b.timestamp); // 日付の昇順（古いものが先）にソート

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
