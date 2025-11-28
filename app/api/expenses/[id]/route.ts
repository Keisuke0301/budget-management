import { getSupabaseClient } from "../../../lib/supabaseClient";
import { NextResponse, NextRequest } from "next/server";

/**
 * DELETE: 指定されたIDの支出記録を削除します
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "IDが指定されていません。" }, { status: 400 });
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      // code 22P02はUUIDの形式が無効な場合など
      if(error.code === '22P02') {
        return NextResponse.json({ error: "無効なID形式です。" }, { status: 400 });
      }
      throw new Error(`記録の削除に失敗しました: ${error.message}`);
    }

    // GASでは削除後に全データを返していましたが、
    // APIでは成功したことだけを伝え、クライアント側でデータの再取得を促すのが一般的です。
    return NextResponse.json({ message: "削除に成功しました。" }, { status: 200 });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
