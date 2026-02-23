'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Totals } from '@/app/types';
import GachaResultModal from './GachaResultModal';

// ガチャ景品の型定義
type Prize = {
    id: number;
    rarity: string;
    name: string;
    description: string;
    probability: number;
    created_at: string;
};

type GachaProps = {
  totals: Totals;
  onGachaDraw: () => void; // ガチャが引かれた後にデータを再取得するためのコールバック
};

export default function Gacha({ totals, onGachaDraw }: GachaProps) {
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // モーダル内のローディング状態
  const [isDrawing, setIsDrawing] = useState(false); // ボタンの操作可否を管理
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const canAfford = totals.keisuke >= 100 || totals.keiko >= 100;

  const handleDraw = async (assignee: 'keisuke' | 'keiko') => {
    setIsAssigneeModalOpen(false);
    setIsLoading(true);
    setIsDrawing(true);
    setSelectedPrize(null);
    setIsResultModalOpen(true);

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      const [response] = await Promise.all([
        fetch('/api/gacha/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignee }),
        }),
        wait(2500), // 最低2.5秒はアニメーションを見せる
      ]);

      if (!response.ok) {
        throw new Error('Gacha draw failed');
      }

      const prize = await response.json();
      setSelectedPrize(prize);
      onGachaDraw();

    } catch (error) {
      console.error(error);
      setSelectedPrize(null);
    } finally {
      setIsLoading(false);
      setIsDrawing(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsAssigneeModalOpen(true)} 
        disabled={!canAfford || isDrawing}
        className="w-full text-lg font-bold py-6 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg"
      >
        {isDrawing ? 'ガチャ実行中...' : 'ガチャを回す (100pt消費)'}
      </Button>

      <Dialog open={isAssigneeModalOpen} onOpenChange={setIsAssigneeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>誰がガチャを回しますか？</DialogTitle>
            <DialogDescription>
              ポイントは実行した人の合計から100pt消費されます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              onClick={() => handleDraw('keisuke')}
              disabled={totals.keisuke < 100 || isDrawing}
              variant="outline"
              size="lg"
            >
              けいすけ <br /> ({totals.keisuke} pt)
            </Button>
            <Button
              onClick={() => handleDraw('keiko')}
              disabled={totals.keiko < 100 || isDrawing}
              variant="outline"
              size="lg"
            >
              けいこ <br /> ({totals.keiko} pt)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <GachaResultModal
        isOpen={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        isLoading={isLoading}
        prize={selectedPrize}
      />
    </>
  );
}
