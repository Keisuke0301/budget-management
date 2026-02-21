-- 1. 「ボーナス」カテゴリを categories テーブルに追加
INSERT INTO chore_categories (id, name, icon_name, display_order)
VALUES ('bonus', 'ボーナス', 'Gift', 99)
ON CONFLICT (id) DO NOTHING;

-- 2. tasks テーブルに is_rare カラムを追加
ALTER TABLE chore_tasks
ADD COLUMN is_rare BOOLEAN DEFAULT FALSE;

-- 3. レアキャラのデータを tasks テーブルに挿入
INSERT INTO chore_tasks (id, category_id, name, score, icon, is_repeatable, is_bubble, is_rare, display_order)
VALUES
('rare-degu', 'bonus', 'デグーの乱入', 5, '🐭', FALSE, FALSE, TRUE, 1),
('rare-fish', 'bonus', 'お魚の癒やし', 3, '🐟', FALSE, FALSE, TRUE, 2)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  score = EXCLUDED.score,
  icon = EXCLUDED.icon,
  is_rare = EXCLUDED.is_rare,
  is_bubble = EXCLUDED.is_bubble;
