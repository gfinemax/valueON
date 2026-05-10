"use client";

import { useState } from "react";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { UnitMixStats } from "@/components/unit-mix/unit-mix-stats";
import { UnitConfigPanel } from "@/components/unit-mix/unit-config-panel";
import { IncomeCategorySection } from "@/components/unit-mix/income-category-section";
import { SearchHeader } from "@/components/search-header";
import { ManagementHeaderActions } from "@/components/management-header-actions";
import { useSettings } from "@/components/settings-context";
import { Settings } from "lucide-react";

export default function IncomePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [showConfig, setShowConfig] = useState(false);
    const { isEditMode, setIsEditMode } = useSettings();

    const {
        inputs,
        updateUnitAllocation,
        updateUnitTypeTotalUnits,
        result
    } = useCalculator();

    const { groupedSearch } = useSearchIndex({ inputs, result });
    const searchResults = groupedSearch(searchQuery);

    return (
        <main className="min-h-screen bg-background pt-14">
            {/* Header with Search and Settings */}
            <SearchHeader
                title="수입 관리"
                searchResults={searchResults}
                onSearch={setSearchQuery}
                actions={
                    <ManagementHeaderActions
                        isEditMode={isEditMode}
                        onEditModeChange={setIsEditMode}
                        addLabel="세대 설정"
                        onAdd={() => setShowConfig((value) => !value)}
                        addTitle={showConfig ? "세대 배분 설정 닫기" : "세대 배분 설정 열기"}
                        addDisabledTitle="편집 모드에서 세대 설정을 변경할 수 있습니다"
                        addIcon={<Settings className="h-4 w-4" />}
                    />
                }
            />

            <div className="p-4 space-y-4 max-w-7xl mx-auto">
                {/* Collapsible Configuration Panel */}
                {isEditMode && showConfig && (
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

                {/* Income category cards and detail editor */}
                <IncomeCategorySection
                    unitTypes={inputs.unitTypes}
                    allocations={inputs.unitAllocations}
                    onUpdateAllocation={updateUnitAllocation}
                    unitPricing={result.unitPricing}
                    isEditMode={isEditMode}
                />
            </div>
        </main>
    );
}

