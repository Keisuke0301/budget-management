"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { DiaryRecord } from "@/app/types";

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: DiaryRecord | null;
}

export function DiaryModal({ isOpen, onClose, onSuccess, initialData }: DiaryModalProps) {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(format(new Date(initialData.date), "yyyy-MM-dd"));
        setContent(initialData.content);
      } else {
        setDate(format(new Date(), "yyyy-MM-dd"));
        setContent("");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !date) {
      toast.error("日付と内容を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const method = initialData ? "PATCH" : "POST";
      const payload = initialData ? { id: initialData.id, content, date } : { content, date };
      
      const response = await fetch("/api/diary", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`日記の${initialData ? '更新' : '記録'}に失敗しました。`);
      }

      toast.success(`日記を${initialData ? '更新' : '記録'}しました！`);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "日記を編集" : "日記を記録"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">日付</label>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">内容</label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日の出来事や感想を書きましょう"
              rows={5}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "処理中..." : (initialData ? "更新する" : "保存する")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
