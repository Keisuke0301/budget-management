-- pet_info テーブルに価格と数量を追加
ALTER TABLE pet_info ADD COLUMN price INTEGER;
ALTER TABLE pet_info ADD COLUMN quantity INTEGER DEFAULT 1;

-- 名前を任意（NULL許可）に変更
ALTER TABLE pet_info ALTER COLUMN name DROP NOT NULL;

COMMENT ON COLUMN pet_info.price IS '購入価格';
COMMENT ON COLUMN pet_info.quantity IS '数量（匹数など）';
