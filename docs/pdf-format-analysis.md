# PDF 형식 분석: Commonwealth Bank Transaction Summary

## 1. 기본 정보

| 항목 | 값 |
|------|-----|
| 은행 | Commonwealth Bank (호주) |
| 문서 타입 | Transaction Summary (거래 내역서) |
| PDF 버전 | 1.7 |
| 페이지 크기 | A4 (595 x 842 pts) |
| 총 페이지 | 8페이지 |
| 생성 도구 | OpenText Exstream Version 24.1.1 |
| 통화 | AUD (호주 달러) |

## 2. 문서 구조

### 헤더 (모든 페이지 반복)
```
Account Number: 062130 11732951
Page: X of 8
```

### 1페이지 상단 - 계좌 정보
```
Account name:    JONGKON LIM
BSB:             062130
Account number:  11732951
Account type:    Smart Access
Date opened:     02/04/2023
```

### 거래 내역 테이블 컬럼
```
Date | Transaction details | Amount | Balance
```

### 푸터 (모든 페이지 반복)
```
Created 14/03/26 07:25am (Sydney/Melbourne time)
While this letter is accurate at the time it's produced,
we're not responsible for any reliance on this information.
Transaction Summary v1.0.5
```

## 3. 거래 내역 패턴

### 날짜 형식
- `DD MMM YYYY` (예: `06 Jan 2026`, `13 Mar 2026`)

### 금액 형식
- 양수 (수입): `$200.00`, `$3,195.31`
- 음수 (지출): `-$4.49`, `-$25.95`
- 천 단위 콤마 사용: `$10,000.00`

### 거래 유형별 패턴

#### 1) 카드 결제
```
DD MMM YYYY 가맹점명 지역 국가코드
Card xxNNNN
Value Date: DD/MM/YYYY
```
예시:
```
06 Jan 2026 APPLE.COM/BILL SYDNEY NS AUS
Card xx7496
Value Date: 03/01/2026
```

#### 2) 계좌 이체 (보내기)
```
DD MMM YYYY Transfer to xxNNNN CommBank app
```
또는:
```
DD MMM YYYY Transfer To 수신인명
CommBank App A. ___
메모
```

#### 3) 계좌 이체 (받기)
```
DD MMM YYYY Transfer from 송신인명 NetBank
메모
```
또는:
```
DD MMM YYYY Transfer from xxNNNN CommBank app
```

#### 4) 빠른 이체 (Fast Transfer)
```
DD MMM YYYY Fast Transfer From 송신인명
to PayID Phone
CREDIT TO ACCOUNT
```

#### 5) 자동이체 (Direct Debit / Direct Credit)
```
DD MMM YYYY Direct Debit NNNNNN 기관명
메모
```
```
DD MMM YYYY Direct Credit NNNNNN 기관명
메모
```

#### 6) PayTo (자동 결제)
```
DD MMM YYYY PayTo 서비스명
참조번호
추가참조
```

#### 7) 분쟁 조정 (Dispute/Adjustment)
```
DD MMM YYYY Dispute Adjustment
Value Date: DD/MM/YYYY
```
```
DD MMM YYYY Adjust Purchase ADJUSTMENT TO ACCOUNT
Card xxNNNN AUD 금액
Value Date: DD/MM/YYYY
```

## 4. 파싱 규칙 (구현용)

### 거래 한 건 식별 방법
1. 줄이 `DD MMM YYYY`로 시작하면 → 새 거래 시작
2. 같은 거래의 추가 정보는 다음 줄에 이어짐 (Card, Value Date, 메모 등)
3. 금액은 `$`로 시작하는 숫자 (마지막 2개: Amount, Balance)

### 수입/지출 구분
- `-$`로 시작 → 지출 (expense)
- `$`로 시작 (마이너스 없음) → 수입 (income)

### 자동 카테고리 매핑 후보
| 키워드 | 카테고리 |
|--------|---------|
| APPLE.COM/BILL | 구독/디지털 |
| Anytime Fitness | 운동/헬스 |
| AMAYSIM | 통신 |
| Google One | 구독/디지털 |
| Woolworths | 식료품 |
| Amazon | 쇼핑 |
| PARKING, Paystay | 교통/주차 |
| LIFELINE, RED CROSS | 기부 |
| BAKERY, CAFE, ELJANNAH | 식비/외식 |
| On The Run OTR | 식비/편의점 |
| VIRTUS DIAGNOSTICS | 의료 |
| Webull Securities | 투자 |
| COMMSEC | 투자 |
| sydney new life church | 헌금/기부 |
| Nium | 급여/수입 |
| Transfer from VERONICA XIAO | 용돈/정기 수입 |
| Transfer from MR YOUNGGYUN KIM | 급여 |

### 무시/제외 대상 거래
- 같은 계좌 간 이체 (Transfer to/from xxNNNN CommBank app) → 단순 계좌 간 이동
- 대규모 금액 이체 후 즉시 출금 (투자 목적) → 투자로 분류

## 5. 주의사항

- 한 거래가 여러 줄에 걸침 (최대 3-4줄)
- 페이지 경계에서 거래가 잘릴 수 있음
- 푸터/헤더가 거래 데이터 사이에 섞여 있음 → 필터링 필요
- Value Date와 게시 날짜(Date)가 다를 수 있음
- Dispute Adjustment는 이전 거래의 환불/취소이므로 별도 처리 필요
