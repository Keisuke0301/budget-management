"use client";

import { useState, useEffect, useCallback } from 'react';
import { TotalsCard } from './components/TotalsCard';
import { CalendarCard } from './components/CalendarCard';
import { ExpenseModal } from './components/ExpenseModal';
import { HistoryModal } from './components/HistoryModal';
import { ChoreModal } from './components/ChoreModal';
import { ChoreBubbleGame } from './components/ChoreBubbleGame';
import { ChoreHistoryModal } from './components/ChoreHistoryModal';
import { ChoreStatsModal } from './components/ChoreStatsModal';
import { TabNavigation } from './components/TabNavigation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Trophy } from 'lucide-react';
import { MasterCategory, Chore, Totals } from './types';
import RewardsScreen from './components/RewardsScreen';
import Gacha from './components/Gacha';


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
  const [choreMasterData, setChoreMasterData] = useState<MasterCategory[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [choreTotals, setChoreTotals] = useState<Totals>({ keisuke: 0, keiko: 0, total: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [isChoreHistoryModalOpen, setIsChoreHistoryModalOpen] = useState(false);
  const [isChoreStatsModalOpen, setIsChoreStatsModalOpen] = useState(false);
  const [choreRefreshTrigger, setChoreRefreshTrigger] = useState(0);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(0);
  const [activeTab, setActiveTab] = useState<'budget' | 'chores' | 'rewards'>('chores');

  const fetchChoreData = useCallback(async () => {
    try {
      const res = await fetch("/api/chores");
      if (!res.ok) throw new Error("家事ログの取得に失敗しました");
      const data: Chore[] = await res.json();
      setChores(data);

      const newTotals: Totals = { keisuke: 0, keiko: 0, total: 0 };
      data.forEach(chore => {
        const score = (chore.score || 0) * (chore.multiplier || 1);
        if (chore.assignee === 'keisuke') {
          newTotals.keisuke += score;
        } else if (chore.assignee === 'keiko') {
          newTotals.keiko += score;
        }
      });
      newTotals.total = newTotals.keisuke + newTotals.keiko;
      setChoreTotals(newTotals);
      
      setChoreRefreshTrigger(Date.now());
    } catch (e: unknown) {
      console.error(e);
      // setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [initRes, choreMasterRes] = await Promise.all([
        fetch('/api/initial-data'),
        fetch('/api/initial-data/chores')
      ]);

      if (!initRes.ok) throw new Error("初期データの取得に失敗しました");
      if (!choreMasterRes.ok) throw new Error("家事マスターデータの取得に失敗しました");

      const initResult = await initRes.json();
      const choreMasterResult = await choreMasterRes.json();

      setData(initResult);
      setChoreMasterData(choreMasterResult);
      setDataUpdatedAt(Date.now());
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    fetchChoreData();
  }, [fetchInitialData, fetchChoreData]);

  const renderContent = () => {
    if (loading && !data) {
      return <div className="text-center p-8">読み込み中...</div>;
    }

    if (error) {
      return <p className="text-red-500">エラー: {error}</p>;
    }

    if (activeTab === 'rewards') {
      return <RewardsScreen />;
    }
    
    if (activeTab === 'chores') {
      return (
        <>
          <div className="mb-6">
            <Gacha totals={choreTotals} onGachaDraw={fetchChoreData} />
          </div>
          {choreMasterData.length > 0 && (
            <ChoreBubbleGame 
              onUpdate={fetchChoreData}
              refreshTrigger={choreRefreshTrigger}
              masterData={choreMasterData}
            />
          )}
          <div className="h-10"></div>
        </>
      );
    }

    if (!data) {
      return <p>データがありません。</p>;
    }

    return (
      <>
        <CalendarCard data={data} />
        <TotalsCard data={data} />
        <div className="h-20"></div>
      </>
    );
  };

  return (
    <>
      <Toaster position="top-center" />
      <header className="relative py-2 px-4 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
        {/* ... header content ... */}
      </header>
      
      <div className="container">
        {renderContent()}
      </div>

      {activeTab === 'budget' && (
        <>
          <Button id="history-fab" className="fab history-fab" onClick={() => setIsHistoryModalOpen(true)}>📜</Button>
          <Button id="add-expense-fab" className="fab" onClick={() => setIsExpenseModalOpen(true)}>+</Button>
        </>
      )}

      {activeTab === 'chores' && (
        <>
          <Button id="chore-stats-fab" className="fab stats-fab" onClick={() => setIsChoreStatsModalOpen(true)}>
            <span className="text-[30px] leading-none flex items-center justify-center">🏆</span>
          </Button>
          <Button id="chore-history-fab" className="fab history-fab" onClick={() => setIsChoreHistoryModalOpen(true)}>📜</Button>
          <Button id="chore-fab" className="fab" onClick={() => setIsChoreModalOpen(true)}>+</Button>
        </>
      )}

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchInitialData}
      />
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onDataChange={fetchInitialData}
        dataUpdatedAt={dataUpdatedAt}
      />
      <ChoreModal
        isOpen={isChoreModalOpen}
        onClose={() => setIsChoreModalOpen(false)}
        onSuccess={fetchChoreData}
        masterData={choreMasterData}
      />
      <ChoreHistoryModal
        isOpen={isChoreHistoryModalOpen}
        onClose={() => setIsChoreHistoryModalOpen(false)}
        refreshTrigger={choreRefreshTrigger}
        onDeleteSuccess={fetchChoreData}
      />
      <ChoreStatsModal
        isOpen={isChoreStatsModalOpen}
        onClose={() => setIsChoreStatsModalOpen(false)}
        refreshTrigger={choreRefreshTrigger}
      />
    </>
  );
}
