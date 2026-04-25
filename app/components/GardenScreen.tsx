'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PlantInfo, PlantRecord } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  Sprout, 
  Leaf, 
  Flower2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List as ListIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
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
  '播種',
  '定植',
  '病害虫対策',
  '剪定/芽かき',
  '収穫終了'
];

interface PlantRecordWithInfo extends PlantRecord {
  plant_info: {
    name: string;
  };
}

// --- まとめて記録用モーダル ---
export function BulkRecordModal({
  isOpen,
  onClose,
  plants,
  onSuccess,
  selectedDate
}: {
  isOpen: boolean;
  onClose: () => void;
  plants: PlantInfo[];
  onSuccess: () => void;
  selectedDate: string;
}) {
  const [selectedPlantIds, setSelectedPlantIds] = useState<number[]>([]);
  const [recordType, setRecordType] = useState('水やり');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlantIds(plants.filter(p => p.status !== 'ended').map(p => p.id));
    }
  }, [isOpen, plants]);

  const handleBulkSubmit = async () => {
    if (selectedPlantIds.length === 0) {
      toast.error('植物を選択してください');
      return;
    }
    setIsSubmitting(true);
    try {
      const records = selectedPlantIds.map(id => ({
        plant_id: id,
        record_type: recordType,
        note: note || null,
        recorded_at: new Date(selectedDate).toISOString()
      }));

      const res = await fetch('/api/plants/records/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });

      if (!res.ok) throw new Error();
      toast.success('まとめて記録しました');
      onSuccess();
      onClose();
      setNote('');
    } catch (error) {
      toast.error('記録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlant = (id: number) => {
    setSelectedPlantIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-black text-center text-slate-700">
            {selectedDate ? format(new Date(selectedDate), 'M/d') : ''} のまとめて記録
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANT_RECORD_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="font-bold">{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">対象の植物</label>
            <div className="grid grid-cols-2 gap-2">
              {plants.filter(p => p.status !== 'ended').map(plant => (
                <div 
                  key={plant.id}
                  onClick={() => togglePlant(plant.id)}
                  className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-2 ${
                    selectedPlantIds.includes(plant.id) 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedPlantIds.includes(plant.id) ? 'border-green-500 bg-green-500' : 'border-slate-200'
                  }`}>
                    {selectedPlantIds.includes(plant.id) && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-bold truncate">{plant.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">メモ (任意)</label>
            <Textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="メモを入力..." 
              className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[60px] font-bold"
            />
          </div>
        </div>
        <div className="pt-2">
          <Button onClick={handleBulkSubmit} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-lg">
            {isSubmitting ? '記録中...' : `${selectedPlantIds.length}件を記録する`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- 日付詳細モーダル ---
export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  records,
  onOpenBulk
}: {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  records: PlantRecordWithInfo[];
  onOpenBulk: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[400px] max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center justify-between border-b pb-2 text-slate-700">
            <span>{date ? format(new Date(date), 'yyyy年M月d日') : ''}</span>
            <Button variant="ghost" size="sm" onClick={onOpenBulk} className="text-xs text-green-600 font-bold hover:bg-green-50 h-8 px-2 rounded-lg">
              <Plus size={14} className="mr-1" /> まとめて記録
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2 px-1">
          {records.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold">記録がありません</div>
          ) : (
            <ul className="space-y-3">
              {records.map(record => (
                <li key={record.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-slate-700">{record.plant_info?.name}</span>
                    <span className="text-[10px] font-bold text-white bg-green-500 px-1.5 py-0.5 rounded shrink-0">
                      {record.record_type}
                    </span>
                  </div>
                  {record.note && (
                    <p className="text-xs text-slate-600 leading-relaxed break-words pl-1 border-l-2 border-green-200">
                      {record.note}
                    </p>
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

// --- 記録用モーダル ---
export function PlantRecordModal({ 
  isOpen, 
  onClose, 
  plant, 
  onSuccess,
  initialDate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  plant: PlantInfo | null;
  onSuccess: () => void;
  initialDate?: string;
}) {
  const [newRecord, setNewRecord] = useState({ 
    record_type: '水やり', 
    note: '',
    recorded_at: initialDate || format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (isOpen) {
      setNewRecord({
        record_type: '水やり',
        note: '',
        recorded_at: initialDate || format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [isOpen, initialDate]);

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
    initial_type: '播種' as '播種' | '定植',
    price: '',
    quantity: ''
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
          name: newPlant.name,
          variety: newPlant.variety || null,
          planting_date: newPlant.planting_date || null,
          location: newPlant.location || null,
          status: 'growing',
          initial_type: newPlant.initial_type, // API側に渡して自動記録で使用
          price: newPlant.price ? parseInt(newPlant.price) : null,
          quantity: newPlant.quantity ? parseInt(newPlant.quantity) : null
        }),
      });
      const data = await res.json();
      onSuccess(data);
      onClose();
      setNewPlant({ 
        name: '', 
        variety: '', 
        planting_date: format(new Date(), 'yyyy-MM-dd'), 
        location: '',
        initial_type: '播種',
        price: '',
        quantity: ''
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">日付</label>
              <Input type="date" value={newPlant.planting_date} onChange={e => setNewPlant({...newPlant, planting_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">開始方法</label>
              <Select value={newPlant.initial_type} onValueChange={(val: any) => setNewPlant({...newPlant, initial_type: val})}>
                <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="播種" className="font-bold">播種 (種まき)</SelectItem>
                  <SelectItem value="定植" className="font-bold">定植 (苗植え)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">名前 <span className="text-red-500">*</span></label>
              <Input value={newPlant.name} onChange={e => setNewPlant({...newPlant, name: e.target.value})} placeholder="例: トマト" className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">品種</label>
              <Input value={newPlant.variety} onChange={e => setNewPlant({...newPlant, variety: e.target.value})} placeholder="例: アイコ" className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">栽培場所</label>
            <Input value={newPlant.location} onChange={e => setNewPlant({...newPlant, location: e.target.value})} placeholder="例: ベランダ" className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">値段 (任意)</label>
              <Input 
                type="number" 
                value={newPlant.price} 
                onChange={e => setNewPlant({...newPlant, price: e.target.value})} 
                placeholder="例: 500" 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">個数 (任意)</label>
              <Input 
                type="number" 
                value={newPlant.quantity} 
                onChange={e => setNewPlant({...newPlant, quantity: e.target.value})} 
                placeholder="例: 1" 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" 
              />
            </div>
          </div>

          <Button onClick={handleAddPlant} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg mt-4 transition-all active:scale-95">
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
  const [editPlant, setEditPlant] = useState<{
    name: string;
    variety: string;
    planting_date: string;
    location: string;
    status: 'growing' | 'harvested' | 'ended';
    price: string;
    quantity: string;
  }>({ 
    name: '', 
    variety: '', 
    planting_date: '',
    location: '',
    status: 'growing',
    price: '',
    quantity: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plant) {
      setEditPlant({
        name: plant.name,
        variety: plant.variety || '',
        planting_date: plant.planting_date || '',
        location: plant.location || '',
        status: plant.status,
        price: plant.price?.toString() || '',
        quantity: plant.quantity?.toString() || ''
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
          price: editPlant.price ? parseInt(editPlant.price) : null,
          quantity: editPlant.quantity ? parseInt(editPlant.quantity) : null
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
            <Input value={editPlant.name} onChange={e => setEditPlant({...editPlant, name: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">品種 (任意)</label>
              <Input value={editPlant.variety} onChange={e => setEditPlant({...editPlant, variety: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">場所 (任意)</label>
              <Input value={editPlant.location} onChange={e => setEditPlant({...editPlant, location: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">植え付け日 (任意)</label>
              <Input type="date" value={editPlant.planting_date} onChange={e => setEditPlant({...editPlant, planting_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">値段 (任意)</label>
              <Input 
                type="number" 
                value={editPlant.price} 
                onChange={e => setEditPlant({...editPlant, price: e.target.value})} 
                placeholder="例: 500" 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">個数 (任意)</label>
              <Input 
                type="number" 
                value={editPlant.quantity} 
                onChange={e => setEditPlant({...editPlant, quantity: e.target.value})} 
                placeholder="例: 1" 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold" 
              />
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

// --- メイン画面 ---
export default function GardenScreen({ 
  plants,
  isLoading,
  onOpenRecord,
  onOpenHistory,
  onOpenAddPlant,
  onOpenEdit,
  onUpdate,
  refreshTrigger 
}: { 
  plants: PlantInfo[];
  isLoading: boolean;
  onOpenRecord: (plant: PlantInfo) => void;
  onOpenHistory: (plant: PlantInfo) => void;
  onOpenAddPlant: () => void;
  onOpenEdit: (plant: PlantInfo) => void;
  onUpdate: () => void;
  refreshTrigger: number;
}) {
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<PlantRecordWithInfo[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [isBulkRecordOpen, setIsBulkRecordOpen] = useState(false);

  const activePlants = useMemo(() => plants.filter(p => p.status !== 'ended'), [plants]);
  const endedPlants = useMemo(() => plants.filter(p => p.status === 'ended'), [plants]);

  // 全記録の取得 (カレンダー用)
  const fetchAllRecords = useCallback(async () => {
    const start = format(startOfWeek(startOfMonth(currentMonth)), 'yyyy-MM-dd');
    const end = format(endOfWeek(endOfMonth(currentMonth)), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/plants/records?startDate=${start}&endDate=${end}`);
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Failed to fetch calendar records');
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords, refreshTrigger]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(format(day, 'yyyy-MM-dd'));
    setIsDayDetailsOpen(true);
  };

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const recordsByDate = useMemo(() => {
    const map: Record<string, PlantRecordWithInfo[]> = {};
    records.forEach(r => {
      const date = format(new Date(r.recorded_at), 'yyyy-MM-dd');
      if (!map[date]) map[date] = [];
      map[date].push(r);
    });
    return map;
  }, [records]);

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
                <div onClick={() => onOpenEdit(plant)} className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
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
                <div className="flex flex-col items-end shrink-0 min-w-[50px]">
                  <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">場所</span>
                  <span className="text-[11px] font-medium text-slate-500 leading-none">{plant.location || '-'}</span>
                </div>
                <div className="flex flex-col items-end shrink-0 min-w-[60px]">
                  <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">{isEnded ? '終了日' : '植付日'}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums leading-none">
                    {plant.planting_date ? format(new Date(plant.planting_date), 'yy/MM/dd') : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <Button variant="ghost" size="icon" onClick={() => onOpenHistory(plant)} className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full">
                    <ClipboardList size={16} />
                  </Button>
                  {!isEnded && (
                    <Button variant="ghost" size="icon" onClick={() => onOpenRecord(plant)} className="h-8 w-8 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-full">
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
    <div className="w-full space-y-6 pb-24">
      {/* ビュー切り替え */}
      <div className="flex justify-center p-1 bg-slate-100 rounded-2xl w-fit mx-auto">
        <Button 
          variant={!isCalendarView ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setIsCalendarView(false)}
          className={`rounded-xl px-4 h-9 font-black transition-all ${!isCalendarView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <ListIcon size={16} className="mr-1.5" /> 一覧
        </Button>
        <Button 
          variant={isCalendarView ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setIsCalendarView(true)}
          className={`rounded-xl px-4 h-9 font-black transition-all ${isCalendarView ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
        >
          <CalendarIcon size={16} className="mr-1.5" /> カレンダー
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">読込中...</div>
      ) : isCalendarView ? (
        /* --- カレンダー表示 --- */
        <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="py-4 px-6 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8 rounded-full">
              <ChevronLeft size={20} />
            </Button>
            <CardTitle className="text-base font-black text-slate-700">
              {format(currentMonth, 'yyyy年 M月')}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8 rounded-full">
              <ChevronRight size={20} />
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="calendar-weekdays mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map(d => (
                <div key={d} className={`text-[10px] font-black ${d === '日' ? 'text-red-400' : d === '土' ? 'text-blue-400' : 'text-slate-300'}`}>{d}</div>
              ))}
            </div>
            <div className="calendar-grid gap-y-2">
              {calendarDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayRecords = recordsByDate[dateKey] || [];
                const hasRecords = dayRecords.length > 0;
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <div 
                    key={dateKey} 
                    onClick={() => handleDayClick(day)}
                    className={`calendar-day flex flex-col h-12 rounded-2xl cursor-pointer transition-all ${
                      !inMonth ? 'opacity-20' : ''
                    } ${isToday ? 'bg-indigo-50 border-2 border-indigo-200 shadow-sm' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-xs font-black ${isToday ? 'text-indigo-600' : 'text-slate-600'}`}>
                      {format(day, 'd')}
                    </span>
                    {hasRecords && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayRecords.slice(0, 3).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-green-400 shadow-sm shadow-green-200"></div>
                        ))}
                        {dayRecords.length > 3 && <div className="w-1 h-1 rounded-full bg-slate-200"></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="font-bold text-sm">植物が登録されていません</p>
          <p className="text-[11px] text-center px-4 mt-1 opacity-70">右下の＋ボタンから植物を登録しましょう</p>
        </div>
      ) : (
        /* --- リスト表示 --- */
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              栽培中の植物
            </h3>
            {activePlants.length > 0 ? renderPlantList(activePlants, false) : (
              <div className="text-center py-8 text-slate-300 text-[11px] font-bold border rounded-2xl border-dashed">栽培中の植物はありません</div>
            )}
          </div>
          {endedPlants.length > 0 && (
            <div className="space-y-3 pt-4 opacity-80">
              <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                過去の栽培
              </h3>
              {renderPlantList(endedPlants, true)}
            </div>
          )}
        </div>
      )}

      {/* モーダル群 */}
      <DayDetailsModal 
        isOpen={isDayDetailsOpen} 
        onClose={() => setIsDayDetailsOpen(false)} 
        date={selectedDate || ''} 
        records={selectedDate ? (recordsByDate[selectedDate] || []) : []}
        onOpenBulk={() => {
          setIsDayDetailsOpen(false);
          setIsBulkRecordOpen(true);
        }}
      />
      <BulkRecordModal 
        isOpen={isBulkRecordOpen} 
        onClose={() => setIsBulkRecordOpen(false)} 
        plants={plants} 
        onSuccess={() => {
          fetchAllRecords();
          onUpdate();
        }} 
        selectedDate={selectedDate || ''}
      />
    </div>
  );
}
