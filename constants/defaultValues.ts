import { AnalysisInputs, CostCategory, UnitType, UnitAllocation, IncomeCategoryMetadata } from "@/types";

const defaultAdvancedCategories: CostCategory[] = [
    {
        id: "land",
        title: "토지비",
        items: [
            { id: "l1", name: "토지매입비", amount: 104490000000, calculationBasis: 'fixed' },
            { id: "l2", name: "국유지 매입비", amount: 4716000000, calculationBasis: 'fixed' },
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

export const householdPreset = [
    { key: "49a", name: "49A형", area: 18, exclusive: 49, first: 13, second: 7, rental: 0 },
    { key: "59a", name: "59A형", area: 25, exclusive: 59, first: 54, second: 34, rental: 0 },
    { key: "59b", name: "59B형", area: 25, exclusive: 59, first: 11, second: 7, rental: 0 },
    { key: "59c", name: "59C형", area: 25, exclusive: 59, first: 16, second: 10, rental: 12 },
    { key: "84a", name: "84A형", area: 34, exclusive: 84, first: 20, second: 13, rental: 0 },
    { key: "84b", name: "84B형", area: 34, exclusive: 84, first: 36, second: 23, rental: 6 },
];

const defaultUnitTypes: UnitType[] = householdPreset.flatMap<UnitType>((row) => [
    { id: `unit-${row.key}`, name: row.name, supplyArea: row.area, exclusiveAreaM2: row.exclusive, category: "APARTMENT", totalUnits: row.first + row.second },
    { id: `rental-${row.key}`, name: `공공임대 ${row.name}`, supplyArea: row.area, exclusiveAreaM2: row.exclusive, category: "RENTAL", totalUnits: row.rental },
]);
defaultUnitTypes.push({ id: "u-misc", name: "기타 수입 항목", supplyArea: 1, exclusiveAreaM2: 0, category: "MISC", totalUnits: 1000 });

const defaultUnitAllocations: UnitAllocation[] = householdPreset.flatMap<UnitAllocation>((row) => [
    { id: `alloc-${row.key}-1st`, unitTypeId: `unit-${row.key}`, tier: "1st", count: row.first, targetPricePerPyung: 45000000 },
    { id: `alloc-${row.key}-2nd`, unitTypeId: `unit-${row.key}`, tier: "2nd", count: row.second, targetPricePerPyung: 55000000 },
    { id: `alloc-${row.key}-rental`, unitTypeId: `rental-${row.key}`, tier: "General", count: row.rental, targetPricePerPyung: 13000000, note: "건축비만 반영 (토지비 제외)" },
]);

const defaultIncomeCategoryMetadata: IncomeCategoryMetadata[] = [
    { id: "member1", title: "1차 조합원" },
    { id: "member2", title: "2차 조합원" },
    { id: "general", title: "일반분양수입" },
    { id: "rental", title: "임대주택수입" },
    { id: "other", title: "기타수입" },
];

export const defaultValues: AnalysisInputs = {
    projectTarget: {
        totalLandArea: 3876,
        privateLandArea: 3483,
        publicLandArea: 393,
        totalFloorArea: 13426,
        totalHouseholds: 262,
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
    fundingPlan: [
        {
            id: "funding-bridge",
            category: "bridge",
            name: "브릿지 자금",
            amount: 0,
            interestRate: 6,
            termMonths: 12,
            feeRate: 0,
            repaymentSource: "본 PF 전환",
        },
        {
            id: "funding-pf",
            category: "pf",
            name: "본 PF",
            amount: 0,
            interestRate: 6,
            termMonths: 36,
            feeRate: 0,
            repaymentSource: "분양수입",
        },
        {
            id: "funding-member-loan",
            category: "member",
            name: "조합원 차입금",
            amount: 0,
            interestRate: 0,
            termMonths: 12,
            feeRate: 0,
            repaymentSource: "조합원 분담금",
        },
        {
            id: "funding-other",
            category: "other",
            name: "기타 차입금",
            amount: 0,
            interestRate: 0,
            termMonths: 12,
            feeRate: 0,
            repaymentSource: "기타수입",
        },
    ],
    incomeCategoryMetadata: defaultIncomeCategoryMetadata,
};
