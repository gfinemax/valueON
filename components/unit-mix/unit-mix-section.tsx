"use client";

import { UnitType, UnitAllocation, AnalysisResult } from "@/types";
import { UnitMixGrid } from "./unit-mix-grid";

interface UnitMixSectionProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number | string) => void;
    unitPricing?: AnalysisResult['unitPricing'];
}

export function UnitMixSection({ unitTypes, allocations, onUpdateAllocation, unitPricing }: UnitMixSectionProps) {
    return (
        <div className="space-y-6">
            {/* Group by Category */}
            {['APARTMENT', 'RENTAL', 'RETAIL'].map((category) => {
                const categoryTypes = unitTypes.filter(u => (u.category || 'APARTMENT') === category);
                if (categoryTypes.length === 0) return null;

                const categoryLabel = {
                    'APARTMENT': '아파트 (Apartment)',
                    'RENTAL': '임대주택 (Rental)',
                    'RETAIL': '상가 (Retail)'
                }[category as string];

                return (
                    <div key={category} className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-1 h-4 bg-slate-800 rounded-full inline-block"></span>
                            {categoryLabel}
                        </h3>
                        <UnitMixGrid
                            unitTypes={categoryTypes}
                            allocations={allocations}
                            onUpdateAllocation={onUpdateAllocation}
                            unitPricing={unitPricing}
                        />
                    </div>
                );
            })}
        </div>
    );
}
