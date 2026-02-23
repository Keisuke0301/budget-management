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

type Prize = {
    id: number;
    rarity: string;
    name: string;
    description: string;
};

type GachaProps = {
  totals: Totals;
  onGachaDraw: () => void;
};

export default function Gacha({ totals, onGachaDraw }: GachaProps) {
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const handleDraw = async (assignee: 'keisuke' | 'keiko') => {
    setIsAssigneeModalOpen(false);
    setIsLoading(true);
    setIsDrawing(true);
    setIsResultModalOpen(true);

    try {
      const [response] = await Promise.all([
        fetch('/api/gacha/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignee }),
        }),
        new Promise(resolve => setTimeout(resolve, 2500)), // 最低2.5秒演出
      ]);

      if (!response.ok) throw new Error('Gacha failed');

      const prize = await response.json();
      setSelectedPrize(prize);
      onGachaDraw();
    } catch (error) {
      console.error(error);
      setIsResultModalOpen(false);
    } finally {
      setIsLoading(false);
      setIsDrawing(false);
    }
  };

  return (
    <div className="w-full">
      <Button 
        onClick={() => setIsAssigneeModalOpen(true)} 
        disabled={isDrawing || (totals.keisuke < 100 && totals.keiko < 100)}
        className="w-full h-16 text-xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-2xl shadow-xl border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all"
      >
        <span className="mr-2 text-2xl">✨</span>
        ガチャを回す (100pt)
      </Button>

      <Dialog open={isAssigneeModalOpen} onOpenChange={setIsAssigneeModalOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">誰が回しますか？</DialogTitle>
            <DialogDescription className="text-center font-bold">
              100ptを消費してご褒美をゲット！
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button
              onClick={() => handleDraw('keisuke')}
              disabled={totals.keisuke < 100 || isDrawing}
              variant="outline"
              className={`h-28 flex flex-col gap-2 rounded-2xl border-2 transition-all ${totals.keisuke >= 100 ? 'border-blue-200 hover:border-blue-500 hover:bg-blue-50' : 'opacity-50'}`}
            >
              <span className="text-3xl">👦</span>
              <div className="flex flex-col">
                <span className="font-black">けいすけ</span>
                <span className="text-xs font-bold text-slate-400">{totals.keisuke}pt</span>
              </div>
            </Button>
            <Button
              onClick={() => handleDraw('keiko')}
              disabled={totals.keiko < 100 || isDrawing}
              variant="outline"
              className={`h-28 flex flex-col gap-2 rounded-2xl border-2 transition-all ${totals.keiko >= 100 ? 'border-pink-200 hover:border-pink-500 hover:bg-pink-50' : 'opacity-50'}`}
            >
              <span className="text-3xl">👧</span>
              <div className="flex flex-col">
                <span className="font-black">けいこ</span>
                <span className="text-xs font-bold text-slate-400">{totals.keiko}pt</span>
              </div>
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
    </div>
  );
}
