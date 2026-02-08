export interface ProjectTarget {
  totalLandArea: number;   // 전체 사업부지 면적 (평)
  totalFloorArea: number;  // 연면적 (평)
  totalHouseholds: number; // 전체 세대수 (세대)
}

export interface AnalysisInputs {
  projectTarget: ProjectTarget;
  addedCosts: {
    operationFeePerUnit: number; // 세대당 업무추진비 (원)
    pmServiceFeeTotal: number;   // PM 용역비 총액 (원)
    sunkCost: number;            // 기 투입 매몰비용 (원)
    contingencyRate: number;     // 예비비 비율 (%)
  };
  variableCosts: {
    landPricePerPyung: number;   // 토지 평당 매입가 (원)
    constCostPerPyung: number;   // 평당 건축비 (원)
    interestRateBridge: number;  // 브릿지론 금리 (%)
    interestRatePF: number;      // PF 금리 (%)
  };
  // Advanced Mode Data
  isAdvancedMode: boolean;
  advancedCategories: CostCategory[];

  // Unit Mix Data
  unitTypes: UnitType[];
  unitAllocations: UnitAllocation[];

  // 1차 조합원 초기 분양가 (Initial payment)
  initialPayment: number;
}

export interface UnitType {
  id: string;
  name: string;
  supplyArea: number; // in pyung
  exclusiveAreaM2?: number; // 전용면적 in m²
  category?: 'APARTMENT' | 'RETAIL' | 'RENTAL';
  totalUnits?: number; // 해당 평형의 총 세대수 (연동 계산용)
}

export type MemberTier = '1st' | '2nd' | 'General';

export interface UnitAllocation {
  id: string;
  unitTypeId: string;
  tier: MemberTier;
  count: number;
  // For General: Fixed target price per pyung
  targetPricePerPyung?: number;
  // For 2nd Member: Premium amount vs 1st Member
  premium?: number;
  // For 1st Member: Fixed total price (고정 분양가)
  fixedTotalPrice?: number;

  // Memo/Note for specific details
  note?: string;
}

export interface SubItem {
  id: string;
  name: string;
  amount: number;
  note?: string; // Memo for sub-item
}

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  note?: string;
  // Smart Cost Logic
  // per_pyung is deprecated in logic but kept for migration
  calculationBasis?: 'fixed' | 'per_unit' | 'per_site_pyung' | 'per_floor_pyung' | 'mix_linked';
  // For mix_linked: maps allocationId -> amount (won/unit)
  mixConditions?: Record<string, number>;
  // NEW: Application Rate (%) - Default 100
  applicationRate?: number;
  // NEW: Sub-Items for detailed breakdown
  subItems?: SubItem[];
}

export interface CostCategory {
  id: string; // e.g., 'land', 'construction'
  title: string;
  items: CostItem[];
  note?: string; // Memo for category
}

export interface AnalysisResult {
  totalProjectCost: number;      // 총 사업비 합계 (원)
  costPerPyung: number;          // 평당 원가 (원)

  // 타입별 예상 분담금 (Simple Mode Legacy)
  estimatedPrices: {
    type59: number;  // 59타입 (25평 기준)
    type84: number;  // 84타입 (34평 기준)
  };

  // 차트 시각화용 데이터
  costBreakdown: {
    name: string;    // 항목명
    value: number;   // 금액
    fill: string;    // 차트 색상
  }[];

  // Detailed Unit Mix Pricing Results
  unitPricing?: {
    allocationId: string;
    unitName: string;
    tier: MemberTier;
    supplyArea: number; // 평형 (pyung)
    totalPrice: number;
    pricePerPyung: number;
    revenueContribution?: number; // Total revenue from this allocation (price * count)
  }[];

  // Total Expected Revenue (분양가 총액)
  totalRevenue?: number;
}
