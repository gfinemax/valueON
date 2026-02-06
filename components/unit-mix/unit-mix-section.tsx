"use client";

import { UnitType, UnitAllocation } from "@/types";
import { UnitMixTable } from "./unit-mix-table";

interface UnitMixSectionProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number) => void;
}

export function UnitMixSection({ unitTypes, allocations, onUpdateAllocation }: UnitMixSectionProps) {
    return (
        <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="bg-purple-50 p-4 rounded-lg mb-2 text-sm text-purple-800">
                <p className="font-bold mb-1">🏗️ 세대 구성 및 분양가 (Unit Mix)</p>
                <p>일반분양 수익금을 제외한 나머지 사업비를 조합원이 부담합니다.</p>
                <p className="mt-1 text-xs text-purple-600">
                    * 2차 조합원은 1차보다 설정된 프리미엄만큼 더 부담합니다.
                </p>
            </div>

            <UnitMixTable
                unitTypes={unitTypes}
                allocations={allocations}
                onUpdateAllocation={onUpdateAllocation}
            />
        </div>
    );
}
