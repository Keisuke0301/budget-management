"use client";

import { useState, useEffect, useCallback } from 'react';
import { TotalsCard } from './components/TotalsCard';
import { CalendarCard } from './components/CalendarCard';
import { ExpenseModal } from './components/ExpenseModal';
import { HistoryModal } from './components/HistoryModal';
import { ChoreModal } from './components/ChoreModal';
import { ChoreListCard } from './components/ChoreListCard';
import { TabNavigation } from './components/TabNavigation';
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [choreRefreshTrigger, setChoreRefreshTrigger] = useState(0);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(0);
  const [activeTab, setActiveTab] = useState<'budget' | 'chores'>('budget');

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
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

    if (activeTab === 'chores') {
      return (
        <>
          <ChoreListCard refreshTrigger={choreRefreshTrigger} />
          {/* スペーサー */}
          <div className="h-20"></div>
        </>
      );
    }

    return (
      <>
        <CalendarCard data={data} />
        <TotalsCard data={data} />
        {/* スペーサー */}
        <div className="h-20"></div>
      </>
    );
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <header className="relative py-12 px-4 flex flex-col items-center justify-center overflow-hidden bg-white border-b border-slate-100">
        {/* モダンな装飾的な背景要素 */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-blue-50 blur-3xl opacity-60"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-pink-50 blur-3xl opacity-60"></div>
        </div>

        <div className="relative group">
          {/* タイトルの背後のほのかな光彩 */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-200/30 to-pink-200/30 rounded-2xl blur-xl opacity-50"></div>

          <div className="relative bg-white/70 backdrop-blur-md px-8 py-5 rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-200/50">
            <h1 className="font-serif italic text-3xl md:text-4xl tracking-[0.15em] text-slate-800 text-center">
              Family Hub
            </h1>
          </div>
        </div>
      </header>
      <div className="container">
        {renderContent()}
      </div>

      {activeTab === 'budget' && (
        <>
          {/* 履歴ボタン (history-fab) */}
          <Button id="history-fab" className="fab history-fab" onClick={() => setIsHistoryModalOpen(true)}>
            📜
          </Button>

          {/* 追加ボタン (add-expense-fab) */}
          <Button id="add-expense-fab" className="fab" onClick={() => setIsExpenseModalOpen(true)}>
            ＋
          </Button>
        </>
      )}

      {activeTab === 'chores' && (
        <Button id="chore-fab" className="fab" onClick={() => setIsChoreModalOpen(true)}>
          ＋
        </Button>
      )}

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

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
        onDataChange={fetchData}
        dataUpdatedAt={dataUpdatedAt}
      />

      {/* 家事記録モーダル */}
      <ChoreModal
        isOpen={isChoreModalOpen}
        onClose={() => setIsChoreModalOpen(false)}
        onSuccess={() => setChoreRefreshTrigger(Date.now())}
      />
    </>
  );
}
