'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AggregatedReward = {
  name: string;
  rarity: string;
  count: number;
  totalValue?: number;
};

const rarityStyles: { [key: string]: string } = {
  N: 'bg-gray-200 text-gray-800',
  R: 'bg-blue-200 text-blue-800',
  SR: 'bg-yellow-400 text-white',
  UR: 'bg-purple-600 text-white',
};

// noteから景品情報（名前とレアリティ）を抽出
const parsePrizeFromNote = (note: string): { name: string; rarity: string } | null => {
  const match = note.match(/獲得: (.+) \((.+)\)/);
  if (match && match.length === 3) {
    return { name: match[1], rarity: match[2] };
  }
  return null;
};

// 景品名から金額を抽出（例: "金券(300円)" -> 300）
const parseValueFromName = (name: string): number | null => {
    const match = name.match(/金券\((\d+)円\)/);
    if(match && match.length === 2) {
        return parseInt(match[1], 10);
    }
    return null;
}

export default function RewardsScreen() {
  const [rewards, setRewards] = useState<AggregatedReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chores')
        .select('note')
        .eq('category', 'ガチャ');

      if (error) {
        console.error('Error fetching rewards:', error);
        setError('景品一覧の取得に失敗しました。');
        setIsLoading(false);
        return;
      }

      const aggregated: { [key: string]: AggregatedReward } = {};

      data.forEach(chore => {
        if (chore.note) {
          const prize = parsePrizeFromNote(chore.note);
          if (prize) {
            if (aggregated[prize.name]) {
              aggregated[prize.name].count += 1;
              const value = parseValueFromName(prize.name);
              if(value !== null && aggregated[prize.name].totalValue !== undefined) {
                  aggregated[prize.name].totalValue! += value;
              }
            } else {
              const value = parseValueFromName(prize.name);
              aggregated[prize.name] = {
                name: prize.name,
                rarity: prize.rarity,
                count: 1,
                totalValue: value !== null ? value : undefined,
              };
            }
          }
        }
      });

      setRewards(Object.values(aggregated).sort((a,b) => b.count - a.count));
      setIsLoading(false);
    };

    fetchRewards();
  }, []);

  if (isLoading) {
    return <div className="text-center p-8">読込中...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">獲得した報酬一覧</h2>
        {rewards.length === 0 ? (
            <Card className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">まだ獲得した報酬はありません。</p>
            </Card>
        ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rewards.map(reward => (
                <Card key={reward.name} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span className="text-lg">{reward.name}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${rarityStyles[reward.rarity] || rarityStyles.N}`}>
                                {reward.rarity}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-center items-center">
                        {reward.totalValue !== undefined ? (
                             <>
                                <p className="text-4xl font-bold">{reward.totalValue.toLocaleString()}<span className="text-xl ml-1">円</span></p>
                                <p className="text-sm text-muted-foreground mt-1">（{reward.count}枚 獲得）</p>
                             </>
                        ) : (
                             <p className="text-4xl font-bold">{reward.count}<span className="text-xl ml-1">枚</span></p>
                        )}
                       
                    </CardContent>
                </Card>
            ))}
            </div>
        )}
    </div>
  );
}
