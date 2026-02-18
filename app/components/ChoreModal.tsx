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
      <DialogContent className="sm:max-w-[425px] max-h-[96vh] p-4 overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">家事記録</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 日付と担当者を一行に */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="date" className="text-[11px] font-bold text-slate-500 ml-1">実施日</label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 ml-1">担当者</label>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  type="button"
                  variant={selectedAssignee === "けいすけ" ? "default" : "outline"}
                  className={`h-9 text-xs font-bold px-0 ${
                    selectedAssignee === "けいすけ" ? "bg-blue-500 hover:bg-blue-600" : "border-blue-100 text-blue-600"
                  }`}
                  onClick={() => setSelectedAssignee("けいすけ")}
                >
                  けいすけ
                </Button>
                <Button
                  type="button"
                  variant={selectedAssignee === "けいこ" ? "default" : "outline"}
                  className={`h-9 text-xs font-bold px-0 ${
                    selectedAssignee === "けいこ" ? "bg-pink-500 hover:bg-pink-600" : "border-pink-100 text-pink-600"
                  }`}
                  onClick={() => setSelectedAssignee("けいこ")}
                >
                  けいこ
                </Button>
              </div>
            </div>
          </div>

          {/* 作業選択 (全てのカテゴリを展開 - よりコンパクトに) */}
          <div className="space-y-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
            {CHORE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <Icon size={10} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{category.name}</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {category.tasks.map((task) => {
                      const isSelected = selectedTaskName === task.name && selectedCategoryId === category.id;
                      return (
                        <button
                          key={task.id}
                          type="button"
                          className={`shrink-0 flex flex-col items-center justify-center min-w-[64px] h-10 rounded-lg border transition-all duration-200 ${
                            isSelected 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100" 
                              : "bg-white border-slate-200 text-slate-600 active:bg-slate-100"
                          }`}
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setSelectedTaskName(task.name);
                          }}
                        >
                          <span className="text-[9px] font-black leading-tight px-1 text-center">{task.name}</span>
                          <span className={`text-[7px] font-bold ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                            {task.score}pt
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* メモ入力 (高さを抑える) */}
          <div className="space-y-1">
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモがあれば入力（任意）"
              rows={1}
              className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[38px] resize-none"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedCategoryId || !selectedTaskName || !selectedAssignee} 
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            {isSubmitting ? "記録中..." : "記録する"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
