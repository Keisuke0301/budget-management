'use client';

import { useState, useEffect, useCallback } from 'react';
import { PetInfo, PetRecord } from '@/app/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, PlusCircle, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const RECORD_TYPES = [
  { label: '体重', unit: 'g' },
  { label: '体長', unit: 'cm' },
  { label: '水温', unit: '℃' },
  { label: '気温', unit: '℃' },
  { label: '日記', unit: '' },
  { label: 'その他', unit: '' },
];

export default function PetLogScreen() {
  const [pets, setPets] = useState<PetInfo[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetInfo | null>(null);
  const [records, setRecords] = useState<PetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 新規ペット用
  const [newPet, setNewPet] = useState({ name: '', species: '', emoji_icon: '🐭', acquisition_date: '' });
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  // 新規記録用
  const [newRecord, setNewRecord] = useState({ 
    record_type: '体重', 
    custom_type: '',
    numeric_value: '', 
    unit: 'g', 
    note: '' 
  });

  const fetchPets = useCallback(async () => {
    try {
      const res = await fetch('/api/pets');
      const data = await res.json();
      setPets(data);
      if (data.length > 0 && !selectedPet) {
        setSelectedPet(data[0]);
      }
    } catch (error) {
      toast.error('ペット情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPet]);

  const fetchRecords = useCallback(async (petId: number) => {
    try {
      const res = await fetch(`/api/pets/records?petId=${petId}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      toast.error('記録の取得に失敗しました');
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  useEffect(() => {
    if (selectedPet) {
      fetchRecords(selectedPet.id);
    }
  }, [selectedPet, fetchRecords]);

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.species) return;
    try {
      const res = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPet),
      });
      const data = await res.json();
      setPets(prev => [...prev, data]);
      setSelectedPet(data);
      setIsPetModalOpen(false);
      setNewPet({ name: '', species: '', emoji_icon: '🐭', acquisition_date: '' });
      toast.success('ペットを登録しました');
    } catch (error) {
      toast.error('ペットの登録に失敗しました');
    }
  };

  const handleAddRecord = async () => {
    if (!selectedPet) return;
    
    const type = newRecord.record_type === 'その他' ? newRecord.custom_type : newRecord.record_type;
    if (!type) {
      toast.error('記録項目を入力してください');
      return;
    }

    try {
      const res = await fetch('/api/pets/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPet.id,
          record_type: type,
          numeric_value: newRecord.numeric_value ? parseFloat(newRecord.numeric_value) : null,
          unit: newRecord.unit,
          note: newRecord.note,
        }),
      });
      const data = await res.json();
      setRecords(prev => [data, ...prev]);
      setNewRecord({ ...newRecord, numeric_value: '', note: '' });
      toast.success('記録を保存しました');
    } catch (error) {
      toast.error('記録の保存に失敗しました');
    }
  };

  const handleTypeChange = (val: string) => {
    const preset = RECORD_TYPES.find(t => t.label === val);
    setNewRecord({ 
      ...newRecord, 
      record_type: val, 
      unit: preset?.unit || '',
      custom_type: val === 'その他' ? '' : val
    });
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* ペット選択エリア */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {pets.map(pet => (
          <button
            key={pet.id}
            onClick={() => setSelectedPet(pet)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all min-w-[80px] ${
              selectedPet?.id === pet.id 
                ? 'bg-blue-50 border-blue-400 shadow-md scale-105' 
                : 'bg-white border-slate-100 text-slate-400'
            }`}
          >
            <span className="text-3xl">{pet.emoji_icon}</span>
            <span className={`text-xs font-black truncate w-full text-center ${selectedPet?.id === pet.id ? 'text-blue-700' : ''}`}>
              {pet.name}
            </span>
          </button>
        ))}
        
        <Dialog open={isPetModalOpen} onOpenChange={setIsPetModalOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-400 min-w-[80px] h-[84px] transition-colors">
              <Plus size={24} />
              <span className="text-[10px] font-bold">追加</span>
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black">新しいペットを登録</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">名前</label>
                <Input value={newPet.name} onChange={e => setNewPet({...newPet, name: e.target.value})} placeholder="例: もち丸" className="rounded-xl h-12" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 ml-1">種類</label>
                <Input value={newPet.species} onChange={e => setNewPet({...newPet, species: e.target.value})} placeholder="例: デグー" className="rounded-xl h-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">アイコン (絵文字)</label>
                  <Input value={newPet.emoji_icon} onChange={e => setNewPet({...newPet, emoji_icon: e.target.value})} placeholder="🐭" className="rounded-xl h-12 text-center text-2xl" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">お迎え日</label>
                  <Input type="date" value={newPet.acquisition_date} onChange={e => setNewPet({...newPet, acquisition_date: e.target.value})} className="rounded-xl h-12" />
                </div>
              </div>
              <Button onClick={handleAddPet} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg mt-2">
                登録する
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPet ? (
        <div className="space-y-6">
          {/* 記録フォーム */}
          <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
            <CardHeader className="p-5 pb-0">
              <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800 tracking-tight">
                <ClipboardList className="text-blue-500" size={20} />
                {selectedPet.name}の記録をつける
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目</label>
                  <Select value={newRecord.record_type} onValueChange={handleTypeChange}>
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
                {newRecord.record_type === 'その他' && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">項目名を入力</label>
                    <Input 
                      value={newRecord.custom_type} 
                      onChange={e => setNewRecord({...newRecord, custom_type: e.target.value})} 
                      placeholder="例: 心拍数" 
                      className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-bold"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">数値</label>
                   <div className="relative">
                      <Input 
                        type="number" 
                        value={newRecord.numeric_value} 
                        onChange={e => setNewRecord({...newRecord, numeric_value: e.target.value})} 
                        className="rounded-xl h-11 border-slate-100 bg-slate-50/50 font-black"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                         <input 
                            value={newRecord.unit} 
                            onChange={e => setNewRecord({...newRecord, unit: e.target.value})}
                            className="w-8 bg-transparent text-right text-xs font-black text-slate-400 focus:outline-none"
                            placeholder="単位"
                         />
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">メモ</label>
                <Textarea 
                  value={newRecord.note} 
                  onChange={e => setNewRecord({...newRecord, note: e.target.value})} 
                  placeholder="元気に走り回っていた！" 
                  className="rounded-xl border-slate-100 bg-slate-50/50 min-h-[80px] font-bold"
                />
              </div>

              <Button onClick={handleAddRecord} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-lg shadow-slate-200">
                 保存する
              </Button>
            </CardContent>
          </Card>

          {/* 履歴エリア */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">記録履歴</h3>
            </div>
            {records.length === 0 ? (
              <div className="py-12 text-center text-slate-300 font-bold bg-white/50 rounded-3xl border-2 border-dashed border-slate-100">
                まだ記録がありません
              </div>
            ) : (
              <div className="space-y-3">
                {records.map(record => (
                  <Card key={record.id} className="rounded-2xl border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-tighter">
                               {record.record_type}
                             </span>
                             <span className="text-[10px] font-bold text-slate-300">
                               {format(new Date(record.recorded_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                             </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            {record.numeric_value !== null && (
                              <>
                                <span className="text-2xl font-black text-slate-800 tracking-tighter">{record.numeric_value}</span>
                                <span className="text-xs font-bold text-slate-400">{record.unit}</span>
                              </>
                            )}
                          </div>
                          {record.note && (
                            <p className="text-sm font-bold text-slate-600 mt-1 leading-relaxed border-l-2 border-slate-100 pl-3 py-1">
                              {record.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-100 mx-2">
          <p className="font-bold">ペットが登録されていません</p>
          <p className="text-xs">上の＋ボタンから登録してください</p>
        </div>
      )}
    </div>
  );
}
