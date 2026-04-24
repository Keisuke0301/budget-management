'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlantInfo, PlantRecord } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar, ClipboardList, Sprout, Leaf, Flower2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PLANT_RECORD_TYPES = [
  '水やり',
  '追肥',
  '収穫',
  '観察',
  '植え付け',
  '病害虫対策',
  '剪定/芽かき',
  '収穫終了'
];

// --- 記録用モーダル ---
export function PlantRecordModal({ 
  isOpen, 
  onClose, 
  plant, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plant: PlantInfo | null;
  onSuccess: () => void;
}) {
  const [newRecord, setNewRecord] = useState({ 
    record_type: '水やり', 
    note: '',
    recorded_at: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRecord = async () => {
    if (!plant) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/plants/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plant_id: plant.id,
          record_type: newRecord.record_type,
          note: newRecord.note,
          recorded_at: newRecord.recorded_at ? new Date(newRecord.recorded_at).toISOString() : new Date().toISOString()
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('記録を保存しました');
      onSuccess();
      onClose();
      setNewRecord({ 
        record_type: '水やり', 
        note: '',
        recorded_at: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      toast.error('記録の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center gap-2">
            {plant?.name}の記録
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">日付</label>
            <Input 
              type="date" 
              value={newRecord.recorded_at} 
              onChange={e => setNewRecord({...newRecord, recorded_at: e.target.value})} 
              className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
            <Select value={newRecord.record_type} onValueChange={(val) => setNewRecord({ ...newRecord, record_type: val })}>
              <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                <SelectValue placeholder="選択" />
              </SelectTrigger>
              <SelectContent>
                {PLANT_RECORD_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="font-bold">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">メモ</label>
            <Textarea 
              value={newRecord.note} 
              onChange={e => setNewRecord({...newRecord, note: e.target.value})} 
              placeholder="メモを入力..." 
              className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-bold"
            />
          </div>
          <Button onClick={handleAddRecord} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-lg">
            {isSubmitting ? '保存中...' : '記録を保存する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- 履歴用モーダル ---
export function PlantHistoryModal({ 
  isOpen, 
  onClose, 
  plant,
  onRefresh
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plant: PlantInfo | null;
  onRefresh?: () => void;
}) {
  const [records, setRecords] = useState<PlantRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!plant) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/plants/records?plantId=${plant.id}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      toast.error('履歴の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [plant]);

  useEffect(() => {
    if (isOpen && plant) {
      fetchRecords();
    }
  }, [isOpen, plant, fetchRecords]);

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const res = await fetch(`/api/plants/records?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('削除しました');
      fetchRecords();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('削除に失敗しました');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center gap-2 border-b pb-2">
            {plant?.name}の履歴
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 font-bold">読込中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed rounded-3xl">記録がありません</div>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {records.map(record => (
                <li key={record.id} className="py-2.5 px-1 group">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                      {format(new Date(record.recorded_at), 'yy/MM/dd', { locale: ja })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 text-center">
                      {record.record_type}
                    </span>
                    <div className="flex-1"></div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  {record.note && (
                    <div className="pl-2 ml-1 border-l-2 border-slate-50">
                      <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                        {record.note}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- 植物登録モーダル ---
export function PlantAddModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (plant: PlantInfo) => void;
}) {
  const [newPlant, setNewPlant] = useState({ 
    name: '', 
    variety: '', 
    planting_date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPlant = async () => {
    if (!newPlant.name) {
      toast.error('名前を入力してください');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlant,
          variety: newPlant.variety || null,
          planting_date: newPlant.planting_date || null,
          location: newPlant.location || null,
          status: 'growing'
        }),
      });
      const data = await res.json();
      onSuccess(data);
      onClose();
      setNewPlant({ 
        name: '', 
        variety: '', 
        planting_date: format(new Date(), 'yyyy-MM-dd'), 
        location: '' 
      });
      toast.success('植物を登録しました');
    } catch (error) {
      toast.error('植物の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black text-center">新しい植物を登録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">名前 <span className="text-red-500">*</span></label>
            <Input value={newPlant.name} onChange={e => setNewPlant({...newPlant, name: e.target.value})} placeholder="例: ミニトマト" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">品種 (任意)</label>
              <Input value={newPlant.variety} onChange={e => setNewPlant({...newPlant, variety: e.target.value})} placeholder="例: アイコ" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">場所 (任意)</label>
              <Input value={newPlant.location} onChange={e => setNewPlant({...newPlant, location: e.target.value})} placeholder="例: ベランダ" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">植え付け日 (任意)</label>
            <Input type="date" value={newPlant.planting_date} onChange={e => setNewPlant({...newPlant, planting_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
          </div>

          <Button onClick={handleAddPlant} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg mt-4">
            {isSubmitting ? '登録中...' : '登録する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- 植物編集モーダル ---
export function PlantEditModal({ 
  isOpen, 
  onClose, 
  plant,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plant: PlantInfo | null;
  onSuccess: () => void;
}) {
  const [editPlant, setEditPlant] = useState({ 
    name: '', 
    variety: '', 
    planting_date: '',
    location: '',
    status: 'growing' as const
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plant) {
      setEditPlant({
        name: plant.name,
        variety: plant.variety || '',
        planting_date: plant.planting_date || '',
        location: plant.location || '',
        status: plant.status
      });
    }
  }, [plant, isOpen]);

  const handleUpdatePlant = async () => {
    if (!plant) return;
    if (!editPlant.name) {
      toast.error('名前を入力してください');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/plants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plant.id,
          ...editPlant,
          name: editPlant.name,
          variety: editPlant.variety || null,
          planting_date: editPlant.planting_date || null,
          location: editPlant.location || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('情報を更新しました');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlant = async () => {
    if (!plant) return;
    if (!confirm(`${plant.name}のデータを削除しますか？\n（この操作は取り消せません）`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/plants?id=${plant.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('削除しました');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('削除に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black text-center">植物情報の編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">名前 <span className="text-red-500">*</span></label>
            <Input value={editPlant.name} onChange={e => setEditPlant({...editPlant, name: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">品種 (任意)</label>
              <Input value={editPlant.variety} onChange={e => setEditPlant({...editPlant, variety: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">場所 (任意)</label>
              <Input value={editPlant.location} onChange={e => setEditPlant({...editPlant, location: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">植え付け日 (任意)</label>
              <Input type="date" value={editPlant.planting_date} onChange={e => setEditPlant({...editPlant, planting_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">ステータス</label>
              <Select value={editPlant.status} onValueChange={(val: any) => setEditPlant({...editPlant, status: val})}>
                <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growing" className="font-bold">栽培中</SelectItem>
                  <SelectItem value="harvested" className="font-bold">収穫中</SelectItem>
                  <SelectItem value="ended" className="font-bold">終了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleUpdatePlant} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg">
              {isSubmitting ? '更新中...' : '情報を更新する'}
            </Button>
            <Button variant="ghost" onClick={handleDeletePlant} disabled={isSubmitting} className="w-full h-10 text-red-400 hover:text-red-500 hover:bg-red-50 font-bold">
              <Trash2 size={16} className="mr-2" /> データを削除する
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function GardenScreen({ 
  plants,
  isLoading,
  onOpenRecord,
  onOpenHistory,
  onOpenAddPlant,
  onOpenEdit,
  refreshTrigger 
}: { 
  plants: PlantInfo[];
  isLoading: boolean;
  onOpenRecord: (plant: PlantInfo) => void;
  onOpenHistory: (plant: PlantInfo) => void;
  onOpenAddPlant: () => void;
  onOpenEdit: (plant: PlantInfo) => void;
  refreshTrigger: number;
}) {
  const activePlants = useMemo(() => plants.filter(p => p.status !== 'ended'), [plants]);
  const endedPlants = useMemo(() => plants.filter(p => p.status === 'ended'), [plants]);

  const renderPlantList = (list: PlantInfo[], isEnded: boolean = false) => {
    if (list.length === 0) return null;

    return (
      <div className="space-y-1">
        <ul className={`divide-y divide-slate-100 border-t border-slate-100 ${isEnded ? 'bg-slate-50/30' : 'bg-white'}`}>
          {list.map((plant) => {
            const daysDiff = plant.planting_date 
              ? Math.floor((new Date().getTime() - new Date(plant.planting_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
              : null;

            return (
              <li 
                key={plant.id}
                className={`flex items-center gap-3 py-2 px-3 transition-colors group ${isEnded ? 'opacity-70 grayscale-[0.5]' : 'hover:bg-slate-50/50'}`}
              >
                {/* 1. 名前 (クリックで編集) */}
                <div 
                  onClick={() => onOpenEdit(plant)}
                  className="flex flex-1 items-center gap-2 cursor-pointer min-w-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`font-bold truncate text-sm ${isEnded ? 'text-slate-500' : 'text-slate-700'}`}>
                      {plant.name}
                      {plant.variety && <span className="text-[10px] text-slate-400 ml-1 font-normal">({plant.variety})</span>}
                    </span>
                    {daysDiff !== null && !isEnded && (
                      <span className="text-[9px] font-bold text-green-500 leading-none">
                        {daysDiff}日目
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. 場所 */}
                <div className="flex flex-col items-end shrink-0 min-w-[50px]">
                  <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">場所</span>
                  <span className="text-[11px] font-medium text-slate-500 leading-none">
                    {plant.location || '-'}
                  </span>
                </div>

                {/* 3. 植え付け日 */}
                <div className="flex flex-col items-end shrink-0 min-w-[60px]">
                  <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">
                    {isEnded ? '終了日' : '植付日'}
                  </span>
                  <span className="text-[11px] text-slate-400 tabular-nums leading-none">
                    {plant.planting_date ? format(new Date(plant.planting_date), 'yy/MM/dd') : '-'}
                  </span>
                </div>

                {/* 4. アクションボタン */}
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenHistory(plant)}
                    className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                  >
                    <ClipboardList size={16} />
                  </Button>
                  {!isEnded && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenRecord(plant)}
                      className="h-8 w-8 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-full"
                    >
                      <Plus size={18} />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 pb-24">
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">読込中...</div>
      ) : plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="font-bold text-sm">植物が登録されていません</p>
          <p className="text-[11px] text-center px-4 mt-1 opacity-70">右下の＋ボタンから植物を登録しましょう</p>
        </div>
      ) : (
        <>
          {/* 栽培中セクション */}
          <div className="space-y-3">
            <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              栽培中の植物
            </h3>
            {activePlants.length > 0 ? (
              renderPlantList(activePlants, false)
            ) : (
              <div className="text-center py-8 text-slate-300 text-[11px] font-bold border rounded-2xl border-dashed">
                栽培中の植物はありません
              </div>
            )}
          </div>

          {/* 終了セクション */}
          {endedPlants.length > 0 && (
            <div className="space-y-3 pt-4 opacity-80">
              <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                過去の栽培
              </h3>
              {renderPlantList(endedPlants, true)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
