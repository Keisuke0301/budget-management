"use client";

import { Button } from "@/components/ui/button";
import { WalletCards, Sparkles, Gift } from "lucide-react";

interface TabNavigationProps {
  activeTab: 'budget' | 'chores' | 'rewards';
  onTabChange: (tab: 'budget' | 'chores' | 'rewards') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'chores', label: '家事ログ', icon: Sparkles },
    { id: 'rewards', label: '報酬一覧', icon: Gift },
    { id: 'budget', label: '予算管理', icon: WalletCards },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center z-[1500] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => (
        <Button
          key={tab.id}
          variant="ghost"
          className={`flex-1 flex flex-col items-center gap-1 h-full rounded-none ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-500'}`}
          onClick={() => onTabChange(tab.id)}
        >
          <tab.icon size={24} />
          <span className="text-xs font-medium">{tab.label}</span>
        </Button>
      ))}
    </div>
  );
}
