"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Chore } from "@/app/types";
import { Button } from "@/components/ui/button";
import { isToday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface DailyTask {
  category: string;
  task: string;
  score: number;
  icon: string;
}

const DAILY_TASKS: DailyTask[] = [
  { category: "食事", task: "料理", score: 3, icon: "🍳" },
  { category: "食事", task: "皿洗い", score: 6, icon: "🧼" },
  { category: "食事", task: "食器片付け", score: 1, icon: "🍽️" },
  { category: "掃除", task: "部屋", score: 9, icon: "🧹" },
  { category: "掃除", task: "風呂", score: 6, icon: "🛀" },
  { category: "掃除", task: "トイレ", score: 7, icon: "🚽" },
  { category: "洗濯", task: "洗濯", score: 2, icon: "🧺" },
  { category: "洗濯", task: "干し", score: 8, icon: "👕" },
  { category: "洗濯", task: "取込・畳み", score: 5, icon: "👕" },
  { category: "ペット", task: "えさ(デグー)", score: 1, icon: "🐭" },
  { category: "ペット", task: "えさ(魚)", score: 1, icon: "🐟" },
  { category: "その他", task: "ごみまとめ", score: 2, icon: "🗑️" },
  { category: "その他", task: "ごみ捨て(通常)", score: 2, icon: "🏃" },
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

export function ChoreBubbleGame({ onUpdate }: { onUpdate: () => void }) {
  const [completedTaskKeys, setCompletedTaskKeys] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [poppingTask, setPoppingTask] = useState<string | null>(null);

  const fetchTodayChores = useCallback(async () => {
    try {
      const res = await fetch("/api/chores");
      if (!res.ok) throw new Error("取得失敗");
      const data: Chore[] = await res.json();

      const completed = new Set<string>();
      data.forEach(chore => {
        if (chore.created_at && isToday(new Date(chore.created_at))) {
          completed.add(`${chore.category}-${chore.task}`);
        }
      });
      setCompletedTaskKeys(completed);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchTodayChores();
  }, [fetchTodayChores]);

  const handleBubbleClick = (task: DailyTask) => {
    setPoppingTask(`${task.category}-${task.task}`);
    // はじけるアニメーションの後にモーダルを出す
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
        chore_name: `${selectedTask.category} - ${selectedTask.task}`,
        category: selectedTask.category,
        task: selectedTask.task,
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
      let toastMessage = `${selectedTask.task} (${score}pt) を記録しました！\n${randomPraise}`;

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

  const activeTasks = DAILY_TASKS.filter(
    (t) => !completedTaskKeys.has(`${t.category}-${t.task}`)
  );

  return (
    <div className="relative w-full min-h-[500px] overflow-hidden bg-gradient-to-b from-blue-50/30 to-white rounded-3xl border border-blue-100/50 p-4 mb-24">
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-100 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-6 p-4">
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">今日のタスクはすべて完了しました！</p>
            <p className="text-xs mt-1">お疲れ様です ✨</p>
          </div>
        ) : (
          activeTasks.map((task, index) => {
            const isPopping = poppingTask === `${task.category}-${task.task}`;
            // ランダムなアニメーション設定
            const delay = (index * 0.2) % 2;
            const duration = 3 + (index % 3);

            return (
              <button
                key={`${task.category}-${task.task}`}
                data-slot="bubble"
                onClick={() => handleBubbleClick(task)}
                disabled={isPopping}
                className={`
                  relative w-24 h-24 rounded-full flex flex-col items-center justify-center
                  bg-white/40 backdrop-blur-sm border border-white/60 shadow-lg
                  transition-all duration-300 hover:scale-110 active:scale-95
                  ${isPopping ? 'animate-ping opacity-0 scale-150' : ''}
                `}
                style={{
                  animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`,
                }}
              >
                <span className="text-3xl mb-1">{task.icon}</span>
                <span className="text-[10px] font-bold text-slate-600 px-2 text-center leading-tight">
                  {task.task}
                </span>
                {/* 泡のハイライト効果 */}
                <div className="absolute top-2 left-4 w-4 h-2 bg-white/60 rounded-full rotate-[-20deg]"></div>
              </button>
            );
          })
        )}
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
            {selectedTask?.category} - {selectedTask?.task}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
