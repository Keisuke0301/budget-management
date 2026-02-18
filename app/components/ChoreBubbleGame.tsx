"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Chore } from "@/app/types";
import { Button } from "@/components/ui/button";
import { isToday } from "date-fns";
import { PRAISE_MESSAGES } from "@/app/lib/constants";
import { BUBBLE_TASKS } from "@/app/lib/choreConstants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";

export function ChoreBubbleGame({ onUpdate, refreshTrigger }: { onUpdate: () => void, refreshTrigger: number }) {
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const [selectedTask, setSelectedTask] = useState<typeof BUBBLE_TASKS[0] | null>(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poppingTask, setPoppingTask] = useState<string | null>(null);

  const fetchTodayChores = useCallback(async () => {
    try {
      const res = await fetch(`/api/chores?t=${Date.now()}`);
      if (!res.ok) throw new Error("取得失敗");
      const data: Chore[] = await res.json();

      const counts: Record<string, number> = {};
      data.forEach(chore => {
        if (chore.created_at && isToday(new Date(chore.created_at))) {
          // category は choreConstants で定義された親カテゴリ名（食事、洗濯等）が入る想定
          const key = `${chore.category}-${chore.task}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setCompletedCounts(counts);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchTodayChores();
  }, [fetchTodayChores, refreshTrigger]);

  const handleBubbleClick = (task: typeof BUBBLE_TASKS[0]) => {
    setPoppingTask(task.id);
    setTimeout(() => {
      setSelectedTask(task);
      setIsAssigneeModalOpen(true);
      setPoppingTask(null);
    }, 400);
  };

  const handleRecord = async (assignee: string) => {
    if (!selectedTask) return;

    setIsSubmitting(true);
    try {
      const payload = {
        category: selectedTask.area, // BUBBLE_TASKS の area を category として送信
        task: selectedTask.name,
        base_score: selectedTask.score,
        assignee: assignee,
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
      let toastMessage = `${selectedTask.name} (${score}pt) を記録しました！\n\n${randomPraise}`;

      if (result.multiplier && result.multiplier > 1) {
        toastMessage = `${result.multiplier_message}\n` + toastMessage;
        toast.success(toastMessage, { duration: 5000 });
      } else {
        toast.success(toastMessage);
      }

      setIsAssigneeModalOpen(false);
      setSelectedTask(null);
      fetchTodayChores();
      onUpdate();
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 各タスクにその種類内での出現順序を割り当てる
  const tasksWithOrder = BUBBLE_TASKS.map((task, index) => {
    const previousSameTasks = BUBBLE_TASKS.slice(0, index).filter(
      t => t.area === task.area && t.name === task.name
    );
    return { ...task, order: previousSameTasks.length + 1 };
  });

  const tasksWithStatus = tasksWithOrder.map((t) => {
    const count = completedCounts[`${t.area}-${t.name}`] || 0;
    const isRepeatable = (t as any).repeatable === true;
    return {
      ...t,
      count,
      isRepeatable,
      isCompleted: isRepeatable ? false : count >= t.order,
    };
  });

  const allCompleted = tasksWithStatus.every((t) => t.count >= t.order);
  const areas = ["食事", "洗濯", "ペット"] as const;

  return (
    <div className="relative w-full min-h-fit overflow-hidden bg-gradient-to-b from-blue-50/30 to-white rounded-3xl border border-blue-100/50 p-3 mb-4">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-100 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-pink-100 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 space-y-4 p-1">
        {allCompleted && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4 text-emerald-500 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs font-bold">今日のタスクはすべて完了しました！ お疲れ様です ✨</p>
            </div>
          </div>
        )}

        {areas.map((area) => {
          const areaTasks = tasksWithStatus.filter((t) => t.area === area);
          if (areaTasks.length === 0) return null;

          return (
            <div key={area} className="space-y-1">
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                  {area}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 p-1">
                {areaTasks.map((task, index) => {
                  const isPopping = poppingTask === task.id;
                  const isCompleted = task.isCompleted;
                  const animIndex = (index % 4) + 1;
                  const delay = (index * 0.3) % 2;
                  const duration = 4 + (index % 3);

                  return (
                    <button
                      key={task.id}
                      data-slot="bubble"
                      onClick={() => handleBubbleClick(task)}
                      disabled={isPopping || task.isCompleted}
                      className={`
                        relative w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center
                        bg-white/40 backdrop-blur-sm border border-white/60 shadow-lg
                        transition-all duration-300
                        ${task.isCompleted ? 'grayscale opacity-40 scale-90' : 'hover:scale-110 active:scale-95'}
                        ${isPopping ? 'animate-ping opacity-0 scale-150' : ''}
                        ${task.count > 0 && !task.isCompleted ? 'border-emerald-200/50 ring-2 ring-emerald-500/10' : ''}
                      `}
                      style={{
                        animation: task.isCompleted ? 'none' : `float-${animIndex} ${duration}s ease-in-out ${delay}s infinite alternate`,
                      }}
                    >
                      <span className="text-xl mb-0">{task.icon}</span>
                      <span className="text-[7.5px] font-bold text-slate-600 px-1 text-center leading-[1.1]">
                        {task.name}
                      </span>
                      {/* ステータス表示 (DONEラベル) */}
                      {(task.isCompleted || task.count > 0) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/5 rounded-full pointer-events-none">
                          {task.isCompleted && (
                            <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-sm mb-1.5 animate-in zoom-in">
                              <Check className="w-2.5 h-2.5 stroke-[4]" />
                            </div>
                          )}
                          <div className={`px-1.5 rounded-full text-[7px] font-black border backdrop-blur-sm shadow-sm transition-all duration-500
                            ${task.isCompleted 
                              ? 'bg-emerald-500 text-white border-emerald-400 mt-1' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100 absolute bottom-1'
                            }`}>
                            DONE
                          </div>
                        </div>
                      )}

                      {/* 回数バッジ (リピート可能または複数バブルある場合) */}
                      {task.count > 0 && (
                        <div className="absolute -top-1 -right-1 flex items-center justify-center">
                          <div className={`
                            min-w-[22px] h-[22px] px-1 flex flex-col items-center justify-center rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300
                            ${task.isCompleted ? 'bg-slate-500 text-white' : 'bg-indigo-600 text-white'}
                          `}>
                            <span className="text-[10px] leading-none font-black">{task.count}</span>
                            <span className="text-[5px] leading-none font-bold opacity-80 uppercase tracking-tighter">回</span>
                          </div>
                          {!task.isCompleted && (
                            <div className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping -z-10"></div>
                          )}
                        </div>
                      )}
                      {!task.isCompleted && (
                        <div className="absolute top-2 left-4 w-4 h-2 bg-white/60 rounded-full rotate-[-20deg]"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })
        }
      </div>

      <Dialog open={isAssigneeModalOpen} onOpenChange={setIsAssigneeModalOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle className="text-center">誰がやりましたか？</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              className="h-24 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200"
              onClick={() => handleRecord("けいすけ")}
              disabled={isSubmitting}
            >
              <span className="text-2xl">👦</span>
              けいすけ
            </Button>
            <Button
              className="h-24 flex flex-col gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200"
              onClick={() => handleRecord("けいこ")}
              disabled={isSubmitting}
            >
              <span className="text-2xl">👧</span>
              けいこ
            </Button>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            {selectedTask?.area} - {selectedTask?.name}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
