"use client";

import { useState } from "react";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { UnitMixSection } from "@/components/unit-mix/unit-mix-section";
import { UnitMixStats } from "@/components/unit-mix/unit-mix-stats";
import { UnitConfigPanel } from "@/components/unit-mix/unit-config-panel";
import { SearchHeader } from "@/components/search-header";
import { Settings } from "lucide-react";

export default function IncomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showConfig, setShowConfig] = useState(false);

    const {
        inputs,
        updateUnitAllocation,
        updateUnitTypeTotalUnits,
        result
    } = useCalculator();

    const { groupedSearch } = useSearchIndex({ inputs, result });
    const searchResults = groupedSearch(searchQuery);

    return (
        <main className="min-h-screen bg-white pt-14">
            {/* Header with Search and Settings */}
            <SearchHeader
                title="수입 관리"
                searchResults={searchResults}
                onSearch={setSearchQuery}
                actions={
                    <button
                        onClick={() => setShowConfig(!showConfig)}
                        className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-slate-200 text-slate-800' : 'hover:bg-slate-100 text-slate-500'}`}
                        title="세대 배분 설정"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                }
            />

            <div className="p-6 space-y-4 max-w-7xl mx-auto">
                {/* Subtitle */}
                <p className="text-sm text-slate-600">세대 구성 및 분양가</p>

                {/* Collapsible Configuration Panel */}
                {showConfig && (
                    <UnitConfigPanel
                        unitTypes={inputs.unitTypes}
                        onUpdateUnitTypeTotalUnits={updateUnitTypeTotalUnits}
                    />
                )}

                {/* Statistics Dashboard */}
                <UnitMixStats
                    unitTypes={inputs.unitTypes}
                    allocations={inputs.unitAllocations}
                    unitPricing={result.unitPricing}
                />

                {/* Unit Mix Cards */}
                <UnitMixSection
                    unitTypes={inputs.unitTypes}
                    allocations={inputs.unitAllocations}
                    onUpdateAllocation={updateUnitAllocation}
                    unitPricing={result.unitPricing}
                />
            </div>
        </main>
    );
}

