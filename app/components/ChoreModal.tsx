"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PRAISE_MESSAGES } from "@/app/lib/constants";
import { ICON_MAP } from "@/app/lib/choreConstants";
import { format } from "date-fns";
import { MasterCategory, MasterTask } from "@/app/types";

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterData: MasterCategory[];
}

export function ChoreModal({ isOpen, onClose, onSuccess, masterData }: ChoreModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
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

  const currentCategory = masterData.find(c => c.id === selectedCategoryId);
  const currentTask = currentCategory?.tasks.find(t => t.name === selectedTaskName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategory || !currentTask || selectedAssignees.length === 0) {
      toast.error("分類、タスク、担当者を選択してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      // 選択された日付に現在の時刻を付与してISO文字列にする
      const now = new Date();
      const [year, month, day] = selectedDate.split("-").map(Number);
      const createdAt = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

      const payload = {
        category: currentCategory.name,
        task: currentTask.name,
        base_score: currentTask.score,
        note,
        assignees: selectedAssignees,
        created_at: createdAt,
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
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      
      // 複数人登録の場合、APIは配列を返すことを想定
      const firstResult = Array.isArray(result) ? result[0] : result;
      const score = firstResult.score ?? 0;
      let toastMessage = `${currentTask.name} (${score.toFixed(1)}pt) を記録しました！\n\n${randomPraise}`;

      if (firstResult.multiplier && firstResult.multiplier > 1 && firstResult.multiplier_message) {
        toastMessage = `${firstResult.multiplier_message}\n` + toastMessage;
        toast.success(toastMessage, { duration: 5000 });
      } else {
        toast.success(toastMessage);
      }

      setSelectedCategoryId(null);
      setSelectedTaskName(null);
      setSelectedAssignees([]);
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

          {/* 日付選択 */}
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">実施日</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* 担当者選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">担当者 (複数選択可)</label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedAssignees.includes("けいすけ") ? "default" : "outline"}
                className={`h-12 text-lg font-bold transition-all ${
                  selectedAssignees.includes("けいすけ")
                    ? "bg-blue-500 hover:bg-blue-600 ring-2 ring-blue-200 text-white"
                    : "border-blue-200 text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => {
                  setSelectedAssignees(prev =>
                    prev.includes("けいすけ")
                      ? prev.filter(n => n !== "けいすけ")
                      : [...prev, "けいすけ"]
                  );
                }}
              >
                けいすけ
              </Button>
              <Button
                type="button"
                variant={selectedAssignees.includes("けいこ") ? "default" : "outline"}
                className={`h-12 text-lg font-bold transition-all ${
                  selectedAssignees.includes("けいこ")
                    ? "bg-pink-500 hover:bg-pink-600 ring-2 ring-pink-200 text-white"
                    : "border-pink-200 text-pink-600 hover:bg-pink-50"
                }`}
                onClick={() => {
                  setSelectedAssignees(prev =>
                    prev.includes("けいこ")
                      ? prev.filter(n => n !== "けいこ")
                      : [...prev, "けいこ"]
                  );
                }}
              >
                けいこ
              </Button>
            </div>
          </div>

          {/* 分類選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">分類</label>
            <div className="grid grid-cols-5 gap-1">
              {masterData.map((category) => {
                const Icon = ICON_MAP[category.icon_name] || ICON_MAP.MoreHorizontal;
                const isSelected = selectedCategoryId === category.id;
                return (
                  <Button
                    key={category.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-14 px-0 flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected 
                        ? "ring-2 ring-offset-1 ring-blue-500 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" 
                        : "text-slate-500 border-slate-200"
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <Icon size={14} />
                    <span className="text-[10px] font-bold leading-none">{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* タスク選択 (カテゴリが選択されている場合のみ表示) */}
          {currentCategory && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-sm font-medium">作業 ({currentCategory.name})</label>
              <div className="flex flex-col gap-2">
                {currentCategory.tasks.map((task, index) => {
                  const isSelected = selectedTaskName === task.name;
                  return (
                    <Button
                      key={index}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto min-h-12 py-2 px-4 flex items-center justify-between w-full text-left ${isSelected ? "ring-2 ring-offset-1 ring-green-500 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : ""}`}
                      onClick={() => setSelectedTaskName(task.name)}
                    >
                      <span className="text-sm font-bold">{task.name}</span>
                      <span className="text-xs opacity-80">{task.score} pt</span>
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
            <input
              type="text"
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモがあれば入力"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting || !selectedCategoryId || !selectedTaskName || selectedAssignees.length === 0} className="w-full sm:w-auto">
              {isSubmitting ? "記録中..." : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
