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
import { Sparkles, Shirt, Utensils, ShoppingBag, Trash2 } from "lucide-react";

interface ChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_CHORES = [
  { name: "掃除", icon: Sparkles },
  { name: "洗濯", icon: Shirt },
  { name: "料理", icon: Utensils },
  { name: "買い物", icon: ShoppingBag },
  { name: "ゴミ出し", icon: Trash2 },
];

export function ChoreModal({ isOpen, onClose, onSuccess }: ChoreModalProps) {
  const [choreName, setChoreName] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreName.trim()) {
      toast.error("家事の内容を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chore_name: choreName, note }),
      });

      if (!response.ok) {
        throw new Error("家事の記録に失敗しました。");
      }

      toast.success("記録しました！");
      setChoreName("");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>家事記録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="chore-name" className="text-sm font-medium">
              家事の内容
            </label>
            <Input
              id="chore-name"
              value={choreName}
              onChange={(e) => setChoreName(e.target.value)}
              placeholder="例: お風呂掃除"
              required
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_CHORES.map((chore, index) => {
                const Icon = chore.icon;
                return (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    className="h-8 px-2 text-xs flex items-center gap-1"
                    onClick={() => setChoreName(chore.name)}
                  >
                    <Icon size={14} />
                    {chore.name}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              メモ (任意)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモがあれば入力"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "記録中..." : "記録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
