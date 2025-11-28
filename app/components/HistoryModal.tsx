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

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChange: () => void; // データが変更されたことを親に通知する
  dataUpdatedAt: number;
}

interface Expense {
  row: number; // idのエイリアス
  timestamp: number;
  dateString: string;
  category: string;
  categoryIcon: string;
  amount: number;
}

interface ExpenseCache {
  fetchedAt: number;
  data: Expense[];
}

export function HistoryModal({ isOpen, onClose, onDataChange, dataUpdatedAt }: HistoryModalProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<ExpenseCache | null>(null);

  const CACHE_TTL = 5 * 60 * 1000; // 5分

  useEffect(() => {
    // 集計データの更新があったらキャッシュを破棄する
    setCache(null);
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (!isOpen) return;

    type ExpensesResponse = Expense[] | { error: string };

    const shouldUseCache = cache && Date.now() - cache.fetchedAt < CACHE_TTL;
    if (shouldUseCache) {
      setExpenses(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/expenses') // 週次履歴を取得
      .then(res => {
        if (!res.ok) {
          throw new Error("レスポンスの取得に失敗しました。");
        }
        return res.json() as Promise<ExpensesResponse>;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setExpenses(data);
          setCache({ data, fetchedAt: Date.now() });
          return;
        }

        throw new Error(data.error);
      })
      .catch(err => toast.error(`履歴の取得に失敗: ${err.message}`))
      .finally(() => setLoading(false));
  }, [CACHE_TTL, cache, isOpen]);

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
      setCache(null); // 次回開くときに最新を取得する
      onDataChange(); // 親コンポーネントの合計データを更新
    } catch (_error) {
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
        <div className="modal-form-container">
          <div id="history-list-container" className="modal-scroll-area">
            {loading ? (
              <p>読み込み中...</p>
            ) : expenses.length === 0 ? (
              <p>今週の支出はまだありません。</p>
            ) : (
              <ul className="history-list">
                {expenses.map((expense) => {
                  return (
                    <li key={expense.row} className="history-list-item">
                      <span>{expense.dateString} {expense.categoryIcon} {expense.category}</span>
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
