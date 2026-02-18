import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/app/lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    // カテゴリとタスクを両方取得
    const [categoriesRes, tasksRes] = await Promise.all([
      supabase.from("chore_master_categories").select("*").order("display_order"),
      supabase.from("chore_master_tasks").select("*").order("display_order")
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (tasksRes.error) throw tasksRes.error;

    // カテゴリごとにタスクをネストした構造に変換
    const categories = categoriesRes.data.map(cat => ({
      ...cat,
      tasks: tasksRes.data.filter(task => task.category_id === cat.id)
    }));

    return NextResponse.json(categories);
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: "マスターデータの取得に失敗しました" }, { status: 500 });
  }
}
