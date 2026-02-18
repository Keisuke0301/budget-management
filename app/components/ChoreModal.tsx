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
import { CHORE_CATEGORIES } from "@/app/lib/choreConstants";
import { format } from "date-fns";

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChoreModal({ isOpen, onClose, onSuccess }: ChoreModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // 選択された日付に現在の時刻を付与してISO文字列にする
      const now = new Date();
      const [year, month, day] = selectedDate.split("-").map(Number);
      const createdAt = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

      const payload = {
        category: currentCategory.name,
        task: currentTask.name,
        base_score: currentTask.score,
        note,
        assignee: selectedAssignee,
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
      const score = result.score ?? 0;
      let toastMessage = `${currentTask.name} (${score}pt) を記録しました！\n\n${randomPraise}`;

      if (result.multiplier && result.multiplier > 1 && result.multiplier_message) {
        toastMessage = `${result.multiplier_message}\n` + toastMessage;
        toast.success(toastMessage, { duration: 5000 });
      } else {
        toast.success(toastMessage);
      }

      setSelectedCategoryId(null);
      setSelectedTaskName(null);
      setSelectedAssignee(null);
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
            <label className="text-sm font-medium">担当者</label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedAssignee === "けいすけ" ? "default" : "outline"}
                className={`h-12 text-lg font-bold transition-all ${
                  selectedAssignee === "けいすけ"
                    ? "bg-blue-500 hover:bg-blue-600 ring-2 ring-blue-200"
                    : "border-blue-200 text-blue-600 hover:bg-blue-50"
                }`}
                onClick={() => setSelectedAssignee("けいすけ")}
              >
                けいすけ
              </Button>
              <Button
                type="button"
                variant={selectedAssignee === "けいこ" ? "default" : "outline"}
                className={`h-12 text-lg font-bold transition-all ${
                  selectedAssignee === "けいこ"
                    ? "bg-pink-500 hover:bg-pink-600 ring-2 ring-pink-200"
                    : "border-pink-200 text-pink-600 hover:bg-pink-50"
                }`}
                onClick={() => setSelectedAssignee("けいこ")}
              >
                けいこ
              </Button>
            </div>
          </div>

          {/* 作業選択 (全てのカテゴリを展開) */}
          <div className="space-y-4">
            <label className="text-sm font-medium">作業を選択</label>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 -mr-2">
              {CHORE_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-1">
                      <Icon size={12} className="text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{category.name}</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar">
                      {category.tasks.map((task) => {
                        const isSelected = selectedTaskName === task.name && selectedCategoryId === category.id;
                        return (
                          <Button
                            key={task.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className={`h-auto py-2 px-3 shrink-0 flex flex-col items-center gap-0.5 min-w-[80px] transition-all duration-200 ${
                              isSelected 
                                ? "ring-2 ring-offset-1 ring-indigo-500 bg-indigo-600 hover:bg-indigo-700 text-white border-transparent" 
                                : "hover:bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setSelectedTaskName(task.name);
                            }}
                          >
                            <span className="text-[10px] leading-tight font-bold">{task.name}</span>
                            <span className={`text-[8px] font-medium ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                              {task.score}pt
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
            <Button type="submit" disabled={isSubmitting || !selectedCategoryId || !selectedTaskName || !selectedAssignee} className="w-full sm:w-auto">
              {isSubmitting ? "記録中..." : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
