import { AnalysisInputs, CostCategory, UnitType, UnitAllocation } from "@/types";

const defaultAdvancedCategories: CostCategory[] = [
    {
        id: "land",
        title: "토지비",
        items: [
            { id: "l1", name: "토지매입비", amount: 104490000000, calculationBasis: 'per_site_private' },
            { id: "l2", name: "국유지 매입비", amount: 4716000000, calculationBasis: 'per_site_public' },
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
            { id: "c5", name: "설계비", amount: 1074080000 },
            { id: "c6", name: "감리비", amount: 1074080000 },
            { id: "c7", name: "허가조건 이행공사비", amount: 500000000 },
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
        id: "sales",
        title: "분양제비용",
        items: [
            { id: "s1", name: "M/H 임차료", amount: 240000000 },
            { id: "s2", name: "M/H 건립비", amount: 900000000 },
            { id: "s3", name: "운영관비", amount: 240000000 },
            { id: "s4", name: "광고선전비", amount: 1075575000 },
            { id: "s5", name: "분양수수료", amount: 3810000000 },
            { id: "s6", name: "입주관리비", amount: 76200000 },
        ],
    },
    {
        id: "general",
        title: "기타개발비",
        items: [
            { id: "g1", name: "신탁수수료", amount: 1075575000 },
            { id: "g2", name: "조합/대행사 운영비", amount: 900000000 },
            { id: "g3", name: "시행사 운영비", amount: 1400000000 },
            { id: "g4", name: "예비비", amount: 1075575000 },
            { id: "g5", name: "민원처리비", amount: 215115000 },
            { id: "g6", name: "근저당설정비", amount: 926185000 },
        ],
    },
    {
        id: "contribution",
        title: "부(분)담금",
        items: [
            { id: "d1", name: "광역교통시설부담금", amount: 2424453000 },
            { id: "d2", name: "학교용지분담금", amount: 180000000 },
            { id: "d3", name: "상하수도 분담금", amount: 0 },
        ],
    },
    {
        id: "license",
        title: "인허가비",
        items: [
            { id: "i1", name: "기타 용역비", amount: 500000000 },
        ],
    },
    {
        id: "registration",
        title: "보존등기비",
        items: [
            { id: "r1", name: "보존등기비용", amount: 0 },
        ],
    },
];

const defaultUnitTypes: UnitType[] = [
    // 아파트 (Apartment) - 총 236세대
    { id: "u2", name: "84 Type", supplyArea: 34, exclusiveAreaM2: 112.40, category: "APARTMENT", totalUnits: 64 },
    { id: "u3", name: "73 Type", supplyArea: 31, exclusiveAreaM2: 102.48, category: "APARTMENT", totalUnits: 47 },
    { id: "u1", name: "59 Type", supplyArea: 25, exclusiveAreaM2: 82.84, category: "APARTMENT", totalUnits: 125 },
    // 임대주택 (Rental) - 총 18세대
    { id: "u6", name: "임대 84Type", supplyArea: 34, exclusiveAreaM2: 112.40, category: "RENTAL", totalUnits: 3 },
    { id: "u5", name: "임대 73Type", supplyArea: 31, exclusiveAreaM2: 102.48, category: "RENTAL", totalUnits: 3 },
    { id: "u4", name: "임대 59Type", supplyArea: 25, exclusiveAreaM2: 82.84, category: "RENTAL", totalUnits: 12 },
];

const defaultUnitAllocations: UnitAllocation[] = [
    // 아파트 - 1st Members (고정 분양가) - 총 70세대
    { id: "a1", unitTypeId: "u1", tier: "1st", count: 37, fixedTotalPrice: 750000000 },  // 59 Type: 7억 5천
    { id: "a7", unitTypeId: "u3", tier: "1st", count: 14, fixedTotalPrice: 925000000 },  // 73 Type: 9억 2,500만
    { id: "a2", unitTypeId: "u2", tier: "1st", count: 19, fixedTotalPrice: 999000000 },  // 84 Type: 9억 9,900만

    // 아파트 - 2nd Members (일반분양과 동일) - 총 130세대
    { id: "a3", unitTypeId: "u1", tier: "2nd", count: 69, fixedTotalPrice: 1000000000 },  // 59 Type: 10억
    { id: "a8", unitTypeId: "u3", tier: "2nd", count: 26, fixedTotalPrice: 1325000000 }, // 73 Type: 13.25억
    { id: "a4", unitTypeId: "u2", tier: "2nd", count: 35, fixedTotalPrice: 1399000000 }, // 84 Type: 13.99억

    // 아파트 - General Sales - 총 36세대
    { id: "a5", unitTypeId: "u1", tier: "General", count: 19, fixedTotalPrice: 1100000000 },  // 59 Type: 11억
    { id: "a9", unitTypeId: "u3", tier: "General", count: 7, fixedTotalPrice: 1475000000 },   // 73 Type: 13.25억+1.5억=14.75억
    { id: "a6", unitTypeId: "u2", tier: "General", count: 10, fixedTotalPrice: 1549000000 },  // 84 Type: 13.99억+1.5억=15.49억

    // 임대주택 - General only (평당 2,500만원) - 총 18세대
    { id: "a10", unitTypeId: "u4", tier: "General", count: 12, targetPricePerPyung: 25000000 },
    { id: "a11", unitTypeId: "u5", tier: "General", count: 3, targetPricePerPyung: 25000000 },
    { id: "a12", unitTypeId: "u6", tier: "General", count: 3, targetPricePerPyung: 25000000 },
];

export const defaultValues: AnalysisInputs = {
    projectTarget: {
        totalLandArea: 3876,
        privateLandArea: 3483,
        publicLandArea: 393,
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
    initialPayment: 450000000, // 초기 분양가 4억 5천만원
};
