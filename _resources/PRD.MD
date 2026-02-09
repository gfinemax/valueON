# [PRD] Value On (밸류온): 대방동 지역주택조합 수지분석 시뮬레이터

## 1. 프로젝트 개요
- **프로젝트명:** Value On (밸류온)
- **목적:** 대방동 지역주택조합 사업의 토지비, 건축비, 기타 사업비를 입력하여 실시간으로 '평당 분담금'과 '총 사업비'를 시뮬레이션하는 모바일 웹 앱.
- **핵심 기능:** 엑셀(CSV) 기반의 초기 데이터를 로드하고, 사용자가 변수(지출 비용)를 수정하면 즉시 분담금 변화를 시각적으로 보여줌.
- **타겟 디바이스:** 모바일 (Mobile First, 375px ~ 430px 기준)

## 2. 기술 스택
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Card, Slider, Input, Label, Button, Accordion, Badge)
- **Charts:** Recharts (Pie/Donut Chart)
- **Icons:** Lucide React (Power icon for Logo)

## 3. 데이터 구조 (Data Interfaces)

### 3.1 AnalysisInputs (입력 변수)
*참고: 초기값(Default)은 별도로 제공된 CSV 파일의 데이터를 우선적으로 반영한다.*

```typescript
interface AnalysisInputs {
  // 1. 기본 사업 개요 (Project Basics)
  projectTarget: {
    totalLandArea: number;   // 전체 사업부지 면적 (평)
    totalFloorArea: number;  // 연면적 (평)
    totalHouseholds: number; // 전체 세대수 (세대)
  };

  // 2. 추가 비용 항목 (User Custom Inputs - Fixed Amount)
  // 엑셀에 없는 항목은 아래 기본값을 사용한다.
  addedCosts: {
    operationFeePerUnit: number; // 세대당 업무추진비 (원) - Default Suggestion: 25,000,000
    pmServiceFeeTotal: number;   // PM 용역비 총액 (원) - Default Suggestion: 10,000,000,000
    sunkCost: number;            // 기 투입 매몰비용 (원) - Default Suggestion: 5,000,000,000
    contingencyRate: number;     // 예비비 비율 (%) - Default: 1.0
  };

  // 3. 주요 변동 비용 (Simulation Variables - Unit Price)
  variableCosts: {
    landPricePerPyung: number;   // 토지 평당 매입가 (원)
    constCostPerPyung: number;   // 평당 건축비 (원)
    interestRateBridge: number;  // 브릿지론 금리 (%) - Default: 6.5
    interestRatePF: number;      // PF 금리 (%) - Default: 8.0
  }
}


### 3.2 AnalysisResult (결과 출력)

interface AnalysisResult {
  totalProjectCost: number;      // 총 사업비 합계 (원)
  costPerPyung: number;          // 평당 원가 (원)
  
  // 타입별 예상 분담금
  estimatedPrices: {
    type59: number;  // 59타입 (25평 기준)
    type84: number;  // 84타입 (34평 기준)
  };
  
  // 차트 시각화용 데이터
  costBreakdown: {
    name: string;    // 항목명 (토지비, 건축비, 기타)
    value: number;   // 금액
    fill: string;    // 차트 색상 (Hex Code)
  }[];
}


4. 비즈니스 로직 (Calculation Logic)
입력값이 변경될 때마다 useMemo 등을 사용하여 아래 로직으로 실시간 역산한다.

토지비 총액 = 부지면적 * 토지평당가

건축비 총액 = 연면적 * 평당건축비

업무추진비 총액 = 세대수 * 세대당 업무추진비

금융비용 (단순화 모델)

브릿지 이자 = 토지비 총액 * (브릿지 금리%) (1년 기준)

PF 이자 = 건축비 총액 * (PF 금리%) (1년 기준)

예비비 = (토지비 + 건축비) * 예비비율(%)

총 사업비 = 토지비 + 건축비 + 업무추진비 + PM비 + 매몰비용 + 금융비용 + 예비비

평당 원가 = 총 사업비 / 연면적

5. UI/UX 가이드라인
5.1 디자인 테마 (Brand: Value On)
Main Color (Navy): #1a365d (Header, Buttons)

Accent Color (Green): #48bb78 (Key Numbers, Charts)

Background: Clean White/Grey (bg-slate-50)

5.2 화면 구성 (Web-Optimized Dashboard)

**Layout Structure:**
- **Sidebar (Left):**
  - 로고: 'Value On' (Power Icon)
  - 내비게이션: 대시보드 (Home), 원시 데이터 (Data), 설정 (Settings)
  - 버전 정보 표시

**Settings (Settings):**
- **Feature Settings:**
  - 항목 이동 허용: 드래그 앤 드롭 활성화 여부.
  - 카테고리/항목 추가 허용: 구조 편집 권한 제어.
  - 항목 삭제 허용: 데이터 삭제 방지 및 안정성 확보.

**Dashboard (Main):**
- **Grid System:** 반응형 그리드 적용 (Desktop: 12 Columns)
  - **Left Column (Main Input):** 유닛 믹스, 상세 비용 카테고리 등 입력 폼 배치.
  - **Right Column (Summary):** 'Summary Dashboard'를 Sticky로 배치하여 스크롤 시에도 항상 결과 확인 가능.

**Header (Top):**
- 심플한 구성: 현재 상태(평당 예상 분담금) 및 '초기화' 버튼만 배치하여 작업 집중도 향상.

**Input Interface:**
- **Advanced Mode:** 세부 항목(Cost Category)별 관리 기능 강화.
  - 설정을 통한 카테고리/항목/세부항목의 추가 및 삭제 권한 일괄 제어.
  - 카테고리 순서 드래그 앤 드롭 이동 지원.
  - 각 항목별 계산 기준(전체/평당/세대당) 설정 가능.
- **Unit Mix:** 평형별 공급면적, 세대수, 조합원 분담금/일반분양가 설정.