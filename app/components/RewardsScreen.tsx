'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Award, Coins, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type InventoryItem = {
  id: number;
  assignee: string;
  is_used: boolean;
  prize: {
    id: number;
    rarity: string;
    name: string;
    description: string;
  };
};

type AggregatedReward = {
  prize_id: number;
  name: string;
  rarity: string;
  items: InventoryItem[];
  totalValue?: number;
};

const rarityColors: { [key: string]: string } = {
  N: 'bg-slate-100 text-slate-600 border-slate-200',
  R: 'bg-blue-100 text-blue-600 border-blue-200',
  SR: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  UR: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function RewardsScreen({ refreshTrigger }: { refreshTrigger: number }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useLoading, setUseLoading] = useState<number | null>(null);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gacha/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const data = await res.json();
      setInventory(data);
    } catch (error) {
      console.error(error);
      toast.error('在庫の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory, refreshTrigger]);

  const handleUseReward = async (item: InventoryItem) => {
    if (!confirm(`「${item.prize.name}」を使用しますか？\n使用すると一覧から消えます。`)) return;

    setUseLoading(item.id);
    try {
      const res = await fetch('/api/gacha/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id: item.id }),
      });

      if (!res.ok) throw new Error('Failed to use reward');
      
      toast.success(`${item.prize.name}を使用しました！`);
      fetchInventory();
    } catch (error) {
      console.error(error);
      toast.error('報酬の使用に失敗しました');
    } finally {
      setUseLoading(null);
    }
  };

  const aggregateRewards = (items: InventoryItem[]) => {
    const aggregated: { [key: number]: AggregatedReward } = {};
    items.forEach(item => {
      const p = item.prize;
      if (!aggregated[p.id]) {
        const valueMatch = p.name.match(/金券\((\d+)円\)/);
        aggregated[p.id] = {
          prize_id: p.id,
          name: p.name,
          rarity: p.rarity,
          items: [],
          totalValue: valueMatch ? 0 : undefined,
        };
      }
      aggregated[p.id].items.push(item);
      if (aggregated[p.id].totalValue !== undefined) {
          const valMatch = p.name.match(/\d+/);
          if (valMatch) {
              aggregated[p.id].totalValue! += parseInt(valMatch[0]);
          }
      }
    });
    return Object.values(aggregated).sort((a, b) => b.items.length - a.items.length);
  };

  if (isLoading) return <div className="p-8 text-center font-bold text-slate-400 text-xs animate-pulse">読み込み中...</div>;

  const keisukeRewards = aggregateRewards(inventory.filter(i => i.assignee === 'keisuke' || i.assignee === 'けいすけ'));
  const keikoRewards = aggregateRewards(inventory.filter(i => i.assignee === 'keiko' || i.assignee === 'けいこ'));

  const renderAssigneeCard = (name: string, rewards: AggregatedReward[], icon: string, bgColor: string) => (
    <div className={`rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 bg-white`}>
      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-2xl ${bgColor}`}>
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <span className="font-black text-sm block leading-none">{name}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rewards</span>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[18px] font-black text-slate-700">{rewards.reduce((sum, r) => sum + r.items.length, 0)}</span>
           <span className="text-[10px] font-bold text-slate-400 ml-1 italic">items</span>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-300 opacity-60">
            <Award size={24} className="mb-1" />
            <p className="text-[9px] font-bold uppercase tracking-widest">No Rewards</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map(reward => (
            <div key={reward.prize_id} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border ${rarityColors[reward.rarity] || 'bg-slate-100'}`}>
                      {reward.rarity}
                    </span>
                    <span className="text-xs font-black text-slate-700">{reward.name}</span>
                  </div>
                  {reward.totalValue !== undefined && (
                    <div className="flex items-center gap-1 text-indigo-500 ml-1">
                      <Coins size={10} />
                      <span className="text-xs font-black">{reward.totalValue.toLocaleString()}円相当</span>
                    </div>
                  )}
                </div>
                <span className="bg-white px-2 py-0.5 rounded-lg border border-slate-100 text-[10px] font-black text-slate-400">
                  x{reward.items.length}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {reward.items.map((item, idx) => (
                  <Button
                    key={item.id}
                    size="sm"
                    variant="ghost"
                    disabled={useLoading === item.id}
                    onClick={() => handleUseReward(item)}
                    className="h-7 px-2 bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100 rounded-lg text-[9px] font-bold transition-all group"
                  >
                    {useLoading === item.id ? (
                      <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 size={12} className="mr-1 opacity-20 group-hover:opacity-100" />
                        使う
                      </>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-1">
        <Gift className="text-indigo-500" size={18} />
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">報酬の在庫管理</h3>
      </div>

      <div className="grid gap-6">
        {renderAssigneeCard('けいすけ', keisukeRewards, '👦', 'bg-blue-100 text-blue-600')}
        {renderAssigneeCard('けいこ', keikoRewards, '👧', 'bg-pink-100 text-pink-600')}
      </div>
    </div>
  );
}
