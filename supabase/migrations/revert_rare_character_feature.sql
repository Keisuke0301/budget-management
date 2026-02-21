-- 1. レアキャラのデータを tasks テーブルから削除
DELETE FROM chore_tasks WHERE id IN ('rare-degu', 'rare-fish');

-- 2. 「ボーナス」カテゴリを categories テーブルから削除
DELETE FROM chore_categories WHERE id = 'bonus';

-- 3. tasks テーブルから is_rare カラムを削除
ALTER TABLE chore_tasks DROP COLUMN IF EXISTS is_rare;
