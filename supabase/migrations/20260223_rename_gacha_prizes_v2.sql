ALTER TABLE chore_gachaprizes RENAME TO chore_records_gachaprizes;
ALTER TABLE chore_records_gachaprizes RENAME CONSTRAINT chore_gachaprizes_pkey TO chore_records_gachaprizes_pkey;
COMMENT ON TABLE chore_records_gachaprizes IS 'ガチャの景品マスターテーブル';
