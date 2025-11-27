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
    <Card className="totals-card">
      <CardHeader>
        <h2 className="text-2xl font-semibold">合計</h2>
      </CardHeader>
      <CardContent>
        <table className="totals-table">
          <tbody>
            <tr>
              <td className="item-label">🍴 食費</td>
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
