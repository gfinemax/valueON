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
}

export interface UnitType {
  id: string;
  name: string;      // e.g. "59A", "84B"
  supplyArea: number; // 공급면적 (평) - used for price calculation
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
}

export interface CostCategory {
  id: string; // e.g., 'land', 'construction'
  title: string;
  items: CostItem[];
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
    totalPrice: number;
    pricePerPyung: number;
  }[];
}
