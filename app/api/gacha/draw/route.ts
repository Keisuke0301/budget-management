import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { assignee } = await request.json();

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
    }

    // 1. ガチャの景品をDBから取得
    const { data: prizes, error: prizesError } = await supabase
      .from('chore_gacha_prizes')
      .select('*');

    if (prizesError || !prizes || prizes.length === 0) {
      console.error('Error fetching gacha prizes:', prizesError);
      return NextResponse.json({ error: 'Failed to fetch gacha prizes' }, { status: 500 });
    }

    // 2. 確率に基づいて抽選
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    const random = Math.random() * totalProbability;
    let cumulativeProbability = 0;

    const selectedPrize = prizes.find(prize => {
      cumulativeProbability += prize.probability;
      return random < cumulativeProbability;
    }) || prizes[prizes.length - 1];

    // 3. chore_recordsテーブルにガチャの結果を登録（ポイント消費）
    const { error: insertError } = await supabase.from('chore_records').insert([
      {
        category: 'ガチャ',
        task: 'ガチャ消費',
        score: -100,
        note: `獲得: ${selectedPrize.name} (${selectedPrize.rarity})`,
        assignee: assignee,
      },
    ]);

    if (insertError) {
      console.error('Error inserting gacha result:', insertError);
      return NextResponse.json({ error: 'Failed to record gacha transaction' }, { status: 500 });
    }

    // 4. ユーザーのインベントリに報酬を追加
    const { error: inventoryError } = await supabase.from('chore_records_prizes').insert([
      {
        assignee: assignee,
        prize_id: selectedPrize.id,
        is_used: false,
      },
    ]);

    if (inventoryError) {
      console.error('Error adding to inventory:', inventoryError);
      // インベントリへの追加に失敗しても、ポイント消費はされているため、一旦続行するかエラーにするかは要検討。
      // 今回は厳密に管理するため、エラーを返します。
      return NextResponse.json({ error: 'Failed to add prize to inventory' }, { status: 500 });
    }

    return NextResponse.json(selectedPrize);

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
