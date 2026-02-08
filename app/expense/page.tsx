"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { AdvancedInputSection } from "@/components/advanced-mode/advanced-input-section";
import { SearchHeader } from "@/components/search-header";

export default function ExpensePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const searchParams = useSearchParams();

    // Read search navigation params
    const expandCategoryId = searchParams.get('expand') || undefined;
    const highlightItemId = searchParams.get('highlight') || undefined;

    const {
        inputs,
        updateCategoryItem,
        updateCategoryItemBasis,
        updateCategoryItemCondition,
        updateCategoryItemRate,
        updateCategoryItemMemo,
        addCategoryItem,
        removeCategoryItem,
        addCostCategory,
        removeCostCategory,
        addSubItem,
        updateSubItem,
        removeSubItem,
        updateCategoryMemo,
        updateSubItemMemo,
        updateCategoryItemName,
        updateCategoryTitle,
        reorderCategoryItem,
        reorderCostCategory,
        result,
    } = useCalculator();

    const { groupedSearch } = useSearchIndex({ inputs, result });
    const searchResults = groupedSearch(searchQuery);

    // Use totalRevenue from calculator result
    const totalIncome = result?.totalRevenue || 0;

    return (
        <main className="min-h-screen bg-white">
            {/* Header with search */}
            <SearchHeader
                title="지출 관리"
                searchResults={searchResults}
                onSearch={setSearchQuery}
            />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12 space-y-6">
                        <AdvancedInputSection
                            categories={inputs.advancedCategories}
                            projectTarget={inputs.projectTarget}
                            unitAllocations={inputs.unitAllocations}
                            unitTypes={inputs.unitTypes}
                            totalIncome={totalIncome}
                            updateCategoryItem={updateCategoryItem}
                            updateCategoryItemBasis={updateCategoryItemBasis}
                            updateCategoryItemCondition={updateCategoryItemCondition}
                            updateCategoryItemRate={updateCategoryItemRate}
                            updateCategoryItemMemo={updateCategoryItemMemo}
                            addCategoryItem={addCategoryItem}
                            removeCategoryItem={removeCategoryItem}
                            addCostCategory={addCostCategory}
                            removeCostCategory={removeCostCategory}
                            addSubItem={addSubItem}
                            updateSubItem={updateSubItem}
                            removeSubItem={removeSubItem}
                            updateCategoryMemo={updateCategoryMemo}
                            updateSubItemMemo={updateSubItemMemo}
                            updateCategoryItemName={updateCategoryItemName}
                            updateCategoryTitle={updateCategoryTitle}
                            reorderCategoryItem={reorderCategoryItem}
                            reorderCostCategory={reorderCostCategory}
                            expandCategoryId={expandCategoryId}
                            highlightItemId={highlightItemId}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}


