export interface Chore {
  id: number;
  created_at: string;
  note: string | null;
  score: number | null;
  multiplier: number | null;
  category: string | null;
  task: string | null;
  assignee: string | null;
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
