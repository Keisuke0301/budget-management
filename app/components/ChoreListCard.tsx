"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCcw, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { Chore } from "@/app/types";

export function ChoreListCard({ refreshTrigger }: { refreshTrigger: number }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChores = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chores");
      if (!res.ok) throw new Error("家事ログの取得に失敗しました");
      const data = await res.json();
      if (Array.isArray(data)) {
        setChores(data);
      } else {
        console.error("API response is not an array:", data);
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
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  return (
    <Card className="mt-6 mb-24">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">最近の家事ログ</CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchChores} disabled={loading}>
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent>
        {chores.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            まだ記録がありません
          </div>
        ) : (
          <ul className="space-y-3">
            {chores.map((chore) => {
              const isLucky = chore.multiplier && chore.multiplier > 1;
              return (
                <li key={chore.id} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-base">{chore.chore_name}</span>
                      {chore.assignee && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          chore.assignee === 'けいすけ' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          chore.assignee === 'けいこ' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {chore.assignee === 'けいすけ' ? '👦' : chore.assignee === 'けいこ' ? '👧' : '👤'} {chore.assignee}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(chore.created_at), "M/d(E) HH:mm", { locale: ja })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {typeof chore.score === 'number' && (
                        <span className={`text-sm font-bold ${isLucky ? 'text-amber-500 flex items-center gap-1' : 'text-slate-600'}`}>
                          {isLucky && <Sparkles size={12} />}
                          {chore.score} pt
                          {isLucky && <span className="text-xs font-normal ml-1">({chore.multiplier}倍!)</span>}
                        </span>
                      )}
                    </div>
                    {chore.note && (
                      <p className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-200">{chore.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 shrink-0"
                    onClick={() => handleDelete(chore.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
