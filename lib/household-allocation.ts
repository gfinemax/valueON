import { AnalysisInputs, MemberTier } from "@/types";
import { defaultValues } from "@/constants/defaultValues";

export function applyHouseholdPresetToInputs(inputs: AnalysisInputs): AnalysisInputs {
    const residentialIds = new Set(inputs.unitTypes
        .filter((type) => type.category === "APARTMENT" || type.category === "RENTAL")
        .map((type) => type.id));
    return {
        ...inputs,
        projectTarget: { ...inputs.projectTarget, totalHouseholds: 262 },
        unitTypes: [
            ...defaultValues.unitTypes.filter((type) => type.category === "APARTMENT" || type.category === "RENTAL").map((type) => ({ ...type })),
            ...inputs.unitTypes.filter((type) => !residentialIds.has(type.id)),
        ],
        unitAllocations: [
            ...defaultValues.unitAllocations.map((allocation) => ({ ...allocation })),
            ...inputs.unitAllocations.filter((allocation) => !residentialIds.has(allocation.unitTypeId)),
        ],
    };
}

// Explicit counts update totals without redistributing another tier.
export function updateHouseholdCountInInputs(inputs: AnalysisInputs, unitTypeId: string, tier: MemberTier, value: number): AnalysisInputs {
    if (!inputs.unitTypes.some((type) => type.id === unitTypeId)) return inputs;
    const count = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    const firstAllocation = inputs.unitAllocations.find((allocation) => allocation.unitTypeId === unitTypeId && allocation.tier === tier);
    let allocations = inputs.unitAllocations.map((allocation) =>
        allocation.unitTypeId === unitTypeId && allocation.tier === tier
            ? { ...allocation, count: allocation.id === firstAllocation?.id ? count : 0 }
            : allocation);
    if (!allocations.some((allocation) => allocation.unitTypeId === unitTypeId && allocation.tier === tier)) {
        allocations = [...allocations, {
            id: `alloc-${unitTypeId}-${tier}`, unitTypeId, tier, count,
            targetPricePerPyung: tier === "1st" ? 45000000 : tier === "2nd" ? 55000000 : 13000000,
        }];
    }
    const unitTypes = inputs.unitTypes.map((type) => type.id === unitTypeId ? {
        ...type,
        totalUnits: allocations.filter((allocation) => allocation.unitTypeId === type.id).reduce((sum, allocation) => sum + allocation.count, 0),
    } : type);
    const totalHouseholds = unitTypes
        .filter((type) => type.category === "APARTMENT" || type.category === "RENTAL")
        .reduce((sum, type) => sum + (type.totalUnits || 0), 0);
    return { ...inputs, unitTypes, unitAllocations: allocations, projectTarget: { ...inputs.projectTarget, totalHouseholds } };
}

export function updateHouseholdSupplyArea(inputs: AnalysisInputs, unitTypeId: string, area: number): AnalysisInputs {
    if (!Number.isFinite(area) || area <= 0) return inputs;
    const rentalId = unitTypeId.startsWith("unit-") ? unitTypeId.replace("unit-", "rental-") : undefined;
    return {
        ...inputs,
        unitTypes: inputs.unitTypes.map((type) => type.id === unitTypeId || type.id === rentalId ? { ...type, supplyArea: area } : type),
    };
}
