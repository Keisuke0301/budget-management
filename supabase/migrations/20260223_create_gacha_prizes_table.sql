CREATE TABLE gacha_prizes (
    id SERIAL PRIMARY KEY,
    rarity TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    probability DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE gacha_prizes IS 'ガチャの景品マスターテーブル';
COMMENT ON COLUMN gacha_prizes.id IS 'プライマリーキー';
COMMENT ON COLUMN gacha_prizes.rarity IS 'レアリティ (N, R, SR, UR)';
COMMENT ON COLUMN gacha_prizes.name IS '景品名';
COMMENT ON COLUMN gacha_prizes.description IS '景品の説明';
COMMENT ON COLUMN gacha_prizes.probability IS '排出確率';
COMMENT ON COLUMN gacha_prizes.created_at IS '作成日時';

-- 初期データ
INSERT INTO gacha_prizes (rarity, name, description, probability) VALUES
('N', 'マッサージ券', '愛情込めて肩もみします', 0.25),
('R', '金券(300円)', 'コンビニで好きなもの買ってOK', 0.25),
('SR', '金券(500円)', 'スタバでフラペチーノも買える', 0.25),
('UR', '金券(1000円)', 'ちょっと豪華なランチに行ける', 0.25);
