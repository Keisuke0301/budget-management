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
import { MasterCategory, Chore, Totals, PetInfo, PetItem, DiaryRecord } from './types';
import RewardsScreen from './components/RewardsScreen';
import Gacha from './components/Gacha';
import PetLogScreen, { PetAddModal, PetHistoryModal, PetRecordModal, PetEditModal } from './components/PetLogScreen';
import DiaryScreen from './components/DiaryScreen';
import { DiaryModal } from './components/DiaryModal';


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
  pets: PetInfo[];
  petItems: PetItem[];
  todayChoreCounts: Record<string, number>;
}

export default function Home() {
  const [data, setData] = useState<InitialData | null>(null);
  const [choreMasterData, setChoreMasterData] = useState<MasterCategory[]>([]);
  const [choreTotals, setChoreTotals] = useState<Totals>({ keisuke: 0, keiko: 0, total: 0 });
  const [todayChoreCounts, setTodayChoreCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChoreModalOpen, setIsChoreModalOpen] = useState(false);
  const [isChoreHistoryModalOpen, setIsChoreHistoryModalOpen] = useState(false);
  const [isChoreStatsModalOpen, setIsChoreStatsModalOpen] = useState(false);
  
  // ペット関連のステート
  const [isPetAddModalOpen, setIsPetAddModalOpen] = useState(false);
  const [isPetHistoryModalOpen, setIsPetHistoryModalOpen] = useState(false);
  const [isPetRecordModalOpen, setIsPetRecordModalOpen] = useState(false);
  const [isPetEditModalOpen, setIsPetEditModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<PetInfo | null>(null);
  const [petRefreshTrigger, setPetRefreshTrigger] = useState(0);
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [petItems, setPetItems] = useState<PetItem[]>([]);

  // 日記関連のステート
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryRecord | null>(null);
  const [diaryRefreshTrigger, setDiaryRefreshTrigger] = useState(0);

  const [choreRefreshTrigger, setChoreRefreshTrigger] = useState(0);
  const [dataUpdatedAt, setDataUpdatedAt] = useState(0);
  const [activeTab, setActiveTab] = useState<'budget' | 'chores' | 'pet' | 'diary'>('chores');

  const fetchChoreTotals = useCallback(async () => {
    try {
      const res = await fetch('/api/chores');
      if (!res.ok) return;
      const chores: Chore[] = await res.json();
      
      const totals: Totals = { keisuke: 0, keiko: 0, total: 0 };
      chores.forEach(chore => {
        const score = (chore.score || 0) * (chore.multiplier || 1);
        // assignee の値が文字列である可能性を考慮して比較
        if (chore.assignee === 'keisuke' || chore.assignee === 'けいすけ') {
          totals.keisuke += score;
        } else if (chore.assignee === 'keiko' || chore.assignee === 'けいこ') {
          totals.keiko += score;
        }
      });
      totals.total = totals.keisuke + totals.keiko;
      setChoreTotals(totals);
    } catch (e) {
      console.error('Failed to fetch chore totals:', e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    // データ更新時にもローディング状態がわかるようにする
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
      setPets(initResult.pets || []);
      setPetItems(initResult.petItems || []);
      setTodayChoreCounts(initResult.todayChoreCounts || {});
      setChoreMasterData(choreMasterResult);
      setDataUpdatedAt(Date.now());
      
      // 家事ポイントの合計も取得
      await fetchChoreTotals();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [fetchChoreTotals]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChoreUpdate = () => {
    setChoreRefreshTrigger(Date.now());
    fetchChoreTotals();
  };

  const handlePetUpdate = () => {
    setPetRefreshTrigger(Date.now());
    fetchData(); // ペット更新時も全体データを再取得してpetsステートを同期
  };

  const handleDiaryUpdate = () => {
    setDiaryRefreshTrigger(Date.now());
  };

  const renderContent = () => {
    // 初回ロード時のみスケルトンを表示
    if (loading && !data) {
      return (
        <div className="flex flex-col gap-4 p-4">
          <div className="h-40 bg-slate-100 animate-pulse rounded-3xl" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
        </div>
      );
    }

    if (error) {
      return <p className="text-center p-8 text-red-500 font-bold">エラー: {error}</p>;
    }

    if (activeTab === 'diary') {
      return (
        <DiaryScreen 
          refreshTrigger={diaryRefreshTrigger} 
          onEdit={(entry) => {
            setSelectedDiary(entry);
            setIsDiaryModalOpen(true);
          }}
        />
      );
    }

    if (activeTab === 'pet') {
      return (
        <PetLogScreen 
          pets={pets}
          isLoading={loading && pets.length === 0}
          onOpenRecord={(pet) => {
            setSelectedPet(pet);
            setIsPetRecordModalOpen(true);
          }}
          onOpenHistory={(pet) => {
            setSelectedPet(pet);
            setIsPetHistoryModalOpen(true);
          }}
          onOpenAddPet={() => setIsPetAddModalOpen(true)}
          onOpenEdit={(pet) => {
            setSelectedPet(pet);
            setIsPetEditModalOpen(true);
          }}
          refreshTrigger={petRefreshTrigger}
        />
      );
    }

    if (activeTab === 'chores') {
      return (
        <div className="flex flex-col gap-6">
          {choreMasterData.length > 0 && (
            <ChoreBubbleGame 
              onUpdate={handleChoreUpdate} 
              refreshTrigger={choreRefreshTrigger}
              masterData={choreMasterData}
              initialCounts={todayChoreCounts}
            />
          )}
          {/* スペーサー */}
          <div className="h-10"></div>
        </div>
      );
    }

    if (!data) {
      return <p className="text-center p-8 text-slate-400">データがありません。</p>;
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
      <Toaster position="top-center" />
      <header className="relative py-2 px-4 flex flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white">
        {/* 装飾的な背景のアクセント */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[80px]"></div>      
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] rounded-full bg-indigo-100/30 blur-[60px]"></div>  
        </div>

        <div className="relative flex flex-col items-center">
          <h1 className="relative group cursor-default">
            <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500">
              Family Hub
            </span>
            {/* 下線のアクセント */}
            <div className="absolute -bottom-1 left-0 w-1/3 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent rounded-full transition-all duration-500 group-hover:w-full"></div>
          </h1>
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
        <>
          <Button id="chore-stats-fab" className="fab stats-fab" onClick={() => setIsChoreStatsModalOpen(true)}>
            <span className="text-[30px] leading-none flex items-center justify-center">🏆</span>
          </Button>
          <Button id="chore-history-fab" className="fab history-fab" onClick={() => setIsChoreHistoryModalOpen(true)}>
            📜
          </Button>
          <Button id="chore-fab" className="fab" onClick={() => setIsChoreModalOpen(true)}>
            ＋
          </Button>
        </>
      )}

      {activeTab === 'pet' && (
        <>
          <Button id="pet-history-fab" className="fab history-fab" onClick={() => setIsPetHistoryModalOpen(true)}>
            📜
          </Button>
          <Button id="pet-add-fab" className="fab" onClick={() => setIsPetAddModalOpen(true)}>
            ＋
          </Button>
        </>
      )}

      {activeTab === 'diary' && (
        <>
          <Button id="diary-fab" className="fab" onClick={() => {
            setSelectedDiary(null);
            setIsDiaryModalOpen(true);
          }}>
            ＋
          </Button>
        </>
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
        onSuccess={handleChoreUpdate}
        masterData={choreMasterData}
      />

      {/* 家事履歴モーダル */}
      <ChoreHistoryModal
        isOpen={isChoreHistoryModalOpen}
        onClose={() => setIsChoreHistoryModalOpen(false)}
        refreshTrigger={choreRefreshTrigger}
        onDeleteSuccess={handleChoreUpdate}
      />

      {/* 家事実績モーダル */}
      <ChoreStatsModal
        isOpen={isChoreStatsModalOpen}
        onClose={() => setIsChoreStatsModalOpen(false)}
        refreshTrigger={choreRefreshTrigger}
        totals={choreTotals}
        onGachaDraw={handleChoreUpdate}
      />

      {/* ペット関連モーダル */}
      <PetAddModal 
        isOpen={isPetAddModalOpen} 
        onClose={() => setIsPetAddModalOpen(false)} 
        onSuccess={handlePetUpdate} 
      />
      <PetHistoryModal 
        isOpen={isPetHistoryModalOpen} 
        onClose={() => setIsPetHistoryModalOpen(false)} 
        pet={selectedPet} 
        onRefresh={handlePetUpdate}
      />
      <PetRecordModal 
        isOpen={isPetRecordModalOpen} 
        onClose={() => setIsPetRecordModalOpen(false)} 
        pet={selectedPet}
        recordItems={petItems}
        onSuccess={handlePetUpdate}
      />
      <PetEditModal 
        isOpen={isPetEditModalOpen} 
        onClose={() => setIsPetEditModalOpen(false)} 
        pet={selectedPet}
        onSuccess={handlePetUpdate}
      />

      {/* 日記記録モーダル */}
      <DiaryModal
        isOpen={isDiaryModalOpen}
        onClose={() => {
          setIsDiaryModalOpen(false);
          setSelectedDiary(null);
        }}
        onSuccess={handleDiaryUpdate}
        initialData={selectedDiary}
      />
    </>
  );
}
