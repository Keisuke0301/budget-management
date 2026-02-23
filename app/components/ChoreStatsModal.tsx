"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Chore, Totals } from "@/app/types";
import { Trophy, User, Hash, Gift, BarChart3 } from "lucide-react";
import Gacha from "./Gacha";
import RewardsScreen from "./RewardsScreen";
import { Button } from "@/components/ui/button";

interface ChoreStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
  totals: Totals;
  onGachaDraw: () => void;
}

interface Stats {
  totalPoints: number;
  count: number;
}

export function ChoreStatsModal({ isOpen, onClose, refreshTrigger, totals, onGachaDraw }: ChoreStatsModalProps) {
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'stats' | 'rewards'>('stats');

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
        const displayName = (assignee === 'keisuke' || assignee === 'けいすけ') ? 'けいすけ' : 
                          (assignee === 'keiko' || assignee === 'けいこ') ? 'けいこ' : assignee;
        
        if (!newStats[displayName]) {
          newStats[displayName] = { totalPoints: 0, count: 0 };
        }
        const multipliedScore = (chore.score || 0) * (chore.multiplier || 1);
        newStats[displayName].totalPoints += multipliedScore;
        newStats[displayName].count += 1;
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Trophy className="text-amber-500" size={20} />
                <span className="font-black tracking-tight">家事実績 ＆ ご褒美</span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveView('stats')}
                    className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'stats' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <BarChart3 size={14} className="mr-1" />
                    Stats
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveView('rewards')}
                    className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeView === 'rewards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Gift size={14} className="mr-1" />
                    Rewards
                </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {activeView === 'stats' ? (
            <div className="space-y-4">
              {Object.entries(stats).map(([name, data]) => {
                const assigneeKey = name === 'けいすけ' ? 'keisuke' : 'keiko';
                const currentPoints = totals[assigneeKey];

                return (
                  <div key={name} className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${name === 'けいすけ' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                          <User size={20} />
                        </div>
                        <div>
                            <span className="font-black text-lg block leading-none">{name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Points</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">
                          {currentPoints.toLocaleString()}<span className="text-xs font-bold ml-1 italic text-slate-400">pt</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 bg-slate-50/80 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 flex-1">
                        <Hash size={12} className="text-slate-300" />
                        <span>家事回数: <span className="text-slate-700 font-black">{data.count}</span></span>
                      </div>
                      <div className="h-4 w-[1px] bg-slate-200"></div>
                      <div className="flex-1">
                        <span>平均スコア: <span className="text-slate-700 font-black">{data.count > 0 ? Math.round(data.totalPoints / data.count) : 0}</span></span>
                      </div>
                    </div>

                    <div className="pt-1">
                        <Gacha 
                            assignee={assigneeKey} 
                            points={currentPoints} 
                            onGachaDraw={onGachaDraw} 
                        />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <RewardsScreen refreshTrigger={refreshTrigger} />
          )}

          {loading && (activeView === 'stats') && (
            <div className="text-center py-12 text-slate-300 animate-pulse text-xs font-bold tracking-[0.2em] uppercase">
              Analyzing Data...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
