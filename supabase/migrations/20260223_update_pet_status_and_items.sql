-- pet_info に status カラムを追加（デフォルトは 'alive'）
ALTER TABLE pet_info ADD COLUMN status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'memorial'));

-- pet_items に「お迎え」「誕生日」を追加し、表示順を整理
INSERT INTO pet_items (label, unit, display_order) VALUES
('お迎え', '', 0),
('誕生日', '', 0);

-- 既存の項目の表示順を調整（お迎えを一番上に、次に体重など）
UPDATE pet_items SET display_order = 1 WHERE label = 'お迎え';
UPDATE pet_items SET display_order = 2 WHERE label = '誕生日';
UPDATE pet_items SET display_order = 3 WHERE label = '体重';
UPDATE pet_items SET display_order = 4 WHERE label = '体長';
UPDATE pet_items SET display_order = 5 WHERE label = '水温';
UPDATE pet_items SET display_order = 6 WHERE label = '気温';
UPDATE pet_items SET display_order = 7 WHERE label = '日記';
UPDATE pet_items SET display_order = 8 WHERE label = 'お別れ';
UPDATE pet_items SET display_order = 9 WHERE label = 'その他';

COMMENT ON COLUMN pet_info.status IS '生存中(alive)か亡くなった(memorial)かのステータス';
