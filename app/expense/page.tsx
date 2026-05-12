"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { AdvancedInputSection } from "@/components/advanced-mode/advanced-input-section";
import { ProjectInfoPanel } from "@/components/advanced-mode/project-info-panel";
import { SearchHeader } from "@/components/search-header";
import { useSettings } from "@/components/settings-context";
import { ManagementHeaderActions } from "@/components/management-header-actions";

function ExpensePageContent() {
    const { allowItemMoving, allowCategoryAdding, allowItemDeleting, isEditMode, setIsEditMode } = useSettings();
    const [searchQuery, setSearchQuery] = useState("");
    const searchParams = useSearchParams();

    // Read search navigation params
    const expandCategoryId = searchParams.get('expand') || undefined;
    const highlightItemId = searchParams.get('highlight') || undefined;

    const {
        inputs,
        updateInput,
        updateCategoryItem,
        updateCategoryItemBasis,
        updateCategoryItemArea,
        updateCategoryItemCondition,
        updateCategoryItemRate,
        updateCategoryItemMemo,
        toggleCategoryItemLock,
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

    // Handler for ProjectInfoPanel updates
    const handleProjectTargetUpdate = (field: keyof typeof inputs.projectTarget, value: number) => {
        updateInput('projectTarget', field, value);
    };

    const canMoveItems = isEditMode && allowItemMoving;
    const canAddCategories = isEditMode && allowCategoryAdding;
    const canDeleteItems = isEditMode && allowItemDeleting;

    return (
        <main className="min-h-screen bg-background pt-14">
            {/* Header with search */}
            <SearchHeader
                title="지출 관리"
                searchResults={searchResults}
                onSearch={setSearchQuery}
                actions={(
                    <ManagementHeaderActions
                        isEditMode={isEditMode}
                        onEditModeChange={setIsEditMode}
                        secondaryActions={(
                            <ProjectInfoPanel
                                projectTarget={inputs.projectTarget}
                                onUpdate={handleProjectTargetUpdate}
                            />
                        )}
                    />
                )}
            />

            <div className="w-full p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-12 space-y-4">
                        <AdvancedInputSection

                            allowItemMoving={canMoveItems}
                            allowCategoryAdding={canAddCategories}
                            allowItemDeleting={canDeleteItems}
                            forceItemsLocked={!isEditMode}
                            showAddCategoryButton={canAddCategories}
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
                            toggleCategoryItemLock={toggleCategoryItemLock}
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
                            updateCategoryItemArea={updateCategoryItemArea}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ExpensePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <ExpensePageContent />
        </Suspense>
    );
}


