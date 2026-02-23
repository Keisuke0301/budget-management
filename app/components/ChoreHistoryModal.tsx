"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChoreListCard } from "./ChoreListCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, History } from "lucide-react";

interface ChoreHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger: number;
  onDeleteSuccess?: () => void;
}

export function ChoreHistoryModal({ isOpen, onClose, refreshTrigger, onDeleteSuccess }: ChoreHistoryModalProps) {
  const [activeView, setActiveView] = useState<'today' | 'history'>('today');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-black tracking-tight">家事ログ履歴</span>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveView('today')}
                    className={`h-8 px-3 rounded-lg text-[10px] font-bold transition-all ${activeView === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Calendar size={14} className="mr-1" />
                    今日
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveView('history')}
                    className={`h-8 px-3 rounded-lg text-[10px] font-bold transition-all ${activeView === 'history' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <History size={14} className="mr-1" />
                    過去
                </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <ChoreListCard 
            refreshTrigger={refreshTrigger} 
            onDeleteSuccess={onDeleteSuccess} 
            view={activeView}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
