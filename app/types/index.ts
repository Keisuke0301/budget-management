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
