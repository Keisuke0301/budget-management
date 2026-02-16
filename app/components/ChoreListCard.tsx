"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCcw } from "lucide-react";
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
      setChores(data);
    } catch (error) {
      console.error(error);
      toast.error("家事ログの読み込みに失敗しました");
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
    <Card className="mt-6">
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
            {chores.map((chore) => (
              <li key={chore.id} className="flex justify-between items-start border-b pb-2 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">{chore.chore_name}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(chore.created_at), "M/d(E) HH:mm", { locale: ja })}
                    </span>
                  </div>
                  {chore.note && (
                    <p className="text-sm text-gray-600 mt-1">{chore.note}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={() => handleDelete(chore.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
