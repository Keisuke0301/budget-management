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
      <header className="relative py-16 px-4 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
  {/* 装飾的な背景のアクセント */}
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[80px]"></div>
    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-indigo-100/30 blur-[60px]"></div>
  </div>

  <div className="relative flex flex-col items-center">
    {/* サブタイトル的なラベル */}
    <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-[0.3em] uppercase text-indigo-500 bg-indigo-50/50 rounded-full border border-indigo-100/50 backdrop-blur-sm">
      Management Tool
    </span>
    
    <h1 className="relative group cursor-default">
      <span className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500">
        Family Hub
      </span>
      {/* 下線のアクセント */}
      <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-indigo-500 to-transparent rounded-full transition-all duration-500 group-hover:w-full"></div>
    </h1>
    
    <p className="mt-4 text-slate-400 text-xs font-medium tracking-widest uppercase">
      Shared Life Dashboard
    </p>
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
