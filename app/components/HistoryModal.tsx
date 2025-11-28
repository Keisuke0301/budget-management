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

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void; // データが変更されたことを親に通知する
}

interface Expense {
  row: number; // idのエイリアス
  timestamp: number;
  category: string;
  amount: number;
}

export function HistoryModal({ isOpen, onClose, onDataChange }: HistoryModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/expenses') // 週次履歴を取得
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setExpenses(data);
        })
        .catch(err => toast.error(`履歴の取得に失敗: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleDelete = async (id: number) => {
    const originalExpenses = [...expenses];
    // UIから即座に削除
    setExpenses(prev => prev.filter(exp => exp.row !== id));
    
    toast.info("削除しています...");

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error("削除に失敗しました。");
      }
      toast.success("削除しました。");
      onDataChange(); // 親コンポーネントの合計データを更新
    } catch (error) {
      toast.error("削除に失敗しました。画面を更新してください。");
      // 失敗した場合はUIを元に戻す
      setExpenses(originalExpenses);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content">
        <DialogHeader className="modal-header">
          <DialogTitle className="modal-title">今週の履歴</DialogTitle>
        </DialogHeader>
        <div id="history-list-container" className="modal-form-container">
          {loading ? (
            <p>読み込み中...</p>
          ) : expenses.length === 0 ? (
            <p>今週の支出はまだありません。</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {expenses.map((expense) => {
                const date = new Date(expense.timestamp);
                const dateString = format(date, "M/d(E)", { weekStartsOn: 1 /*月曜始まり*/ });
                const categoryIcon = expense.category === '食費' ? '🍴' : '🧻';
                return (
                  <li key={expense.row} style={{display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: "10px", padding: "12px 4px", borderBottom: "1px solid #eee", fontSize: "16px"}}>
                    <span>{dateString} {categoryIcon} {expense.category}</span>
                    <span style={{fontWeight: "bold"}}>{expense.amount.toLocaleString()}円</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="delete-btn"
                      onClick={() => handleDelete(expense.row)}
                    >
                      ❌
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
