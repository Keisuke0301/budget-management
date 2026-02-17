export interface Chore {
  id: number;
  created_at: string;
  chore_name: string;
  note: string | null;
  score: number | null;
  multiplier: number | null;
  multiplier_message: string | null;
  category: string | null;
  task: string | null;
  assignee: string | null;
}
