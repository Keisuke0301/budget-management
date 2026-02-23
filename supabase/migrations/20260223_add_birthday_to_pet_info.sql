-- pet_info テーブルに誕生日を追加
ALTER TABLE pet_info ADD COLUMN birthday DATE;

COMMENT ON COLUMN pet_info.birthday IS '誕生日';
