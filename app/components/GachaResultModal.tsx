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

type Prize = {
    id: number;
    rarity: string;
    name: string;
    description: string;
};

type GachaResultModalProps = {
  isLoading: boolean;
  prize: Prize | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const rarityStyles: { [key: string]: { card: string; badge: string } } = {
  N: { card: 'bg-white', badge: 'bg-gray-200 text-gray-800' },
  R: { card: 'bg-blue-50 border-blue-400', badge: 'bg-blue-200 text-blue-800' },
  SR: { card: 'bg-gradient-to-br from-yellow-200 to-orange-300 border-yellow-500', badge: 'bg-yellow-400 text-white shadow-sm' },
  UR: { card: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 border-purple-600', badge: 'bg-purple-600 text-white animate-pulse shadow-md' },
};

export default function GachaResultModal({
  isLoading,
  prize,
  isOpen,
  onOpenChange,
}: GachaResultModalProps) {

  useEffect(() => {
    if (isOpen && !isLoading && prize && (prize.rarity === 'SR' || prize.rarity === 'UR')) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }, [isOpen, isLoading, prize]);

  const styles = prize ? (rarityStyles[prize.rarity] || rarityStyles.N) : rarityStyles.N;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
        <AnimatePresence mode="wait">
          {isLoading ? (
             <motion.div 
               key="loading" 
               initial={{ scale: 0.8, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 1.1, opacity: 0 }}
               className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center space-y-6 shadow-2xl mx-4"
             >
                <div className="relative w-32 h-32">
                    <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 border-8 border-yellow-400 border-t-transparent rounded-full shadow-lg"
                    />
                    <div className="absolute inset-4 bg-yellow-50 rounded-full flex items-center justify-center text-5xl">🎁</div>
                </div>
                <p className="text-xl font-bold text-slate-700 animate-bounce">カプセルを回しています...</p>
            </motion.div>
          ) : prize ? (
            <motion.div
              key="result"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`mx-4 rounded-3xl overflow-hidden shadow-2xl bg-white border-4 ${styles.card.includes('border') ? styles.card : 'border-slate-100'}`}
            >
              <div className={`p-8 text-center ${styles.card}`}>
                <div className="mb-4">
                    <span className={`px-4 py-1 text-xs font-black rounded-full uppercase tracking-widest ${styles.badge}`}>
                        {prize.rarity} Rank
                    </span>
                </div>
                <motion.h2 
                    initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                    className="text-4xl font-black text-slate-800 mb-2"
                >
                    {prize.name}
                </motion.h2>
                <p className="text-slate-500 font-medium">{prize.description}</p>
              </div>
              <div className="p-6 bg-slate-50 border-t">
                  <Button onClick={() => onOpenChange(false)} className="w-full h-12 rounded-xl font-bold text-lg shadow-lg">
                      受け取る
                  </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
