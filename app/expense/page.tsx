"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, Pencil, Plus } from "lucide-react";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { AdvancedInputSection } from "@/components/advanced-mode/advanced-input-section";
import { ProjectInfoPanel } from "@/components/advanced-mode/project-info-panel";
import { SearchHeader } from "@/components/search-header";
import { useSettings } from "@/components/settings-context";

function ExpensePageContent() {
    const { allowItemMoving, allowCategoryAdding, allowItemDeleting } = useSettings();
    const [isEditMode, setIsEditMode] = useState(true);
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

    const handleAddCategory = () => {
        if (!isEditMode || !allowCategoryAdding) return;

        const title = prompt("새로운 카테고리 이름을 입력하세요:", "새 카테고리");
        if (title?.trim()) {
            addCostCategory(title.trim());
        }
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
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEditMode((value) => !value)}
                            aria-pressed={isEditMode}
                            title={isEditMode ? "보기 모드로 전환" : "편집 모드로 전환"}
                            className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold shadow-sm transition-colors ${
                                isEditMode
                                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {isEditMode ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="hidden sm:inline">{isEditMode ? "편집 모드" : "보기 모드"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={!canAddCategories}
                            title={!isEditMode ? "편집 모드에서 카테고리를 추가할 수 있습니다" : allowCategoryAdding ? "카테고리 추가" : "설정에서 카테고리 추가가 꺼져 있습니다"}
                            className="flex h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">카테고리</span>
                        </button>
                        <ProjectInfoPanel
                            projectTarget={inputs.projectTarget}
                            onUpdate={handleProjectTargetUpdate}
                        />
                    </div>
                )}
            />

            <div className="p-4 space-y-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-12 space-y-4">
                        <AdvancedInputSection

                            allowItemMoving={canMoveItems}
                            allowCategoryAdding={canAddCategories}
                            allowItemDeleting={canDeleteItems}
                            showAddCategoryButton={false}
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


