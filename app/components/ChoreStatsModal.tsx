"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Chore } from "@/app/types";
import { Trophy, User, Hash } from "lucide-react";

interface ChoreStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
}

interface Stats {
  totalPoints: number;
  count: number;
}

export function ChoreStatsModal({ isOpen, onClose, refreshTrigger }: ChoreStatsModalProps) {
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chores");
      if (!res.ok) throw new Error("取得失敗");
      const data: Chore[] = await res.json();

      const newStats: Record<string, Stats> = {
        "けいすけ": { totalPoints: 0, count: 0 },
        "けいこ": { totalPoints: 0, count: 0 }
      };

      data.filter(chore => chore.category !== 'ガチャ').forEach(chore => {
        const assignee = chore.assignee || "不明";
        if (!newStats[assignee]) {
          newStats[assignee] = { totalPoints: 0, count: 0 };
        }
        const multipliedScore = (chore.score || 0) * (chore.multiplier || 1);
        newStats[assignee].totalPoints += multipliedScore;
        newStats[assignee].count += 1;
      });

      setStats(newStats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, fetchStats, refreshTrigger]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="text-amber-500" />
            家事実績ランキング
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(stats).map(([name, data]) => (
            <div key={name} className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${name === 'けいすけ' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                    <User size={20} />
                  </div>
                  <span className="font-bold text-lg">{name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">累計スコア</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">
                    {data.totalPoints.toLocaleString()}<span className="text-sm font-bold ml-1">pt</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50/50 p-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <Hash size={14} />
                  <span>家事回数: <span className="font-bold text-slate-700">{data.count}</span> 回</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-200"></div>
                <div>
                  <span>平均: <span className="font-bold text-slate-700">{data.count > 0 ? Math.round(data.totalPoints / data.count) : 0}</span> pt</span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="text-center py-8 text-slate-400">
              集計中...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
