-- 1. ガチャ景品マスタテーブルの名称整理
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chore_records_gachaprizes') THEN
        ALTER TABLE chore_records_gachaprizes RENAME TO chore_gacha_prizes;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chore_gachaprizes') THEN
        ALTER TABLE chore_gachaprizes RENAME TO chore_gacha_prizes;
    ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gacha_prizes') THEN
        ALTER TABLE gacha_prizes RENAME TO chore_gacha_prizes;
    END IF;
END $$;

COMMENT ON TABLE chore_gacha_prizes IS 'ガチャの景品マスターテーブル';

-- 2. 在庫管理テーブルの名称整理
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chore_user_inventory') THEN
        ALTER TABLE chore_user_inventory RENAME TO chore_records_prizes;
    END IF;
END $$;

COMMENT ON TABLE chore_records_prizes IS 'ユーザーが獲得した報酬の在庫管理テーブル';
