'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PetInfo, PetRecord } from '@/app/types';
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
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pet: PetInfo | null;
  onSuccess: () => void;
}) {
  const [newRecord, setNewRecord] = useState({ 
    record_type: '体重', 
    custom_type: '',
    numeric_value: '', 
    unit: 'g', 
    note: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const RECORD_TYPES = [
    { label: '体重', unit: 'g' },
    { label: '体長', unit: 'cm' },
    { label: '水温', unit: '℃' },
    { label: '気温', unit: '℃' },
    { label: '日記', unit: '' },
    { label: 'その他', unit: '' },
  ];

  const handleAddRecord = async () => {
    if (!pet) return;
    const type = newRecord.record_type === 'その他' ? newRecord.custom_type : newRecord.record_type;
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
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('記録を保存しました');
      onSuccess();
      onClose();
      setNewRecord({ record_type: '体重', custom_type: '', numeric_value: '', unit: 'g', note: '' });
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
            <span className="text-2xl">{pet?.emoji_icon}</span>
            {(pet?.name || pet?.species)}の記録
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
              <Select value={newRecord.record_type} onValueChange={(val) => {
                const preset = RECORD_TYPES.find(t => t.label === val);
                setNewRecord({ ...newRecord, record_type: val, unit: preset?.unit || '', custom_type: val === 'その他' ? '' : val });
              }}>
                <SelectTrigger className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map(t => (
                    <SelectItem key={t.label} value={t.label} className="font-bold">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">数値 ({newRecord.unit || '単位なし'})</label>
               <Input 
                type="number" 
                value={newRecord.numeric_value} 
                onChange={e => setNewRecord({...newRecord, numeric_value: e.target.value})} 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-black"
              />
            </div>
          </div>
          {newRecord.record_type === 'その他' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目名</label>
              <Input 
                value={newRecord.custom_type} 
                onChange={e => setNewRecord({...newRecord, custom_type: e.target.value})} 
                placeholder="例: 心拍数" 
                className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold"
              />
            </div>
          )}
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
export function PetHistoryModal({ 
  isOpen, 
  onClose, 
  pet 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  pet: PetInfo | null;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[450px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black flex items-center gap-2 border-b pb-2">
            <span className="text-2xl">{pet?.emoji_icon}</span>
            {(pet?.name || pet?.species)}の履歴
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 font-bold">読込中...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold border-2 border-dashed rounded-3xl">記録がありません</div>
          ) : (
            records.map(record => (
              <div key={record.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200 uppercase tracking-tighter">
                    {record.record_type}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {format(new Date(record.recorded_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  {record.numeric_value !== null && (
                    <>
                      <span className="text-xl font-black text-slate-800 tracking-tighter">{record.numeric_value}</span>
                      <span className="text-xs font-bold text-slate-400">{record.unit}</span>
                    </>
                  )}
                </div>
                {record.note && <p className="text-xs font-bold text-slate-600 mt-1">{record.note}</p>}
              </div>
            ))
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
    emoji_icon: '🐭', 
    acquisition_date: '',
    birthday: '',
    price: '',
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
          price: newPet.price ? parseInt(newPet.price) : null,
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
        emoji_icon: '🐭', 
        acquisition_date: '', 
        birthday: '', 
        price: '', 
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">数量</label>
              <Input type="number" value={newPet.quantity} onChange={e => setNewPet({...newPet, quantity: e.target.value})} className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">購入価格 (任意)</label>
              <Input type="number" value={newPet.price} onChange={e => setNewPet({...newPet, price: e.target.value})} placeholder="0" className="rounded-xl h-11 border-slate-100 bg-slate-50/50" />
            </div>
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1">アイコン (絵文字)</label>
            <Input value={newPet.emoji_icon} onChange={e => setNewPet({...newPet, emoji_icon: e.target.value})} placeholder="🐭" className="rounded-xl h-11 border-slate-100 bg-slate-50/50 text-center text-xl" />
          </div>

          <Button onClick={handleAddPet} disabled={isSubmitting} className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg mt-4">
            {isSubmitting ? '登録中...' : '登録する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PetLogScreen({ 
  onOpenRecord,
  onOpenHistory,
  onOpenAddPet,
  refreshTrigger 
}: { 
  onOpenRecord: (pet: PetInfo) => void;
  onOpenHistory: (pet: PetInfo) => void;
  onOpenAddPet: () => void;
  refreshTrigger: number;
}) {
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    try {
      const res = await fetch('/api/pets');
      const data = await res.json();
      setPets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets, refreshTrigger]);

  const groupedPets = useMemo(() => {
    const groups: Record<string, PetInfo[]> = {};
    pets.forEach(pet => {
      if (!groups[pet.species]) groups[pet.species] = [];
      groups[pet.species].push(pet);
    });
    return groups;
  }, [pets]);

  const speciesList = Object.keys(groupedPets);

  return (
    <div className="w-full space-y-2 pb-24">
      {isLoading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse text-sm">読込中...</div>
      ) : speciesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="font-bold text-sm">ペットが登録されていません</p>
          <p className="text-[11px] text-center px-4 mt-1 opacity-70">右下の＋ボタンからペットを登録しましょう</p>
        </div>
      ) : (
        <div className="space-y-6">
          {speciesList.map((species) => (
            <div key={species} className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {species}
                </span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>
              <ul className="divide-y divide-slate-100">
                {groupedPets[species].map((pet) => (
                  <li key={pet.id}>
                    <button
                      onClick={() => onOpenRecord(pet)}
                      className="flex items-center gap-3 w-full py-3 px-2 hover:bg-slate-50 active:bg-slate-100 transition-colors group text-left"
                    >
                      <span className="text-xl w-8 text-center shrink-0">
                        {pet.emoji_icon}
                      </span>
                      <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 text-sm truncate">
                              {pet.name || <span className="text-slate-300 font-normal">名前なし</span>}
                            </span>
                            {pet.quantity && pet.quantity > 1 && (
                              <span className="text-[10px] font-black text-slate-400">
                                x{pet.quantity}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {pet.acquisition_date && (
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                {format(new Date(pet.acquisition_date), 'yyyy/MM/dd')}
                              </span>
                            )}
                          </div>
                        </div>
                        {pet.price !== null && (
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-500 tabular-nums">
                              ¥{pet.price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
