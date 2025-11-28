"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfMonth, subMonths } from "date-fns";

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
  const [selectedMonth, setSelectedMonth] = useState(
    startOfMonth(new Date()).toISOString()
  );
  const [selectedWeek, setSelectedWeek] = useState<string>("all");

  const monthOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date).toISOString();
      return {
        value: monthStart,
        label: format(date, "yyyy年 M月期"),
      };
    });
  }, []);

  const weekOptions = [
    { value: "all", label: "全て" },
    { value: "1", label: "第1週" },
    { value: "2", label: "第2週" },
    { value: "3", label: "第3週" },
    { value: "4", label: "第4週" },
    { value: "5", label: "第5週" },
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const params = new URLSearchParams({ month: selectedMonth, week: selectedWeek });
      fetch(`/api/expenses?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setExpenses(data);
        })
        .catch(err => toast.error(`履歴の取得に失敗: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedMonth, selectedWeek]);

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
          <DialogTitle className="modal-title">履歴</DialogTitle>
        </DialogHeader>
        <div className="modal-form-container">
          <div className="filter-row">
            <div className="filter-field">
              <span className="filter-label">月期</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="filter-field">
              <span className="filter-label">週</span>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div id="history-list-container" className="modal-scroll-area">
            {loading ? (
              <p>読み込み中...</p>
            ) : expenses.length === 0 ? (
              <p>該当する支出はまだありません。</p>
            ) : (
              <ul className="history-list">
                {expenses.map((expense) => {
                  const date = new Date(expense.timestamp);
                  const dateString = format(date, "M/d(E)", { weekStartsOn: 1 /*月曜始まり*/ });
                  const categoryIcon = expense.category === '食費' ? '🍴' : '🧻';
                  return (
                    <li key={expense.row} className="history-list-item">
                      <span>{dateString} {categoryIcon} {expense.category}</span>
                      <span className="history-amount">{expense.amount.toLocaleString()}円</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
