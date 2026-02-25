"use client";

import { useState, useEffect, useCallback } from "react";
import { DiaryRecord } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Book, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DiaryScreenProps {
  refreshTrigger: number;
}

export default function DiaryScreen({ refreshTrigger }: DiaryScreenProps) {
  const [entries, setEntries] = useState<DiaryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/diary");
      if (!res.ok) throw new Error("取得失敗");
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error(error);
      toast.error("日記の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm("この日記を削除しますか？")) return;

    try {
      const res = await fetch(`/api/diary?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除失敗");
      toast.success("削除しました");
      fetchEntries();
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Book className="text-indigo-500" size={24} />
        <h2 className="text-xl font-black">日記一覧</h2>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="font-bold">日記がまだありません。</p>
          <p className="text-sm">右下の＋ボタンから記録しましょう！</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden border-none shadow-sm rounded-3xl bg-white">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black text-indigo-600">
                  {format(new Date(entry.date), "yyyy年M月d日 (E)", { locale: ja })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-red-500"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {entry.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
