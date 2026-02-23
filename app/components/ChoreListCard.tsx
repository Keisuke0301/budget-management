"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCcw, Sparkles } from "lucide-react";
import { format, isToday } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { Chore } from "@/app/types";

export function ChoreListCard({ refreshTrigger, onDeleteSuccess }: { refreshTrigger: number, onDeleteSuccess?: () => void }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chores");
      if (!res.ok) throw new Error("家事ログの取得に失敗しました");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // ガチャの履歴を除外し、当日のデータのみに絞り込む
        const filteredData = data
          .filter((chore: Chore) => chore.category !== 'ガチャ')
          .filter((chore: Chore) => 
            chore.created_at && isToday(new Date(chore.created_at))
          );
        setChores(filteredData);
      } else {
        setChores([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("家事ログの読み込みに失敗しました");
      setChores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChores();
  }, [fetchChores, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除しますか？")) return;

    try {
      const res = await fetch(`/api/chores?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      toast.success("削除しました");
      fetchChores();
      if (onDeleteSuccess) onDeleteSuccess();
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div className="space-y-3">
      {chores.length === 0 ? (
        <div className="text-center text-slate-400 py-10 text-[11px] font-bold bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          今日の記録はありません
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {chores.map((chore) => {
            const isLucky = chore.multiplier && chore.multiplier > 1;
            const totalScore = (chore.score || 0) * (chore.multiplier || 1);
            return (
              <li key={chore.id} className="flex items-center gap-2 py-2.5 group">
                {/* 日付 */}
                <span className="text-[11px] text-slate-400 tabular-nums w-9 shrink-0">
                  {format(new Date(chore.created_at), "M/d", { locale: ja })}
                </span>
                
                {/* 分類 */}
                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  {chore.category}
                </span>
                
                {/* 項目 */}
                <span className="text-sm font-medium text-slate-700 truncate flex-1 min-w-0">
                  {chore.task}
                </span>
                
                {/* 担当者 */}
                {chore.assignee && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    chore.assignee === 'keisuke' ? 'bg-blue-50 text-blue-500' :
                    chore.assignee === 'keiko' ? 'bg-pink-50 text-pink-500' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {chore.assignee === 'keisuke' ? 'けいすけ' : chore.assignee === 'keiko' ? 'けいこ' : chore.assignee}
                  </span>
                )}
                
                {/* 点数 */}
                <div className="flex items-center gap-0.5 w-12 justify-end shrink-0">
                  <span className={`text-xs font-black tabular-nums ${isLucky ? 'text-amber-500' : 'text-slate-600'}`}>
                    {totalScore}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">pt</span>
                  {isLucky && <Sparkles size={10} className="text-amber-500 animate-pulse ml-0.5" />}
                </div>

                {/* 削除ボタン */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(chore.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
