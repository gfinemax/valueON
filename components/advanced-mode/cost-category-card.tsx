"use client";

import { useState } from "react";
import { CopyPlus, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { CostItemRow } from "./cost-item-row";
import { parseKoreanMoney } from "@/utils/currency";

interface CostCategoryCardProps {
    category: CostCategory;
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    onUpdateItem: (catId: string, itemId: string, val: number) => void;
    onUpdateItemBasis: (catId: string, itemId: string, basis: CostItem['calculationBasis']) => void;
    onUpdateItemCondition?: (catId: string, itemId: string, allocationId: string, amount: number) => void;
    onAddItem: (catId: string, name: string, amount: number) => void;
    onRemoveCategory: (id: string) => void;
    onRemoveItem: (catId: string, itemId: string) => void;
}

export function CostCategoryCard({
    category,
    projectTarget,
    unitAllocations,
    unitTypes,
    onUpdateItem,
    onUpdateItemBasis,
    onUpdateItemCondition,
    onAddItem,
    onRemoveItem,
    onRemoveCategory,
}: CostCategoryCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate actual total value considering formulas
    const totalAmount = category.items.reduce((acc, item) => {
        let val = item.amount;
        if (item.calculationBasis === 'per_unit') val *= projectTarget.totalHouseholds;
        else if (item.calculationBasis === 'per_site_pyung') val *= projectTarget.totalLandArea;
        else if (item.calculationBasis === 'per_floor_pyung') val *= projectTarget.totalFloorArea;
        else if (item.calculationBasis === 'mix_linked' && item.mixConditions && unitAllocations) {
            val = unitAllocations.reduce((sub, alloc) => {
                const specific = item.mixConditions?.[alloc.id] || 0;
                return sub + (alloc.count * specific);
            }, 0);
        }
        return acc + val;
    }, 0);

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            notation: "compact", // '1조', '1,000억' style if supported or just short
            maximumFractionDigits: 1,
        }).format(val);

    const handleAddItem = () => {
        const name = prompt("추가할 항목명을 입력하세요:", "새 항목");
        if (!name) return;
        const amountStr = prompt("금액을 입력하세요 (예: 1000만원, 1.5억, 500000 등):", "0");
        if (amountStr === null) return;

        // Use the utility to parse
        const amount = parseKoreanMoney(amountStr);
        if (!isNaN(amount)) {
            onAddItem(category.id, name, amount);
        } else {
            alert("올바른 금액 형식이 아닙니다.");
        }
    };

    const handleDeleteCategory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${category.title}' 카테고리를 삭제하시겠습니까? 포함된 모든 항목이 삭제됩니다.`)) {
            onRemoveCategory(category.id);
        }
    };

    return (
        <Card className={`transition-all duration-200 ${isOpen ? "ring-2 ring-blue-500 shadow-lg" : "hover:bg-slate-50 border-slate-200"}`}>
            <CardHeader
                className="p-5 cursor-pointer flex flex-row items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-800 tracking-tight">{category.title}</span>
                    <button onClick={handleDeleteCategory} className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors" title="카테고리 삭제">
                        <span className="sr-only">삭제</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`text-xl font-extrabold ${totalAmount === 0 ? 'text-slate-300' : 'text-[#1a365d]'}`}>
                        {formatMoney(totalAmount)}
                    </span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>
            </CardHeader>

            {isOpen && (
                <CardContent className="p-5 pt-0 border-t border-slate-100 bg-slate-50/30">
                    <div className="space-y-1 mb-3 pt-3">
                        {category.items.map((item) => (
                            <CostItemRow
                                key={item.id}
                                id={item.id}
                                name={item.name}
                                amount={item.amount}
                                calculationBasis={item.calculationBasis}
                                mixConditions={item.mixConditions}
                                projectTarget={projectTarget}
                                unitAllocations={unitAllocations}
                                unitTypes={unitTypes}
                                onUpdate={(itemId, val) => onUpdateItem(category.id, itemId, val)}
                                onUpdateBasis={(itemId, basis) => onUpdateItemBasis(category.id, itemId, basis)}
                                onUpdateCondition={(itemId, allocId, val) => onUpdateItemCondition?.(category.id, itemId, allocId, val)}
                                onRemove={(itemId) => onRemoveItem(category.id, itemId)}
                            />
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-600 hover:bg-blue-50 hover:text-blue-700 py-4 h-auto border border-dashed border-blue-200"
                        onClick={handleAddItem}
                    >
                        <Plus className="h-4 w-4 mr-1" /> 항목 추가하기
                    </Button>
                </CardContent>
            )}
        </Card>
    );
}
