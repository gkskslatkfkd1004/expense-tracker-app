# 개인 지출 관리 시스템 - PRD (Product Requirements Document)

## 1. 개요

### 1.1 프로젝트명
**Expense Tracker** - 개인 지출 내역 관리 홈페이지

### 1.2 목적
개인의 영수증, 은행 거래내역서(PDF)를 업로드하여 수입과 지출을 자동 분석하고,
월별/카테고리별 통계를 시각화하여 재무 상태를 한눈에 파악할 수 있는 웹 애플리케이션.

### 1.3 대상 사용자
- 본인 전용 (단일 사용자, 간단한 인증)

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 15 (App Router) + TypeScript |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 백엔드/API | Next.js API Routes (Route Handlers) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 파일 저장소 | Supabase Storage (영수증 이미지, PDF) |
| 인증 | Supabase Auth (간단한 이메일/비밀번호) |
| OCR | Tesseract.js (클라이언트) 또는 Google Cloud Vision API |
| PDF 파싱 | pdf-parse 또는 pdf.js |
| 차트 | Recharts 또는 Chart.js |
| 배포 | Vercel |

---

## 3. 핵심 기능

### 3.1 영수증 사진 업로드 및 OCR
- 영수증 사진 업로드 (JPEG, PNG, HEIC)
- OCR로 자동 추출: 날짜, 가맹점명, 금액, 항목
- 추출 결과 사용자 확인/수정 후 저장
- 원본 이미지 Supabase Storage에 보관

### 3.2 은행 거래내역서 PDF 업로드 및 분석
- 은행 거래내역서 PDF 파일 업로드
- PDF 파싱으로 거래 내역 자동 추출 (날짜, 내역, 입금, 출금, 잔액)
- 수입/지출 자동 분류
- 거래 내역 리스트 확인 및 카테고리 수동 지정/수정

### 3.3 수동 지출 입력
- 직접 지출/수입 내역 입력
- 필드: 날짜, 금액, 카테고리, 메모, 결제수단
- 반복 지출 등록 (월세, 구독료 등)

### 3.4 카테고리 관리
- 기본 카테고리: 식비, 교통, 주거, 통신, 의료, 쇼핑, 여가, 교육, 기타
- 커스텀 카테고리 추가/수정/삭제
- 가맹점별 자동 카테고리 매핑 규칙

### 3.5 월별/카테고리별 통계 대시보드
- 월별 수입/지출 추이 라인 차트
- 카테고리별 지출 비율 파이/도넛 차트
- 일별 지출 히트맵 또는 바 차트
- 전월 대비 증감률
- 상위 지출 카테고리 TOP 5

### 3.6 예산 관리 (선택적 확장)
- 월별 총 예산 설정
- 카테고리별 예산 설정
- 예산 대비 사용률 시각화

---

## 4. 페이지 구조

```
/ (대시보드)
├── /transactions (거래 내역 목록)
│   ├── /transactions/new (수동 입력)
│   └── /transactions/[id] (상세/수정)
├── /upload (업로드)
│   ├── /upload/receipt (영수증 업로드)
│   └── /upload/statement (거래내역서 PDF 업로드)
├── /statistics (통계)
│   ├── /statistics/monthly (월별 통계)
│   └── /statistics/category (카테고리별 통계)
├── /categories (카테고리 관리)
├── /settings (설정)
└── /login (로그인)
```

---

## 5. 데이터 모델

### 5.1 transactions (거래 내역)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| date | DATE | 거래 날짜 |
| amount | DECIMAL | 금액 (양수: 수입, 음수: 지출) |
| type | ENUM | 'income' \| 'expense' |
| category_id | UUID | FK → categories |
| description | TEXT | 내역/메모 |
| merchant | TEXT | 가맹점명 |
| payment_method | TEXT | 결제수단 |
| source | ENUM | 'manual' \| 'ocr' \| 'pdf' |
| receipt_url | TEXT | 영수증 이미지 URL (nullable) |
| created_at | TIMESTAMPTZ | 생성일시 |
| updated_at | TIMESTAMPTZ | 수정일시 |

### 5.2 categories (카테고리)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| name | TEXT | 카테고리명 |
| icon | TEXT | 아이콘 (emoji 또는 아이콘명) |
| color | TEXT | 표시 색상 |
| is_default | BOOLEAN | 기본 카테고리 여부 |
| created_at | TIMESTAMPTZ | 생성일시 |

### 5.3 budgets (예산)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| year_month | TEXT | '2026-03' 형식 |
| category_id | UUID | FK → categories (null이면 전체 예산) |
| amount | DECIMAL | 예산 금액 |
| created_at | TIMESTAMPTZ | 생성일시 |

### 5.4 merchant_rules (가맹점 자동 분류 규칙)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| keyword | TEXT | 가맹점명 키워드 |
| category_id | UUID | FK → categories |

---

## 6. 비기능 요구사항

- **반응형 디자인**: 모바일에서도 영수증 촬영/업로드 편리
- **다크 모드**: 지원
- **한국어 UI**: 기본 언어
- **데이터 보안**: Supabase RLS로 본인 데이터만 접근
- **성능**: 대시보드 로딩 2초 이내

---

## 7. 개발 단계 (MVP → 확장)

### Phase 1: MVP (핵심)
1. 프로젝트 세팅 (Next.js + Supabase)
2. 인증 (로그인/로그아웃)
3. 수동 지출 입력/수정/삭제 (CRUD)
4. 카테고리 관리
5. 거래 내역 목록/필터
6. 기본 대시보드 (월별 합계, 카테고리 비율)

### Phase 2: 자동화
7. 영수증 사진 OCR
8. 은행 거래내역서 PDF 파싱
9. 가맹점 자동 카테고리 매핑

### Phase 3: 고도화
10. 예산 관리
11. 통계 고도화 (추이, 비교)
12. 데이터 내보내기 (CSV/Excel)
13. PWA (모바일 앱처럼 설치)
