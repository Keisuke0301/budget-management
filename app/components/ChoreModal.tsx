"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Utensils, Sparkles, Shirt, Fish, MoreHorizontal } from "lucide-react";

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 分類とタスクの定義
const CHORE_CATEGORIES = [
  {
    id: "meal",
    name: "食事",
    icon: Utensils,
    tasks: [
      { name: "料理", score: 3 },
      { name: "弁当", score: 6 },
      { name: "食器洗い", score: 6 },
      { name: "食器片付け", score: 1 },
    ],
  },
  {
    id: "cleaning",
    name: "掃除",
    icon: Sparkles,
    tasks: [
      { name: "部屋", score: 9 },
      { name: "風呂", score: 6 },
      { name: "トイレ", score: 7 },
      { name: "洗車", score: 9 },
    ],
  },
  {
    id: "laundry",
    name: "洗濯",
    icon: Shirt,
    tasks: [
      { name: "洗濯", score: 2 },
      { name: "干し", score: 8 },
      { name: "取込・畳み", score: 5 },
    ],
  },
  {
    id: "pet",
    name: "ペット",
    icon: Fish,
    tasks: [
      { name: "えさ(デグー)", score: 1 },
      { name: "掃除(デグー)", score: 7 },
      { name: "えさ(魚)", score: 1 },
      { name: "掃除(魚)", score: 10 },
    ],
  },
  {
    id: "other",
    name: "その他",
    icon: MoreHorizontal,
    tasks: [
      { name: "ごみまとめ", score: 2 },
      { name: "ごみ捨て(通常)", score: 2 },
      { name: "ごみ捨て(資源ごみ)", score: 10 },
      { name: "散髪", score: 10 },
    ],
  },
];

const PRAISE_MESSAGES = [
  "おなす！🍆",
  "ゴッド！👆",
  "ヘルプミー！🆘",
  "富士山でかい！🗻",
  "素早いうなぎか！🐍",
  "キウイ!🥝",
  "おちん！🍭",
];

export function ChoreModal({ isOpen, onClose, onSuccess }: ChoreModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // カテゴリ選択時のハンドラ
  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null); // 選択解除
    } else {
      setSelectedCategoryId(categoryId);
    }
    setSelectedTaskName(null); // タスク選択はリセット
  };

  const currentCategory = CHORE_CATEGORIES.find(c => c.id === selectedCategoryId);
  const currentTask = currentCategory?.tasks.find(t => t.name === selectedTaskName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory || !currentTask) {
      toast.error("分類とタスクを選択してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        chore_name: `${currentCategory.name} - ${currentTask.name}`,
        category: currentCategory.name,
        task: currentTask.name,
        base_score: currentTask.score,
        note,
      };

      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("家事の記録に失敗しました。");
      }

      const result = await response.json();

      // 称賛メッセージをランダムに選択
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];

      // トースト表示の構築
      const score = result.score ?? 0;
      let toastMessage = `${currentTask.name} (${score}pt) を記録しました！\n${randomPraise}`;

      if (result.multiplier && result.multiplier > 1 && result.multiplier_message) {
        // 大当たりの場合はメッセージを追加
        toastMessage = `${result.multiplier_message}\n` + toastMessage;
        toast.success(toastMessage, { duration: 5000 });
      } else {
        toast.success(toastMessage);
      }

      // 状態リセット
      setSelectedCategoryId(null);
      setSelectedTaskName(null);
      setNote("");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "エラーが発生しました";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>家事記録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 分類選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">分類</label>
            <div className="flex flex-wrap gap-2">
              {CHORE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategoryId === category.id;
                return (
                  <Button
                    key={category.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 px-3 flex items-center gap-2 ${isSelected ? "ring-2 ring-offset-1 ring-blue-500 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : ""}`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <Icon size={16} />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* タスク選択 (カテゴリが選択されている場合のみ表示) */}
          {currentCategory && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium">作業 ({currentCategory.name})</label>
              <div className="grid grid-cols-2 gap-2">
                {currentCategory.tasks.map((task, index) => {
                  const isSelected = selectedTaskName === task.name;
                  return (
                    <Button
                      key={index}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto py-2 px-3 justify-start text-left ${isSelected ? "ring-2 ring-offset-1 ring-green-500 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : ""}`}
                      onClick={() => setSelectedTaskName(task.name)}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="text-sm font-medium">{task.name}</span>
                        <span className="text-xs opacity-70">{task.score} pt</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* メモ入力 */}
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              メモ (任意)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモがあれば入力"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting || !selectedCategoryId || !selectedTaskName} className="w-full sm:w-auto">
              {isSubmitting ? "記録中..." : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
