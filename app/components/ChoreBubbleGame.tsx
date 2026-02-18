"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Chore, MasterCategory, MasterTask } from "@/app/types";
import { Button } from "@/components/ui/button";
import { isToday } from "date-fns";
import { PRAISE_MESSAGES } from "@/app/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";

export function ChoreBubbleGame({ 
  onUpdate, 
  refreshTrigger,
  masterData 
}: { 
  onUpdate: () => void, 
  refreshTrigger: number,
  masterData: MasterCategory[]
}) {
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const [selectedTask, setSelectedTask] = useState<(MasterTask & { area: string }) | null>(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poppingTask, setPoppingTask] = useState<string | null>(null);

  // バブル表示対象のタスクを抽出
  const bubbleTasks = useMemo(() => {
    const tasks: (MasterTask & { area: string })[] = [];
    masterData.forEach(cat => {
      cat.tasks.forEach(task => {
        if (task.is_bubble) {
          tasks.push({ ...task, area: cat.name });
        }
      });
    });
    return tasks;
  }, [masterData]);

  // 今日のボーナスタスクを決定 (日付ベースで決定論的に)
  const bonusInfo = useMemo(() => {
    if (bubbleTasks.length === 0) return null;
    
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    
    // 擬似乱数的なインデックス選択
    const taskIndex = seed % bubbleTasks.length;
    // 1/5の確率で3倍、それ以外は2倍
    const multiplier = (seed % 5 === 0) ? 3 : 2;
    
    return {
      taskId: bubbleTasks[taskIndex].id,
      multiplier
    };
  }, [bubbleTasks]);

  const fetchTodayChores = useCallback(async () => {
    try {
      const res = await fetch(`/api/chores?t=${Date.now()}`);
      if (!res.ok) throw new Error("取得失敗");
      const data: Chore[] = await res.json();

      const counts: Record<string, number> = {};
      data.forEach(chore => {
        if (chore.created_at && isToday(new Date(chore.created_at))) {
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

  const handleBubbleClick = (task: MasterTask & { area: string }) => {
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
        category: selectedTask.area,
        task: selectedTask.name,
        base_score: selectedTask.score,
        assignee: assignee,
        multiplier: selectedTask.id === bonusInfo?.taskId ? bonusInfo.multiplier : 1
      };

      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("記録に失敗しました。");

      const result = await response.json();
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      const baseScore = result.score ?? 0;
      const totalMultiplier = result.multiplier ?? 1;
      const finalScore = baseScore * totalMultiplier;
      
      let toastMessage = `${selectedTask.name} (${finalScore}pt) を記録しました！\n\n${randomPraise}`;

      // デイリーボーナスのメッセージ追加
      if (selectedTask.id === bonusInfo?.taskId) {
        toastMessage = `✨ デイリーボーナス適用！(x${bonusInfo.multiplier}) ✨\n` + toastMessage;
      }

      if (result.multiplier_message) {
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
  const tasksWithOrder = bubbleTasks.map((task, index) => {
    const previousSameTasks = bubbleTasks.slice(0, index).filter(
      t => t.area === task.area && t.name === task.name
    );
    return { ...task, order: previousSameTasks.length + 1 };
  });

  const tasksWithStatus = tasksWithOrder.map((t) => {
    const count = completedCounts[`${t.area}-${t.name}`] || 0;
    const isRepeatable = t.is_repeatable === true;
    const isBonus = t.id === bonusInfo?.taskId;
    return {
      ...t,
      count,
      isRepeatable,
      isBonus,
      bonusMultiplier: isBonus ? bonusInfo?.multiplier : 1,
      isCompleted: isRepeatable ? false : count >= t.order,
    };
  });

  const allCompleted = tasksWithStatus.every((t) => t.count >= t.order);
  const areas = Array.from(new Set(bubbleTasks.map(t => t.area)));

  return (
    <div className="relative w-full min-h-fit overflow-hidden bg-gradient-to-b from-blue-50/30 to-white rounded-3xl border border-blue-100/50 p-3 mb-4">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-100 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-pink-100 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 space-y-2.5 p-1">
        {allCompleted && (
          <div className="flex flex-col items-center justify-center pt-4 pb-2 text-emerald-500 animate-in fade-in slide-in-from-top-4 duration-1000">
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
            <div key={area} className="space-y-0.5">
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100/50 px-1.5 py-0.5 rounded-full">
                  {area}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-100 to-transparent"></div>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 p-0.5">
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

                      {/* 今日のボーナスバッジ */}
                      {task.isBonus && !task.isCompleted && (
                        <div className="absolute -top-1 -right-1 z-20">
                          <div className="bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-white animate-blink flex items-center gap-0.5">
                            <Sparkles size={8} className="fill-current" />
                            <span>x{task.bonusMultiplier}</span>
                          </div>
                        </div>
                      )}

                      {/* ステータス表示 (中央にDONEラベル + 回数) */}
                      {(task.isCompleted || task.count > 0) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 rounded-full pointer-events-none animate-in fade-in duration-500">
                          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black border shadow-lg flex items-center gap-1.5 transition-all duration-500 scale-110
                            ${task.isCompleted 
                              ? 'bg-emerald-500 text-white border-emerald-400' 
                              : 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-200/50'
                            }`}>
                            <span className="tracking-tight">DONE</span>
                            <span className="bg-white/20 px-1 rounded-sm text-[8px] min-w-[14px] text-center font-bold">
                              {task.count}
                            </span>
                          </div>
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
          {selectedTask?.id === bonusInfo?.taskId && (
            <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center gap-2 animate-blink">
              <Sparkles size={16} className="text-amber-500 fill-current" />
              <span className="text-sm font-black text-amber-700">デイリーボーナス対象！ (x{bonusInfo?.multiplier})</span>
            </div>
          )}
          <p className="text-center text-sm text-slate-500 mt-4">
            {selectedTask?.area} - {selectedTask?.name}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
