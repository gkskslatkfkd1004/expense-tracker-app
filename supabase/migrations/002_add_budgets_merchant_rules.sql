-- =============================================
-- Migration 002: budgets + merchant_rules 테이블 추가
-- 기존 RLS 정책 → 인증된 사용자만 접근하도록 강화
-- =============================================

-- 기존 RLS 정책 교체 (USING(true) → authenticated role만)
DROP POLICY IF EXISTS "Allow all access to categories" ON categories;
DROP POLICY IF EXISTS "Allow all access to transactions" ON transactions;

CREATE POLICY "Allow authenticated access to categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated access to transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Budgets table
-- 월별 전체 예산 및 카테고리별 예산 관리
-- category_id = NULL 이면 해당 월 전체 예산
-- =============================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, month, category_id)
);

CREATE INDEX idx_budgets_year_month ON budgets(year, month);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Merchant rules table
-- 가맹점명 패턴 → 카테고리 자동 매핑 규칙
-- =============================================
CREATE TABLE merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_merchant_rules_priority ON merchant_rules(priority DESC);

ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated access to merchant_rules"
  ON merchant_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
