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
import { Calendar, User2, MessageSquare, ChevronRight } from "lucide-react";

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
    if (!selectedCategoryId || !selectedTaskName || !selectedAssignee) {
      toast.error("担当者と作業を選択してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const [year, month, day] = selectedDate.split("-").map(Number);
      const createdAt = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();

      const payload = {
        category: currentCategory?.name,
        task: currentTask?.name,
        base_score: currentTask?.score,
        note,
        assignee: selectedAssignee,
        created_at: createdAt,
      };

      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("記録に失敗しました。");

      const result = await response.json();
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      const score = result.score ?? 0;
      let toastMessage = `${selectedTaskName} (${score}pt) を記録しました！\n\n${randomPraise}`;

      if (result.multiplier && result.multiplier > 1) {
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
    } catch (error: any) {
      toast.error(error.message || "エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] h-[90vh] sm:h-auto max-h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50">
        <DialogHeader className="p-4 bg-white border-b shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            家事の記録
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-4 space-y-5 flex-1">
            
            {/* 基本設定セクション */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <Calendar size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">実施日</span>
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                  <User2 size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">担当者</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["けいすけ", "けいこ"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedAssignee(name)}
                      className={`h-11 rounded-xl text-sm font-bold border transition-all shadow-sm ${
                        selectedAssignee === name 
                        ? (name === "けいすけ" ? "bg-blue-600 border-blue-600 text-white" : "bg-pink-600 border-pink-600 text-white")
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 作業選択セクション */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ChevronRight size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">作業を選択</span>
              </div>
              
              <div className="space-y-4">
                {CHORE_CATEGORIES.map((category) => (
                  <div key={category.id} className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm space-y-2.5">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                      <category.icon size={14} className="text-indigo-400" />
                      <span className="text-xs font-black text-slate-500">{category.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {category.tasks.map((task) => {
                        const isSelected = selectedTaskName === task.name && selectedCategoryId === category.id;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setSelectedTaskName(task.name);
                            }}
                            className={`px-3 py-2 rounded-lg border text-sm transition-all duration-200 flex flex-col items-start gap-0.5 ${
                              isSelected 
                                ? "bg-indigo-600 border-indigo-600 text-white ring-2 ring-indigo-100 shadow-md" 
                                : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 active:scale-95"
                            }`}
                          >
                            <span className="font-bold leading-tight">{task.name}</span>
                            <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>{task.score}pt</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* メモセクション */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <MessageSquare size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">メモ (任意)</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="特記事項があれば..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm min-h-[80px]"
              />
            </div>
          </div>

          {/* フッター（ボタン固定） */}
          <div className="p-4 bg-white border-t mt-auto shrink-0">
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedCategoryId || !selectedTaskName || !selectedAssignee}
              className="w-full h-14 text-base font-black rounded-2xl shadow-lg transition-all active:scale-[0.98]"
            >
              {isSubmitting ? "送信中..." : "この内容で記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
