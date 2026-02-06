"use client";

import { Header } from "@/components/header";
import { SummaryDashboard } from "@/components/summary-dashboard";
import { InputSection } from "@/components/input-section";
import { AdvancedInputSection } from "@/components/advanced-mode/advanced-input-section";
import { UnitMixSection } from "@/components/unit-mix/unit-mix-section";
import { useCalculator } from "@/hooks/useCalculator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Home() {
  const {
    inputs,
    result,
    updateInput,
    toggleAdvancedMode,
    updateCategoryItem,
    updateCategoryItemBasis,
    updateCategoryItemCondition,
    addCategoryItem,
    removeCategoryItem,
    addCostCategory,
    removeCostCategory,
    updateUnitAllocation,
    resetData,
  } = useCalculator();

  return (
    <main className="min-h-screen bg-white">
      <Header costPerPyung={result.estimatedPrices.type84} onReset={resetData} />

      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">대시보드</h2>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <span className={cn("text-xs font-medium px-2 py-1 rounded cursor-pointer transition-all", !inputs.isAdvancedMode ? "bg-white shadow-sm" : "text-slate-500")} onClick={() => inputs.isAdvancedMode && toggleAdvancedMode(false)}>
              간편
            </span>
            <Switch
              checked={inputs.isAdvancedMode}
              onCheckedChange={toggleAdvancedMode}
              className="data-[state=checked]:bg-blue-600 h-5 w-9"
            />
            <span className={cn("text-xs font-medium px-2 py-1 rounded cursor-pointer transition-all", inputs.isAdvancedMode ? "bg-white shadow-sm" : "text-slate-500")} onClick={() => !inputs.isAdvancedMode && toggleAdvancedMode(true)}>
              상세
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Sections (Main work area) */}
          <div className="lg:col-span-7 space-y-6">
            {inputs.isAdvancedMode ? (
              <>
                <UnitMixSection
                  unitTypes={inputs.unitTypes}
                  allocations={inputs.unitAllocations}
                  onUpdateAllocation={updateUnitAllocation}
                />
                <AdvancedInputSection
                  categories={inputs.advancedCategories}
                  projectTarget={inputs.projectTarget}
                  unitAllocations={inputs.unitAllocations}
                  unitTypes={inputs.unitTypes}
                  updateCategoryItem={updateCategoryItem}
                  updateCategoryItemBasis={updateCategoryItemBasis}
                  updateCategoryItemCondition={updateCategoryItemCondition}
                  addCategoryItem={addCategoryItem}
                  removeCategoryItem={removeCategoryItem}
                  addCostCategory={addCostCategory}
                  removeCostCategory={removeCostCategory}
                />
              </>
            ) : (
              <InputSection inputs={inputs} updateInput={updateInput} />
            )}
          </div>

          {/* Right Column: Summary Dashboard (Pinned or stacked) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20">
              <SummaryDashboard result={result} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
