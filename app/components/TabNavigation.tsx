"use client";

import { Button } from "@/components/ui/button";
import { WalletCards, Sparkles, PawPrint, BookText } from "lucide-react";
import { motion } from "framer-motion";

interface TabNavigationProps {
  activeTab: 'budget' | 'chores' | 'pet' | 'diary';
  onTabChange: (tab: 'budget' | 'chores' | 'pet' | 'diary') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'chores', label: '家事', icon: Sparkles },
    { id: 'pet', label: 'ペット', icon: PawPrint },
    { id: 'budget', label: '予算', icon: WalletCards },
    { id: 'diary', label: '日記', icon: BookText },
  ] as const;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 bg-white/80 backdrop-blur-lg border border-slate-200/50 flex items-center px-2 z-[1500] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl">
      <div className="relative flex w-full items-center">
        {tabs.map((tab, index) => (
          <div key={tab.id} className="flex-1 flex items-center">
            <Button
              variant="ghost"
              className={`relative flex-1 flex flex-col items-center gap-0.5 h-12 rounded-2xl transition-colors duration-300 z-10 ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-indigo-50 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <tab.icon size={20} className={activeTab === tab.id ? "animate-in zoom-in-75 duration-300" : ""} />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </Button>
            
            {/* 区切り線 (最後のアイテム以外) */}
            {index < tabs.length - 1 && (
              <div className="w-[1.5px] h-5 bg-slate-200/80 shrink-0 rounded-full mx-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
