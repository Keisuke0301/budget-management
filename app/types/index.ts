export interface Chore {
  id: number;
  created_at: string;
  note: string | null;
  score: number | null;
  multiplier: number | null;
  category: string | null;
  task: string | null;
  assignee: 'keisuke' | 'keiko' | string | null;
}

export interface Totals {
  keisuke: number;
  keiko: number;
  total: number;
}

export interface PetInfo {
  id: number;
  name: string | null;
  species: string;
  acquisition_date: string | null;
  birthday: string | null;
  quantity: number | null;
  created_at: string;
}

export interface PetItem {
  id: number;
  label: string;
  unit: string | null;
  display_order: number;
}

export interface PetRecord {
  id: number;
  pet_id: number;
  recorded_at: string;
  record_type: string;
  numeric_value: number | null;
  unit: string | null;
  note: string | null;
  created_at: string;
}

export interface MasterTask {
  id: number;
  category_id: string;
  name: string;
  score: number;
  icon: string;
  is_repeatable: boolean;
  is_bubble: boolean;
  display_order: number;
}

export interface MasterCategory {
  id: string;
  name: string;
  icon_name: string;
  display_order: number;
  tasks: MasterTask[];
}
