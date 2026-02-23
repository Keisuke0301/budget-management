-- pet_items テーブルに show_numeric, show_memo カラムを追加
ALTER TABLE pet_items ADD COLUMN show_numeric BOOLEAN DEFAULT TRUE;
ALTER TABLE pet_items ADD COLUMN show_memo BOOLEAN DEFAULT TRUE;

-- 「その他」項目を削除
DELETE FROM pet_items WHERE label = 'その他';

-- 各項目の表示設定を更新
UPDATE pet_items SET show_numeric = TRUE, show_memo = FALSE WHERE label IN ('体重', '体長', '水温', '気温');
UPDATE pet_items SET show_numeric = FALSE, show_memo = TRUE WHERE label IN ('日記', 'お迎え', '誕生日');
UPDATE pet_items SET show_numeric = FALSE, show_memo = TRUE WHERE label = 'お別れ';

COMMENT ON COLUMN pet_items.show_numeric IS '数値入力欄を表示するかどうか';
COMMENT ON COLUMN pet_items.show_memo IS 'メモ入力欄を表示するかどうか';
