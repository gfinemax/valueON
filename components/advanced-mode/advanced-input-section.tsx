"use client";

import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { CostCategoryCard } from "./cost-category-card";

interface AdvancedInputSectionProps {
    categories: CostCategory[];
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    updateCategoryItem: (catId: string, itemId: string, val: number) => void;
    updateCategoryItemBasis: (catId: string, itemId: string, basis: CostItem['calculationBasis']) => void;
    updateCategoryItemCondition?: (catId: string, itemId: string, allocationId: string, amount: number) => void;
    addCategoryItem: (catId: string, name: string, amount: number) => void;
    removeCategoryItem: (catId: string, itemId: string) => void;
    addCostCategory: (title: string) => void;
    removeCostCategory: (id: string) => void;
}

export function AdvancedInputSection({
    categories,
    projectTarget,
    unitAllocations,
    unitTypes,
    updateCategoryItem,
    updateCategoryItemBasis,
    updateCategoryItemCondition,
    addCategoryItem,
    removeCategoryItem,
    addCostCategory,
    removeCostCategory,
}: AdvancedInputSectionProps) {

    const handleAddCategory = () => {
        const title = prompt("새로운 카테고리 이름을 입력하세요:", "새 카테고리");
        if (title) {
            addCostCategory(title);
        }
    };

    return (
        <div className="space-y-3 pb-20">
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800">
                <p className="font-bold mb-1">💡 상세 모드 (Advanced Mode)</p>
                <p>각 비용 항목을 상세하게 설정하여 더욱 정밀한 사업 수지를 분석할 수 있습니다.</p>
            </div>

            {categories.map((cat) => (
                <CostCategoryCard
                    key={cat.id}
                    category={cat}
                    projectTarget={projectTarget}
                    unitAllocations={unitAllocations}
                    unitTypes={unitTypes}
                    onUpdateItem={updateCategoryItem}
                    onUpdateItemBasis={updateCategoryItemBasis}
                    onUpdateItemCondition={updateCategoryItemCondition}
                    onAddItem={addCategoryItem}
                    onRemoveItem={removeCategoryItem}
                    onRemoveCategory={removeCostCategory}
                />
            ))}

            <button
                onClick={handleAddCategory}
                className="w-full py-4 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 font-bold hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
                <span>+ 새로운 카테고리 추가</span>
            </button>
        </div>
    );
}
