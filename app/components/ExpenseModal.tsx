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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
  const [category, setCategory] = useState("食費");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCalculatorClick = (value: string) => {
    if (amount === '0' && value !== '00') {
      setAmount(value);
    } else if (amount === '' && value === '00') {
      return;
    } else {
      setAmount(prev => prev + value);
    }
  };

  const handleClear = () => {
    setAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("金額を正しく入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount: Number(amount), date }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "支出の記録に失敗しました。");
      }
      toast.success("記録しました！");
      onSuccess(); // 親コンポーネントのデータ再取得をトリガー
      setAmount(""); // 金額をリセット
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`); // 日付をリセット
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-content">
        <DialogHeader className="modal-header">
          <DialogTitle className="modal-title">支出記録</DialogTitle>
        </DialogHeader>
        <div className="modal-form-container">
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-scroll-area">
              <div className="input-group">
                <label htmlFor="date">日付</label>
                <Input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="category">費目</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="費目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="食費">🥗 食費</SelectItem>
                    <SelectItem value="日用品">🧻 日用品</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="input-group">
                <label htmlFor="amount">金額</label>
                <Input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
              <div id="calculator">
                {["789", "456", "123"].map((row, i) => (
                  <div key={i} className="calc-row">
                    {row.split("").map((val) => (
                      <Button key={val} type="button" variant="outline" className="calc-btn" onClick={() => handleCalculatorClick(val)}>
                        {val}
                      </Button>
                    ))}
                  </div>
                ))}
                <div className="calc-row">
                  <Button type="button" variant="outline" className="calc-btn" onClick={() => handleCalculatorClick("0")}>
                    0
                  </Button>
                  <Button type="button" variant="outline" className="calc-btn" onClick={() => handleCalculatorClick("00")}>
                    00
                  </Button>
                  <Button type="button" variant="outline" className="calc-btn" onClick={handleClear}>
                    C
                  </Button>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="modal-action">
              {isSubmitting ? '処理中...' : '記録する'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
