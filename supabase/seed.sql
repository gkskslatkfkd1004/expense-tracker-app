-- 기본 카테고리 15개 (src/constants/categories.ts와 동일)
INSERT INTO categories (id, name, emoji, color, sort_order) VALUES
  ('food',         '식료품',      '🛒', '#e6a532', 1),
  ('eating-out',   '외식/카페',    '☕', '#e68a32', 2),
  ('transport',    '교통/주차',    '🚗', '#4a8fe6', 3),
  ('health',       '건강/의료',    '💊', '#4ac98a', 4),
  ('fitness',      '운동',        '💪', '#4ac98a', 5),
  ('shopping',     '쇼핑',        '🛍️', '#d94ea6', 6),
  ('subscription', '구독/디지털',   '📱', '#8a6ae6', 7),
  ('telecom',      '통신',        '📞', '#5a7ae6', 8),
  ('invest',       '투자',        '📈', '#b8c932', 9),
  ('donate',       '헌금/기부',    '⛪', '#e67a4a', 10),
  ('salary',       '급여',        '💵', '#32c978', 11),
  ('allowance',    '용돈',        '💰', '#32c978', 12),
  ('parttime',     '아르바이트',   '🏪', '#32c978', 13),
  ('refund',       '환불',        '↩️', '#6a9ae6', 14),
  ('other',        '기타',        '📦', '#8a8a8a', 15)
ON CONFLICT (id) DO NOTHING;
