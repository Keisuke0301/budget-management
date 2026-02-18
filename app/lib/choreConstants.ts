"use client";

import { Utensils, Sparkles, Shirt, Fish, MoreHorizontal } from "lucide-react";

export const CHORE_CATEGORIES = [
  {
    id: "meal",
    name: "食事",
    icon: Utensils,
    tasks: [
      { id: "meal-1", name: "料理(昼)", score: 3, icon: "🍳" },
      { id: "meal-2", name: "料理(夜)", score: 4, icon: "🧑‍🍳" },
      { id: "meal-3", name: "料理(弁当)", score: 6, icon: "🍱" },
      { id: "meal-5", name: "食器洗い", score: 6, icon: "🧼", repeatable: true },
      { id: "meal-6", name: "食器片付け", score: 2, icon: "🍽️", repeatable: true },
    ],
  },
  {
    id: "cleaning",
    name: "掃除",
    icon: Sparkles,
    tasks: [
      { id: "clean-1", name: "部屋", score: 8, icon: "🧹" },
      { id: "clean-2", name: "風呂", score: 6, icon: "🛁" },
      { id: "clean-3", name: "トイレ", score: 7, icon: "🚽" },
      { id: "clean-4", name: "洗車", score: 9, icon: "🚗" },
    ],
  },
  {
    id: "laundry",
    name: "洗濯",
    icon: Shirt,
    tasks: [
      { id: "laundry-1", name: "洗濯", score: 2, icon: "🌀", repeatable: true },
      { id: "laundry-2", name: "干し", score: 8, icon: "👕", repeatable: true },
      { id: "laundry-3", name: "取込・畳み", score: 6, icon: "🐔", repeatable: true },
    ],
  },
  {
    id: "pet",
    name: "ペット",
    icon: Fish,
    tasks: [
      { id: "pet-1", name: "デグえさ(朝)", score: 1, icon: "🐹" },
      { id: "pet-2", name: "デグえさ(夜)", score: 1, icon: "🐭" },
      { id: "pet-3", name: "デグ掃除", score: 7, icon: "🧹" },
      { id: "pet-4", name: "魚えさ", score: 1, icon: "🐟" },
      { id: "pet-5", name: "魚掃除", score: 10, icon: "🧼" },
    ],
  },
  {
    id: "other",
    name: "その他",
    icon: MoreHorizontal,
    tasks: [
      { id: "other-1", name: "ごみまとめ", score: 2, icon: "📦" },
      { id: "other-2", name: "ごみ捨て", score: 3, icon: "🗑️" },
      { id: "other-3", name: "ごみ捨て(資源)", score: 10, icon: "♻️" },
      { id: "other-4", name: "散髪", score: 10, icon: "✂️" },
    ],
  },
];

// バブルゲーム用のフラットなリストを生成
export const BUBBLE_TASKS = [
  ...CHORE_CATEGORIES.find(c => c.id === "meal")!.tasks.filter(t => ["料理(昼)", "料理(夜)", "食器洗い", "食器片付け"].includes(t.name)).map(t => ({ ...t, area: "食事" as const })),
  ...CHORE_CATEGORIES.find(c => c.id === "laundry")!.tasks.map(t => ({ ...t, area: "洗濯" as const })),
  ...CHORE_CATEGORIES.find(c => c.id === "pet")!.tasks.filter(t => ["デグえさ(朝)", "デグえさ(夜)", "魚えさ"].includes(t.name)).map(t => ({ ...t, area: "ペット" as const })),
] as const;
