'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/app/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Award, Coins } from 'lucide-react';

type AggregatedReward = {
  name: string;
  rarity: string;
  count: number;
  totalValue?: number;
};

const rarityColors: { [key: string]: string } = {
  N: 'bg-slate-100 text-slate-600 border-slate-200',
  R: 'bg-blue-100 text-blue-600 border-blue-200',
  SR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  UR: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function RewardsScreen() {
  const [rewards, setRewards] = useState<AggregatedReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('chores')
        .select('note')
        .eq('category', 'ガチャ')
        .ilike('task', 'ガチャ消費');

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      const aggregated: { [key: string]: AggregatedReward } = {};

      data.forEach(item => {
        if (!item.note) return;
        const match = item.note.match(/獲得: (.+) \((.+)\)/);
        if (match) {
          const [, name, rarity] = match;
          if (!aggregated[name]) {
            const valueMatch = name.match(/金券\((\d+)円\)/);
            aggregated[name] = {
              name,
              rarity,
              count: 0,
              totalValue: valueMatch ? 0 : undefined,
            };
          }
          aggregated[name].count += 1;
          if (aggregated[name].totalValue !== undefined) {
             const val = parseInt(name.match(/\d+/)![0]);
             aggregated[name].totalValue! += val;
          }
        }
      });

      setRewards(Object.values(aggregated).sort((a,b) => b.count - a.count));
      setIsLoading(false);
    };

    fetchRewards();
  }, []);

  if (isLoading) return <div className="p-12 text-center font-bold text-slate-400">読み込み中...</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-200">
            <Gift className="text-white" size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">獲得したご褒美</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owned Rewards</p>
        </div>
      </div>

      {rewards.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="py-12 flex flex-col items-center justify-center text-slate-400">
                <Award size={48} className="mb-4 opacity-20" />
                <p className="font-bold">まだ報酬はありません</p>
                <p className="text-xs">ガチャを回してご褒美をゲットしよう！</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2">
          {rewards.map(reward => (
            <Card key={reward.name} className="overflow-hidden border-2 border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`h-1.5 ${rarityColors[reward.rarity]?.split(' ')[0] || 'bg-slate-200'}`} />
              <CardHeader className="p-4 pb-0">
                <div className="flex justify-between items-start mb-1">
                   <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rarityColors[reward.rarity] || 'bg-slate-100'}`}>
                    {reward.rarity}
                  </span>
                  <span className="text-xs font-black text-slate-400">x{reward.count}</span>
                </div>
                <CardTitle className="text-sm font-bold text-slate-700 leading-tight">
                    {reward.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {reward.totalValue !== undefined && (
                    <div className="flex items-center gap-1 text-indigo-600">
                        <Coins size={14} />
                        <span className="text-lg font-black">{reward.totalValue.toLocaleString()}</span>
                        <span className="text-[10px] font-bold">円分</span>
                    </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
