ALTER TABLE gacha_prizes RENAME TO chore_gachaprizes;
ALTER TABLE chore_gachaprizes RENAME CONSTRAINT gacha_prizes_pkey TO chore_gachaprizes_pkey;
COMMENT ON TABLE chore_gachaprizes IS 'ガチャの景品マスターテーブル';
