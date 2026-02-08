"use client";

import { UnitType, UnitAllocation, AnalysisResult } from "@/types";
import { UnitTypeCard } from "./unit-type-card";

interface UnitMixGridProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number | string) => void;
    unitPricing?: AnalysisResult['unitPricing'];
}

export function UnitMixGrid({ unitTypes, allocations, onUpdateAllocation, unitPricing }: UnitMixGridProps) {
    // Calculate total revenue for percentage display
    const totalRevenue = allocations.reduce((sum, alloc) => {
        if (alloc.tier === '1st' && alloc.fixedTotalPrice) {
            return sum + alloc.fixedTotalPrice * alloc.count;
        }
        const pricing = unitPricing?.find(p => p.allocationId === alloc.id);
        if (pricing) {
            return sum + pricing.totalPrice * alloc.count;
        }
        return sum;
    }, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unitTypes.map((unitType) => {
                // Filter allocations relevant for this unit type
                const typeAllocations = allocations.filter(
                    (a) => a.unitTypeId === unitType.id
                );

                return (
                    <UnitTypeCard
                        key={unitType.id}
                        unitType={unitType}
                        allocations={typeAllocations}
                        onUpdateAllocation={onUpdateAllocation}
                        unitPricing={unitPricing}
                        totalRevenue={totalRevenue}
                    />
                );
            })}
        </div>
    );
}
