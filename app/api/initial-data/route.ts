import { getSupabaseClient } from "../../lib/supabaseClient";
import {
  startOfDay,
  endOfDay,
  startOfMonth as dfnsStartOfMonth,
  endOfMonth as dfnsEndOfMonth,
  getDay,
  subDays,
  addDays,
  getWeeksInMonth,
  isBefore,
  addMonths,
  subMonths,
} from "date-fns";
import { NextResponse } from "next/server";

// GASのロジックに合わせて週の開始を土曜日、終了を金曜日とする
// @see https://github.com/date-fns/date-fns/issues/822#issuecomment-410526637
const getWeekRange = (date: Date) => {
  const today = startOfDay(date);
  // getDay() returns 0 for Sunday, 6 for Saturday.
  // We want to find the previous Saturday.
  // If today is Saturday (6), diff is 0.
  // If today is Sunday (0), diff is 1.
  // If today is Friday (5), diff is 6.
  const diff = today.getDay() === 6 ? 0 : today.getDay() + 1;
  const startOfWeek = subDays(today, diff);
  const endOfWeek = endOfDay(addDays(startOfWeek, 6));
  return { startOfWeek, endOfWeek };
};

// GASのgetMonthRangeロジックをdate-fnsで再現
const getMonthRange = (date: Date) => {
  const today = startOfDay(date);
  const firstDayOfCurrentMonth = dfnsStartOfMonth(today);
  
  // Find the first Saturday of the current month's calendar period
  let firstSaturday = firstDayOfCurrentMonth;
  while(getDay(firstSaturday) !== 6) {
    firstSaturday = addDays(firstSaturday, 1);
  }

  let startOfMonth, endOfMonth;

  if (isBefore(today, firstSaturday)) {
    // If today is before the first Saturday, we are in the previous month's period
    const firstDayOfLastMonth = dfnsStartOfMonth(subMonths(today, 1));
    let firstSaturdayOfLastMonth = firstDayOfLastMonth;
    while(getDay(firstSaturdayOfLastMonth) !== 6) {
      firstSaturdayOfLastMonth = addDays(firstSaturdayOfLastMonth, 1);
    }
    startOfMonth = firstSaturdayOfLastMonth;
    endOfMonth = endOfDay(subDays(firstSaturday, 1));
  } else {
    // We are in the current month's period
    startOfMonth = firstSaturday;
    const firstDayOfNextMonth = dfnsStartOfMonth(addMonths(today, 1));
    let firstSaturdayOfNextMonth = firstDayOfNextMonth;
    while(getDay(firstSaturdayOfNextMonth) !== 6) {
      firstSaturdayOfNextMonth = addDays(firstSaturdayOfNextMonth, 1);
    }
    endOfMonth = endOfDay(subDays(firstSaturdayOfNextMonth, 1));
  }
  
  const numberOfWeeks = Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24 * 7));

  return { startOfMonth, endOfMonth, numberOfWeeks };
};


export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const today = new Date();
    
    // --- 日付範囲の計算 ---
    const { startOfWeek, endOfWeek } = getWeekRange(today);
    const { startOfMonth, endOfMonth, numberOfWeeks } = getMonthRange(today);
    
    const oneDay = 24 * 60 * 60 * 1000;
    const daysFromMonthStart = Math.floor((startOfWeek.getTime() - startOfMonth.getTime()) / oneDay);
    const weekNumber = Math.floor(daysFromMonthStart / 7) + 1;

    // --- データ取得 ---
    const { data: expense_budgets, error: budgetError } = await supabase
      .from("expense_budgets")
      .select("category, amount");

    if (budgetError) throw new Error(`予算の取得に失敗: ${budgetError.message}`);

    const { data: expenses, error: expenseError } = await supabase
      .from("expense_records")
      .select("created_at, category, amount")
      .gte("created_at", startOfMonth.toISOString())
      .lte("created_at", endOfMonth.toISOString());

    if (expenseError) throw new Error(`支出記録の取得に失敗: ${expenseError.message}`);

    // --- ペットデータの取得 ---
    const [petsRes, petItemsRes] = await Promise.all([
      supabase.from("pet_info").select("*").order("created_at", { ascending: true }),
      supabase.from("pet_items").select("*").order("display_order", { ascending: true })
    ]);

    // --- データ集計 ---
    const foodBudget = expense_budgets.find(b => b.category === '食費')?.amount || 0;
    const dailyGoodsBudget = expense_budgets.find(b => b.category === '日用品')?.amount || 0;

    let weeklyFoodUsage = 0;
    let weeklyDailyGoodsUsage = 0;
    let monthlyFoodUsage = 0;
    let monthlyDailyGoodsUsage = 0;

    for (const expense of expenses) {
      const expenseDate = new Date(expense.created_at);
      
      // 月次集計
      if (expense.category === '食費') monthlyFoodUsage += expense.amount;
      else if (expense.category === '日用品') monthlyDailyGoodsUsage += expense.amount;

      // 週次集計 (月次集計のために取得したデータからフィルタリング)
      if (expenseDate >= startOfWeek && expenseDate <= endOfWeek) {
        if (expense.category === '食費') weeklyFoodUsage += expense.amount;
        else if (expense.category === '日用品') weeklyDailyGoodsUsage += expense.amount;
      }
    }

    // --- レスポンス作成 ---
    // GASの戻り値の形式に合わせる
    const responseData = {
      foodBudget: foodBudget,
      dailyGoodsBudget: dailyGoodsBudget,
      weeklyFoodUsage: weeklyFoodUsage,
      weeklyDailyGoodsUsage: weeklyDailyGoodsUsage,
      monthlyFoodUsage: monthlyFoodUsage,
      monthlyDailyGoodsUsage: monthlyDailyGoodsUsage,
      numberOfWeeks: numberOfWeeks,
      weekNumber: weekNumber,
      todayTime: today.getTime(),
      startOfWeekTime: startOfWeek.getTime(),
      endOfWeekTime: endOfWeek.getTime(),
      startOfMonthTime: startOfMonth.getTime(),
      endOfMonthTime: endOfMonth.getTime(),
      pets: petsRes.data || [],
      petItems: petItemsRes.data || []
    };

    return NextResponse.json(responseData);

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
