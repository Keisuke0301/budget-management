'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Chore, Totals } from '@/app/types';


type Prize = {
    id: number;
    rarity: string;
    name: string;
    description: string;
    probability: number;
    created_at: string;
};

type GachaResultModalProps = {
  isLoading: boolean;
  prize: Prize | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const rarityStyles: { [key: string]: { card: string; title: string; badge: string } } = {
  N: { card: 'bg-white', title: 'text-gray-800', badge: 'bg-gray-200 text-gray-800' },
  R: { card: 'bg-blue-100 border-blue-400', title: 'text-blue-800', badge: 'bg-blue-200 text-blue-800' },
  SR: { card: 'bg-gradient-to-br from-yellow-200 to-orange-300 border-yellow-500', title: 'text-yellow-900', badge: 'bg-yellow-400 text-white' },
  UR: { card: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 border-purple-600', title: 'text-white font-black', badge: 'bg-purple-600 text-white' },
};

const GachaLoading = () => (
  <div className="flex flex-col items-center justify-center h-56">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-24 h-24 border-8 border-t-yellow-400 border-gray-200 rounded-full"
    />
    <p className="mt-6 text-lg font-semibold text-gray-700">カプセルを回しています...</p>
  </div>
);

const GachaResult = ({ prize }: { prize: Prize }) => {
  useEffect(() => {
    if (prize && (prize.rarity === 'SR' || prize.rarity === 'UR')) {
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [prize]);

  const styles = rarityStyles[prize.rarity] || rarityStyles.N;

  return (
      <div className={`p-6 rounded-lg text-center ${styles.card}`}>
        <div className="flex justify-center items-center mb-4">
            <span className={`px-4 py-1 text-sm font-bold rounded-full shadow-md ${styles.badge}`}>{prize.rarity}</span>
        </div>
        <motion.h2 
            className={`text-3xl font-bold ${styles.title}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
        >
            {prize.name}
        </motion.h2>
        <p className="mt-2 text-muted-foreground">{prize.description}</p>
      </div>
  );
};


export default function GachaResultModal({
  isLoading,
  prize,
  isOpen,
  onOpenChange,
}: GachaResultModalProps) {

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <AnimatePresence mode="wait">
          {isLoading ? (
             <motion.div key="loading" className="p-6">
                <DialogHeader>
                    <DialogTitle>ガチャ</DialogTitle>
                </DialogHeader>
                <GachaLoading />
            </motion.div>
          ) : prize ? (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <DialogHeader className="p-6 pb-0">
                  <DialogTitle>ガチャ結果</DialogTitle>
              </DialogHeader>
              <div className="p-6 pt-2">
                <GachaResult prize={prize} />
              </div>
              <DialogFooter className="p-6 pt-0">
                  <Button onClick={handleClose} className="w-full">閉じる</Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <div className="p-6">
                <DialogHeader>
                    <DialogTitle>エラー</DialogTitle>
                </DialogHeader>
                <p className="py-4 text-center text-red-500">景品の取得に失敗しました。</p>
                 <DialogFooter>
                  <Button onClick={handleClose} variant="outline">閉じる</Button>
                </DialogFooter>
            </div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
