"use client";

import { Button } from "@/components/ui/button";
import { WalletCards, Sparkles, Gift } from "lucide-react";

interface TabNavigationProps {
  activeTab: 'budget' | 'chores' | 'rewards';
  onTabChange: (tab: 'budget' | 'chores' | 'rewards') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center z-[1500] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <Button
        variant="ghost"
        className={`flex-1 flex flex-col items-center gap-1 h-full rounded-none ${activeTab === 'chores' ? 'text-blue-500' : 'text-gray-500'}`}
        onClick={() => onTabChange('chores')}
      >
        <Sparkles size={24} />
        <span className="text-xs font-medium">家事ログ</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex-1 flex flex-col items-center gap-1 h-full rounded-none ${activeTab === 'rewards' ? 'text-indigo-500' : 'text-gray-500'}`}
        onClick={() => onTabChange('rewards')}
      >
        <Gift size={24} />
        <span className="text-xs font-medium">ご褒美</span>
      </Button>
      <Button
        variant="ghost"
        className={`flex-1 flex flex-col items-center gap-1 h-full rounded-none ${activeTab === 'budget' ? 'text-blue-500' : 'text-gray-500'}`}
        onClick={() => onTabChange('budget')}
      >
        <WalletCards size={24} />
        <span className="text-xs font-medium">予算管理</span>
      </Button>
    </div>
  );
}
