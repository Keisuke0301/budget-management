"use client";

import { useState, useEffect, useCallback } from 'react';
import { TotalsCard } from './components/TotalsCard';
import { CalendarCard } from './components/CalendarCard';
import { ExpenseModal } from './components/ExpenseModal';
import { HistoryModal } from './components/HistoryModal'; // HistoryModalをインポート
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';


// データの方を定義しておくと、コードが書きやすくなります
export interface InitialData {
  foodBudget: number;
  dailyGoodsBudget: number;
  weeklyFoodUsage: number;
  weeklyDailyGoodsUsage: number;
  monthlyFoodUsage: number;
  monthlyDailyGoodsUsage: number;
  numberOfWeeks: number;
  weekNumber: number;
  todayTime: number;
  startOfWeekTime: number;
  endOfWeekTime: number;
  startOfMonthTime: number;
  endOfMonthTime: number;
}

export default function Home() {
  const [data, setData] = useState<InitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // HistoryModalのstateを追加
  const [dataUpdatedAt, setDataUpdatedAt] = useState(0);

  const fetchData = useCallback(async () => {
    // データ更新時にもローディング状態がわかるようにする
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/initial-data');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `APIエラー: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setDataUpdatedAt(Date.now());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    // 初回ロード時のみスケルトンを表示
    if (loading && !data) {
      return (
        <>
          <div className="card"><div className="p-6 animate-pulse"><div className="h-40 bg-gray-200 rounded"></div></div></div>
          <div className="card totals-card">
            <div className="p-6 animate-pulse">
              <h2 className="text-2xl font-semibold h-8 bg-gray-200 rounded w-1/4 mb-4"></h2>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mt-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </>
      );
    }

    if (error) {
      return <p className="text-red-500">エラー: {error}</p>;
    }

    if (!data) {
      return <p>データがありません。</p>;
    }

    return (
      <>
        <CalendarCard data={data} />
        <TotalsCard data={data} />
      </>
    );
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="header">
        <h1>💰週次予算管理アプリぶりぶり</h1>
      </div>
      <div className="container">
        {renderContent()}
      </div>

      {/* 履歴ボタン (history-fab) */}
      <Button id="history-fab" className="fab history-fab" onClick={() => setIsHistoryModalOpen(true)}>
        📜
      </Button>

      {/* 追加ボタン (add-expense-fab) */}
      <Button id="add-expense-fab" className="fab" onClick={() => setIsExpenseModalOpen(true)}>
        ＋
      </Button>

      {/* 支出記録モーダル */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* 履歴モーダル */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onDataChange={fetchData} // データ削除後に合計値を再取得するため
        dataUpdatedAt={dataUpdatedAt}
      />
    </>
  );
}
