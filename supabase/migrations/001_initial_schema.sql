-- =============================================
-- Expense Tracker: Initial Schema
-- =============================================

-- Categories table
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  color TEXT NOT NULL DEFAULT '#8a8a8a',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  merchant TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE SET DEFAULT DEFAULT 'other',
  payment_method TEXT NOT NULL DEFAULT 'card' CHECK (payment_method IN ('card', 'cash', 'transfer', 'auto')),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ocr', 'pdf')),
  is_internal_transfer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date_type ON transactions(date, type);

-- =============================================
-- Row Level Security (RLS)
-- 개인 프로젝트이므로 anon key로 전체 접근 허용
-- 향후 Auth 추가 시 user_id 컬럼 추가 및 정책 변경
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 모든 인증된/비인증 사용자에게 전체 접근 허용 (개인 프로젝트)
CREATE POLICY "Allow all access to categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to transactions"
  ON transactions FOR ALL
  USING (true)
  WITH CHECK (true);
