'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Totals } from '@/app/types';
import GachaResultModal from './GachaResultModal';

type Prize = {
    id: number;
    rarity: string;
    name: string;
    description: string;
};

type GachaProps = {
  assignee: 'keisuke' | 'keiko';
  points: number;
  onGachaDraw: () => void;
};

export default function Gacha({ assignee, points, onGachaDraw }: GachaProps) {
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  const handleDraw = async () => {
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
        onClick={handleDraw} 
        disabled={isDrawing || points < 100}
        size="sm"
        className="w-full font-black bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-md transition-all h-8 text-[10px]"
      >
        ✨ ガチャを回す (100pt)
      </Button>

      <GachaResultModal
        isOpen={isResultModalOpen}
        onOpenChange={setIsResultModalOpen}
        isLoading={isLoading}
        prize={selectedPrize}
      />
    </div>
  );
}
