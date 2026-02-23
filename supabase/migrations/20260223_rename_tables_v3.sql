-- テーブル名の変更
ALTER TABLE chore_records_gachaprizes RENAME TO chore_gacha_prizes;
ALTER TABLE chore_records_gachaprizes RENAME CONSTRAINT chore_records_gachaprizes_pkey TO chore_gacha_prizes_pkey;
COMMENT ON TABLE chore_gacha_prizes IS 'ガチャの景品マスターテーブル';

ALTER TABLE chore_user_inventory RENAME TO chore_records_prizes;
ALTER TABLE chore_user_inventory RENAME CONSTRAINT chore_user_inventory_pkey TO chore_records_prizes_pkey;
COMMENT ON TABLE chore_records_prizes IS 'ユーザーが獲得した報酬の在庫管理テーブル';
