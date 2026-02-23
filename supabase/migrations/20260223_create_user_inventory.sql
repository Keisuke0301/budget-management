-- ユーザーの報酬在庫を管理するテーブル
CREATE TABLE chore_user_inventory (
    id SERIAL PRIMARY KEY,
    assignee TEXT NOT NULL,
    prize_id INTEGER REFERENCES chore_gachaprizes(id),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE chore_user_inventory IS 'ユーザーが獲得した報酬の在庫管理テーブル';
