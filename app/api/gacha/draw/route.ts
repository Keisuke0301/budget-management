import { createClient } from '@/app/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { assignee } = await request.json();

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
    }

    // 1. ガチャの景品をDBから取得
    const { data: prizes, error: prizesError } = await supabase
      .from('gacha_prizes')
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
    });

    if (!selectedPrize) {
      // フォールバックとして最後の景品を選択
      const fallbackPrize = prizes[prizes.length - 1];
      console.warn('Could not determine prize by probability, using fallback:', fallbackPrize.name);
      // return NextResponse.json({ error: 'Could not determine prize' }, { status: 500 });
    }
    
    const prizeToRecord = selectedPrize || prizes[prizes.length - 1];


    // 3. choresテーブルにガチャの結果を登録（ポイント消費）
    const { error: insertError } = await supabase.from('chores').insert([
      {
        category: 'ガチャ',
        task: 'ガチャ消費',
        score: -100,
        note: `獲得: ${prizeToRecord.name} (${prizeToRecord.rarity})`,
        assignee: assignee,
      },
    ]);

    if (insertError) {
      console.error('Error inserting gacha result:', insertError);
      return NextResponse.json({ error: 'Failed to record gacha transaction' }, { status: 500 });
    }

    // 4. 抽選された景品を返す
    return NextResponse.json(prizeToRecord);

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
