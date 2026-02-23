'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PetInfo, PetRecord, PetItem } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar, ClipboardList, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- 記録用モーダル ---
export function PetRecordModal({ 
  isOpen, 
  onClose, 
  pet, 
  recordItems,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pet: PetInfo | null;
  recordItems: PetItem[];
  onSuccess: () => void;
}) {
  const [newRecord, setNewRecord] = useState({ 
    record_type: '', 
    numeric_value: '', 
    unit: '', 
    note: '',
    recorded_at: format(new Date(), 'yyyy-MM-dd')
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && recordItems.length > 0 && !newRecord.record_type) {
      setNewRecord(prev => ({ 
        ...prev, 
        record_type: recordItems[0].label, 
        unit: recordItems[0].unit || '' 
      }));
    }
  }, [isOpen, recordItems, newRecord.record_type]);

  const handleAddRecord = async () => {
    if (!pet) return;
    const type = newRecord.record_type;
    if (!type) {
      toast.error('記録項目を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pets/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: pet.id,
          record_type: type,
          numeric_value: newRecord.numeric_value ? parseFloat(newRecord.numeric_value) : null,
          unit: newRecord.unit,
          note: newRecord.note,
          recorded_at: newRecord.recorded_at ? new Date(newRecord.recorded_at).toISOString() : new Date().toISOString()
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('記録を保存しました');
      onSuccess();
      onClose();
      setNewRecord({ 
        record_type: recordItems[0]?.label || '体重', 
        numeric_value: '', 
        unit: recordItems[0]?.unit || 'g', 
        note: '',
        recorded_at: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      toast.error('記録の保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = recordItems.find(t => t.label === newRecord.record_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center gap-2">
            {(pet?.name || pet?.species)}の記録
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
          <div className={`grid gap-3 ${selectedItem?.show_numeric ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
              <Select value={newRecord.record_type} onValueChange={(val) => {
                const preset = recordItems.find(t => t.label === val);
                setNewRecord({ ...newRecord, record_type: val, unit: preset?.unit || '' });
              }}>
                <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {recordItems.map(t => (
                    <SelectItem key={t.id} value={t.label} className="font-bold">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItem?.show_numeric && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  数値 <span className="lowercase">({newRecord.unit || '単位なし'})</span>
                </label>
                <Input 
                  type="number" 
                  value={newRecord.numeric_value} 
                  onChange={e => setNewRecord({...newRecord, numeric_value: e.target.value})} 
                  className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-black"
                />
              </div>
            )}
          </div>
          {selectedItem?.show_memo && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">メモ</label>
              <Textarea 
                value={newRecord.note} 
                onChange={e => setNewRecord({...newRecord, note: e.target.value})} 
                placeholder="メモを入力..." 
                className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-bold"
              />
            </div>
          )}
          <Button onClick={handleAddRecord} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-lg">
            {isSubmitting ? '保存中...' : '記録を保存する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- 履歴用モーダル ---
export function PetHistoryModal({ 
  isOpen, 
  onClose, 
  pet,
  onRefresh
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pet: PetInfo | null;
  onRefresh?: () => void;
}) {
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!pet) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pets/records?petId=${pet.id}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      toast.error('履歴の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [pet]);

  useEffect(() => {
    if (isOpen && pet) {
      fetchRecords();
    }
  }, [isOpen, pet, fetchRecords]);

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('この記録を削除しますか？')) return;

    try {
      const res = await fetch(`/api/pets/records?id=${id}`, { method: 'DELETE' });
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
            {(pet?.name || pet?.species)}の履歴
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
                  <div className="grid grid-cols-[auto_auto_50px_1fr_auto] items-center gap-2.5 mb-1">
                    {/* 1. 日付 */}
                    <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                      {format(new Date(record.recorded_at), 'yy/MM/dd', { locale: ja })}
                    </span>
                    
                    {/* 2. 項目 */}
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0 text-center min-w-[36px]">
                      {record.record_type}
                    </span>

                    {/* 3. 数値 */}
                    <div className="flex items-baseline gap-0.5 justify-end shrink-0">
                      {record.numeric_value !== null ? (
                        <>
                          <span className="text-xs font-black text-slate-700 tabular-nums">{record.numeric_value}</span>
                          <span className="text-[9px] font-bold text-slate-400">{record.unit}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </div>

                    {/* 空白のカラム（メモ用の領域を確保するため） */}
                    <div className="flex-1"></div>

                    {/* 5. 削除ボタン */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>

                  {/* 4. メモ (複数行対応) */}
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

// --- ペット登録モーダル ---
export function PetAddModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (pet: PetInfo) => void;
}) {
  const [newPet, setNewPet] = useState({ 
    name: '', 
    species: '', 
    acquisition_date: '',
    birthday: '',
    quantity: '1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddPet = async () => {
    if (!newPet.species) {
      toast.error('種類を入力してください');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPet,
          quantity: newPet.quantity ? parseInt(newPet.quantity) : 1,
          name: newPet.name || null,
          acquisition_date: newPet.acquisition_date || null,
          birthday: newPet.birthday || null,
        }),
      });
      const data = await res.json();
      onSuccess(data);
      onClose();
      setNewPet({ 
        name: '', 
        species: '', 
        acquisition_date: '', 
        birthday: '', 
        quantity: '1' 
      });
      toast.success('ペットを登録しました');
    } catch (error) {
      toast.error('ペットの登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-black text-center">新しいペットを登録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">種類 <span className="text-red-500">*</span></label>
              <Input value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} placeholder="例: デグー" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">名前 (任意)</label>
              <Input value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} placeholder="例: もち丸" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">数量</label>
            <Input type="number" value={newPet.quantity} onChange={e => setNewPet({...newPet, quantity: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">誕生日 (任意)</label>
              <Input type="date" value={newPet.birthday} onChange={e => setNewPet({...newPet, birthday: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">お迎え日 (任意)</label>
              <Input type="date" value={newPet.acquisition_date} onChange={e => setNewPet({...newPet, acquisition_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>

          <Button onClick={handleAddPet} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg mt-4">
            {isSubmitting ? '登録中...' : '登録する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- ペット編集モーダル ---
export function PetEditModal({ 
  isOpen, 
  onClose, 
  pet,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pet: PetInfo | null;
  onSuccess: () => void;
}) {
  const [editPet, setEditPet] = useState({ 
    name: '', 
    species: '', 
    acquisition_date: '',
    birthday: '',
    quantity: '1'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pet) {
      setEditPet({
        name: pet.name || '',
        species: pet.species,
        acquisition_date: pet.acquisition_date || '',
        birthday: pet.birthday || '',
        quantity: pet.quantity?.toString() || '1'
      });
    }
  }, [pet, isOpen]);

  const handleUpdatePet = async () => {
    if (!pet) return;
    if (!editPet.species) {
      toast.error('種類を入力してください');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pet.id,
          ...editPet,
          quantity: editPet.quantity ? parseInt(editPet.quantity) : 1,
          name: editPet.name || null,
          acquisition_date: editPet.acquisition_date || null,
          birthday: editPet.birthday || null,
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

  const handleDeletePet = async () => {
    if (!pet) return;
    if (!confirm(`${pet.name || pet.species}のデータを削除しますか？\n（この操作は取り消せません）`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pets?id=${pet.id}`, { method: 'DELETE' });
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
          <DialogTitle className="font-black text-center">ペット情報の編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">種類 <span className="text-red-500">*</span></label>
              <Input value={editPet.species} onChange={e => setEditPet({...editPet, species: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">名前 (任意)</label>
              <Input value={editPet.name} onChange={e => setEditPet({...editPet, name: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">数量</label>
            <Input type="number" value={editPet.quantity} onChange={e => setEditPet({...editPet, quantity: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">誕生日 (任意)</label>
              <Input type="date" value={editPet.birthday} onChange={e => setEditPet({...editPet, birthday: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">お迎え日 (任意)</label>
              <Input type="date" value={editPet.acquisition_date} onChange={e => setEditPet({...editPet, acquisition_date: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleUpdatePet} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg">
              {isSubmitting ? '更新中...' : '情報を更新する'}
            </Button>
            <Button variant="ghost" onClick={handleDeletePet} disabled={isSubmitting} className="w-full h-10 text-red-400 hover:text-red-500 hover:bg-red-50 font-bold">
              <Trash2 size={16} className="mr-2" /> データを削除する
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PetLogScreen({ 
  pets,
  isLoading,
  onOpenRecord,
  onOpenHistory,
  onOpenAddPet,
  onOpenEdit,
  refreshTrigger 
}: { 
  pets: PetInfo[];
  isLoading: boolean;
  onOpenRecord: (pet: PetInfo) => void;
  onOpenHistory: (pet: PetInfo) => void;
  onOpenAddPet: () => void;
  onOpenEdit: (pet: PetInfo) => void;
  refreshTrigger: number;
}) {
  const alivePets = useMemo(() => pets.filter(p => p.status === 'alive'), [pets]);
  const memorialPets = useMemo(() => pets.filter(p => p.status === 'memorial'), [pets]);

  const groupPets = (list: PetInfo[]) => {
    const groups: Record<string, PetInfo[]> = {};
    list.forEach(pet => {
      if (!groups[pet.species]) groups[pet.species] = [];
      groups[pet.species].push(pet);
    });
    return groups;
  };

  const aliveGroups = groupPets(alivePets);
  const memorialGroups = groupPets(memorialPets);

  const renderPetList = (groups: Record<string, PetInfo[]>, isMemorial: boolean = false) => {
    const speciesList = Object.keys(groups);
    if (speciesList.length === 0) return null;

    return (
      <div className="space-y-6">
        {speciesList.map((species) => (
          <div key={species} className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isMemorial ? 'text-slate-300' : 'text-slate-400'}`}>
                {species}
              </span>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <ul className={`divide-y divide-slate-100 border-t border-slate-100 ${isMemorial ? 'bg-slate-50/30' : 'bg-white'}`}>
              {groups[species].map((pet) => {
                const daysDiff = pet.acquisition_date 
                  ? Math.floor((new Date().getTime() - new Date(pet.acquisition_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                  : null;

                return (
                  <li 
                    key={pet.id}
                    className={`flex items-center gap-3 py-2 px-3 transition-colors group ${isMemorial ? 'opacity-70 grayscale-[0.5]' : 'hover:bg-slate-50/50'}`}
                  >
                    {/* 1. 名前 (クリックで編集) */}
                    <div 
                      onClick={() => onOpenEdit(pet)}
                      className="flex flex-1 items-center gap-2 cursor-pointer min-w-0"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold truncate text-sm ${isMemorial ? 'text-slate-500' : 'text-slate-700'}`}>
                          {pet.name || <span className="text-slate-300 font-normal italic">No Name</span>}
                        </span>
                        {daysDiff !== null && !isMemorial && (
                          <span className="text-[9px] font-bold text-blue-400 leading-none">
                            {daysDiff}日目
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 2. 数量 */}
                    <div className="flex flex-col items-end shrink-0 w-8">
                      <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">数量</span>
                      <span className="text-[11px] font-medium text-slate-500 leading-none">
                        {pet.quantity ? `${pet.quantity}匹` : '1匹'}
                      </span>
                    </div>

                    {/* 3. お迎え日 */}
                    <div className="flex flex-col items-end shrink-0 min-w-[60px]">
                      <span className="text-[9px] font-bold text-slate-300 leading-none mb-0.5">
                        {isMemorial ? 'お別れ日' : 'お迎え日'}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums leading-none">
                        {pet.acquisition_date ? format(new Date(pet.acquisition_date), 'yy/MM/dd') : '-'}
                      </span>
                    </div>

                    {/* 4. アクションボタン */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenHistory(pet)}
                        className="h-8 w-8 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full"
                      >
                        <ClipboardList size={16} />
                      </Button>
                      {!isMemorial && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenRecord(pet)}
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
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 pb-24">
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">読込中...</div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="font-bold text-sm">ペットが登録されていません</p>
          <p className="text-[11px] text-center px-4 mt-1 opacity-70">右下の＋ボタンからペットを登録しましょう</p>
        </div>
      ) : (
        <>
          {/* 飼育中セクション */}
          <div className="space-y-3">
            <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              飼育中の生体
            </h3>
            {alivePets.length > 0 ? (
              renderPetList(aliveGroups, false)
            ) : (
              <div className="text-center py-8 text-slate-300 text-[11px] font-bold border rounded-2xl border-dashed">
                飼育中の生体はいません
              </div>
            )}
          </div>

          {/* メモリアルセクション */}
          {memorialPets.length > 0 && (
            <div className="space-y-3 pt-4 opacity-80">
              <h3 className="px-2 text-xs font-black text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                想い出（メモリアル）
              </h3>
              {renderPetList(memorialGroups, true)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
