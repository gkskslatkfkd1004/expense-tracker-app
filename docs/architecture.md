# 시스템 아키텍처

## 1. 전체 구조

```
┌─────────────────────────────────────────────┐
│                  Client                      │
│  Next.js App (React + TypeScript)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ 대시보드  │ │ 거래내역  │ │  업로드   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  통계    │ │ 카테고리  │ │  설정    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           Next.js API Routes                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ /api/     │ │ /api/     │ │ /api/     │   │
│  │transactions│ │upload    │ │statistics │   │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
┌───────────┐ ┌────────┐ ┌────────┐
│ Supabase  │ │Supabase│ │ OCR /  │
│ PostgreSQL│ │Storage │ │ PDF    │
│ (DB)      │ │(Files) │ │Parser  │
└───────────┘ └────────┘ └────────┘
```

## 2. 디렉토리 구조

```
expense-tracker/
├── docs/                      # 프로젝트 문서
├── public/                    # 정적 파일
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   │   └── login/
│   │   ├── (main)/            # 인증 후 메인 레이아웃
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── upload/
│   │   │   ├── statistics/
│   │   │   ├── categories/
│   │   │   └── settings/
│   │   ├── api/               # API Route Handlers
│   │   │   ├── transactions/
│   │   │   ├── upload/
│   │   │   ├── categories/
│   │   │   └── statistics/
│   │   ├── layout.tsx
│   │   └── page.tsx           # → 대시보드로 리다이렉트
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── layout/            # Header, Sidebar, Navigation
│   │   ├── dashboard/         # 대시보드 위젯
│   │   ├── transactions/      # 거래 관련 컴포넌트
│   │   ├── upload/            # 업로드 관련 컴포넌트
│   │   └── statistics/        # 차트/통계 컴포넌트
│   ├── lib/
│   │   ├── supabase/          # Supabase 클라이언트 설정
│   │   │   ├── client.ts      # 브라우저 클라이언트
│   │   │   ├── server.ts      # 서버 클라이언트
│   │   │   └── middleware.ts  # 인증 미들웨어
│   │   ├── ocr/               # OCR 처리 로직
│   │   ├── pdf/               # PDF 파싱 로직
│   │   └── utils/             # 유틸리티 함수
│   ├── hooks/                 # 커스텀 React 훅
│   ├── types/                 # TypeScript 타입 정의
│   └── constants/             # 상수 정의
├── supabase/
│   ├── migrations/            # DB 마이그레이션
│   └── seed.sql               # 초기 데이터 (기본 카테고리)
├── .env.local                 # 환경변수 (Supabase 키 등)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 3. 주요 데이터 흐름

### 3.1 영수증 OCR 흐름
```
사진 선택 → 미리보기 → OCR 처리 → 결과 표시
→ 사용자 확인/수정 → 저장 (DB + Storage)
```

### 3.2 PDF 거래내역서 흐름
```
PDF 업로드 → 파싱 → 거래 목록 추출 → 결과 테이블 표시
→ 카테고리 자동 매핑 → 사용자 확인/수정 → 일괄 저장
```

### 3.3 통계 조회 흐름
```
기간/카테고리 필터 선택 → API 호출 → DB 집계 쿼리
→ 차트 데이터 변환 → 시각화 렌더링
```

## 4. 인증 구조

```
미들웨어에서 세션 확인
├── 세션 있음 → 요청 계속
└── 세션 없음
    ├── API 요청 → 401 응답
    └── 페이지 요청 → /login 리다이렉트
```

- Supabase Auth 사용 (이메일/비밀번호)
- 단일 사용자이므로 가입 기능은 비활성화 (직접 Supabase에서 계정 생성)
- 미들웨어에서 인증 체크

## 5. 보안 고려사항

- **RLS (Row Level Security)**: 모든 테이블에 적용, 인증된 사용자만 접근
- **파일 업로드 검증**: 이미지/PDF만 허용, 파일 크기 제한 (10MB)
- **환경변수**: API 키는 `.env.local`에만 저장, 절대 커밋 금지
- **입력 검증**: Zod 스키마로 모든 API 입력 유효성 검사
