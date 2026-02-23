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

export default function RewardsScreen({ refreshTrigger }: { refreshTrigger: number }) {
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
             const valMatch = name.match(/\d+/);
             if (valMatch) {
               aggregated[name].totalValue! += parseInt(valMatch[0]);
             }
          }
        }
      });

      setRewards(Object.values(aggregated).sort((a,b) => b.count - a.count));
      setIsLoading(false);
    };

    fetchRewards();
  }, [refreshTrigger]);

  if (isLoading) return <div className="p-8 text-center font-bold text-slate-400 text-xs">読み込み中...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Gift className="text-indigo-500" size={18} />
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">獲得済みの報酬</h3>
      </div>

      {rewards.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <Award size={32} className="mb-2 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No Rewards Yet</p>
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-2">
          {rewards.map(reward => (
            <div key={reward.name} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-1">
              <div className="flex justify-between items-start">
                 <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border ${rarityColors[reward.rarity] || 'bg-slate-100'}`}>
                  {reward.rarity}
                </span>
                <span className="text-[10px] font-black text-slate-300 italic">x{reward.count}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 leading-tight line-clamp-2 min-h-[2.2em]">
                  {reward.name}
              </p>
              {reward.totalValue !== undefined && (
                  <div className="mt-1 pt-1 border-t border-slate-50 flex items-center gap-1 text-indigo-500">
                      <Coins size={10} />
                      <span className="text-xs font-black">{reward.totalValue.toLocaleString()}</span>
                      <span className="text-[8px] font-bold uppercase">Yen</span>
                  </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
