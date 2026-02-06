import { AnalysisInputs, CostCategory, UnitType, UnitAllocation } from "@/types";

const defaultAdvancedCategories: CostCategory[] = [
    {
        id: "land",
        title: "토지비",
        items: [
            { id: "l1", name: "토지매입비", amount: 104490000000 },
            { id: "l2", name: "국유지 매입비", amount: 4716000000 },
            { id: "l3", name: "취등록세 등", amount: 5023476000 },
            { id: "l4", name: "법무사비용", amount: 218412000 },
            { id: "l5", name: "지주작업비", amount: 1638090000 },
        ],
    },
    {
        id: "construction",
        title: "공사비",
        items: [
            { id: "c1", name: "직접공사비", amount: 80556000000 },
            { id: "c2", name: "철거/토목공사비", amount: 4000000000 },
            { id: "c3", name: "인입공사비", amount: 335650000 },
            { id: "c4", name: "미술장식품", amount: 277835000 },
        ],
    },
    {
        id: "license",
        title: "인허가비",
        items: [
            { id: "i1", name: "설계비", amount: 1074080000 },
            { id: "i2", name: "감리비", amount: 1074080000 },
            { id: "i3", name: "기타 용역비", amount: 500000000 },
            { id: "i4", name: "허가조건 이행공사비", amount: 500000000 },
        ],
    },
    {
        id: "contribution",
        title: "부담금",
        items: [
            { id: "d1", name: "광역교통시설부담금", amount: 2424453000 },
            { id: "d2", name: "학교용지분담금", amount: 1720920000 },
            { id: "d3", name: "상하수도 분담금", amount: 508000000 },
        ],
    },
    {
        id: "sales",
        title: "판매비(분양)",
        items: [
            { id: "s1", name: "M/H 임차료", amount: 240000000 },
            { id: "s2", name: "M/H 건립비", amount: 900000000 },
            { id: "s3", name: "운영관비", amount: 240000000 },
            { id: "s4", name: "광고선전비", amount: 1075575000 },
            { id: "s5", name: "분양수수료", amount: 3810000000 },
        ],
    },
    {
        id: "general",
        title: "일반관리비",
        items: [
            { id: "g1", name: "신탁수수료", amount: 1075575000 },
            { id: "g2", name: "조합/대행사 운영비", amount: 900000000 },
            { id: "g3", name: "시행사 운영비", amount: 1400000000 },
            { id: "g4", name: "예비비", amount: 1075575000 },
            { id: "g5", name: "입주관리비", amount: 76200000 },
        ],
    },
    {
        id: "finance",
        title: "금융비용",
        items: [
            { id: "f1", name: "PF 수수료", amount: 1290690000 },
            { id: "f2", name: "PF 이자", amount: 12338892000 },
        ],
    },
    {
        id: "etc",
        title: "기타",
        items: [
            { id: "e1", name: "민원처리비", amount: 215115000 },
            { id: "e2", name: "근저당설정비", amount: 926185000 },
        ],
    },
];

const defaultUnitTypes: UnitType[] = [
    { id: "u1", name: "59 Type", supplyArea: 25 },
    { id: "u2", name: "84 Type", supplyArea: 34 },
];

const defaultUnitAllocations: UnitAllocation[] = [
    // 1st Members
    { id: "a1", unitTypeId: "u1", tier: "1st", count: 50 },
    { id: "a2", unitTypeId: "u2", tier: "1st", count: 80 },

    // 2nd Members (Premium 30M)
    { id: "a3", unitTypeId: "u1", tier: "2nd", count: 30, premium: 30000000 },
    { id: "a4", unitTypeId: "u2", tier: "2nd", count: 44, premium: 30000000 },

    // General Sales (Target Price 35M/pyung)
    { id: "a5", unitTypeId: "u1", tier: "General", count: 20, targetPricePerPyung: 35000000 },
    { id: "a6", unitTypeId: "u2", tier: "General", count: 30, targetPricePerPyung: 35000000 },
];

export const defaultValues: AnalysisInputs = {
    projectTarget: {
        totalLandArea: 3876,
        totalFloorArea: 13426,
        totalHouseholds: 254,
    },
    addedCosts: {
        operationFeePerUnit: 15000000,
        pmServiceFeeTotal: 3810000000,
        sunkCost: 0,
        contingencyRate: 1,
    },
    variableCosts: {
        landPricePerPyung: 30000000,
        constCostPerPyung: 6000000,
        interestRateBridge: 6.0,
        interestRatePF: 6.0,
    },
    isAdvancedMode: false,
    advancedCategories: defaultAdvancedCategories,

    unitTypes: defaultUnitTypes,
    unitAllocations: defaultUnitAllocations,
};
