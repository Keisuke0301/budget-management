"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// page.tsxで定義したものと同じ型をここでも使う
interface InitialData {
  foodBudget: number;
  dailyGoodsBudget: number;
  weeklyFoodUsage: number;
  weeklyDailyGoodsUsage: number;
  monthlyFoodUsage: number;
  monthlyDailyGoodsUsage: number;
  // ... 他のプロパティはここでは不要なので省略
}

interface TotalsCardProps {
  data: InitialData;
}

export function TotalsCard({ data }: TotalsCardProps) {
  const {
    foodBudget,
    dailyGoodsBudget,
    weeklyFoodUsage,
    weeklyDailyGoodsUsage,
    monthlyFoodUsage,
    monthlyDailyGoodsUsage
  } = data;

  const isFoodOverBudget = weeklyFoodUsage > foodBudget;
  const isDailyGoodsOverBudget = weeklyDailyGoodsUsage > dailyGoodsBudget;

  return (
    <Card className="totals-card pt-2 pb-4 gap-2">
      <CardHeader className="py-2 px-4">
        <h2 className="text-lg font-bold">合計</h2>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-0">
        <table className="totals-table">
          <tbody>
            <tr>
              <td className="item-label">🥗 食費</td>
              <td className={`amount weekly-usage ${isFoodOverBudget ? 'over-budget' : ''}`}>
                {weeklyFoodUsage.toLocaleString()}円
              </td>
              <td className="separator">/</td>
              <td className="amount weekly-budget">
                {foodBudget.toLocaleString()}円
              </td>
            </tr>
            <tr className="monthly-row">
              <td colSpan={4} className="monthly-total">
                (月: {monthlyFoodUsage.toLocaleString()}円)
              </td>
            </tr>
            <tr>
              <td className="item-label">🧻 日用品</td>
              <td className={`amount weekly-usage ${isDailyGoodsOverBudget ? 'over-budget' : ''}`}>
                {weeklyDailyGoodsUsage.toLocaleString()}円
              </td>
              <td className="separator">/</td>
              <td className="amount weekly-budget">
                {dailyGoodsBudget.toLocaleString()}円
              </td>
            </tr>
            <tr className="monthly-row">
              <td colSpan={4} className="monthly-total">
                (月: {monthlyDailyGoodsUsage.toLocaleString()}円)
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
