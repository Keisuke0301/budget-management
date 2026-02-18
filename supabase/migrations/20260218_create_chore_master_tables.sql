-- 家事カテゴリマスターテーブルの作成
CREATE TABLE IF NOT EXISTS chore_master_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL, -- Lucideアイコン名
  display_order INTEGER DEFAULT 0
);

-- 家事タスクマスターテーブルの作成
CREATE TABLE IF NOT EXISTS chore_master_tasks (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES chore_master_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  icon TEXT, -- 絵文字アイコン
  is_repeatable BOOLEAN DEFAULT FALSE,
  is_bubble BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0
);

-- データの挿入
INSERT INTO chore_master_categories (id, name, icon_name, display_order) VALUES
('meal', '食事', 'Utensils', 1),
('cleaning', '掃除', 'Sparkles', 2),
('laundry', '洗濯', 'Shirt', 3),
('pet', 'ペット', 'Fish', 4),
('other', 'その他', 'MoreHorizontal', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon_name = EXCLUDED.icon_name, display_order = EXCLUDED.display_order;

INSERT INTO chore_master_tasks (id, category_id, name, score, icon, is_repeatable, is_bubble, display_order) VALUES
-- 食事
('meal-1', 'meal', '料理(昼)', 3, '🍳', FALSE, TRUE, 1),
('meal-2', 'meal', '料理(夜)', 4, '🧑‍🍳', FALSE, TRUE, 2),
('meal-3', 'meal', '料理(弁当)', 6, '🍱', FALSE, FALSE, 3),
('meal-5', 'meal', '食器洗い', 6, '🧼', TRUE, TRUE, 4),
('meal-6', 'meal', '食器片付け', 2, '🍽️', TRUE, TRUE, 5),
-- 掃除
('clean-1', 'cleaning', '部屋', 8, '🧹', FALSE, FALSE, 1),
('clean-2', 'cleaning', '風呂', 6, '🛁', FALSE, FALSE, 2),
('clean-3', 'cleaning', 'トイレ', 7, '🚽', FALSE, FALSE, 3),
('clean-4', 'cleaning', '洗車', 9, '🚗', FALSE, FALSE, 4),
-- 洗濯
('laundry-1', 'laundry', '洗濯', 2, '🌀', TRUE, TRUE, 1),
('laundry-2', 'laundry', '干し', 8, '👕', TRUE, TRUE, 2),
('laundry-3', 'laundry', '取込・畳み', 6, '🐔', TRUE, TRUE, 3),
-- ペット
('pet-1', 'pet', 'デグえさ(朝)', 1, '🐹', FALSE, TRUE, 1),
('pet-2', 'pet', 'デグえさ(夜)', 1, '🐭', FALSE, TRUE, 2),
('pet-3', 'pet', 'デグ掃除', 7, '🧹', FALSE, FALSE, 3),
('pet-4', 'pet', '魚えさ', 1, '🐟', TRUE, TRUE, 4),
('pet-5', 'pet', '魚掃除', 10, '🧼', FALSE, FALSE, 5),
-- その他
('other-1', 'other', 'ごみまとめ', 2, '📦', FALSE, FALSE, 1),
('other-2', 'other', 'ごみ捨て', 3, '🗑️', FALSE, FALSE, 2),
('other-3', 'other', 'ごみ捨て(資源)', 10, '♻️', FALSE, FALSE, 3),
('other-4', 'other', '散髪', 10, '✂️', FALSE, FALSE, 4)
ON CONFLICT (id) DO UPDATE SET 
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  score = EXCLUDED.score,
  icon = EXCLUDED.icon,
  is_repeatable = EXCLUDED.is_repeatable,
  is_bubble = EXCLUDED.is_bubble,
  display_order = EXCLUDED.display_order;
