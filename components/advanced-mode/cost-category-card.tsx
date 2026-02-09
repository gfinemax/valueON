"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";

import { CostItemRow } from "./cost-item-row";
import { SortableCostItemRow } from "./sortable-cost-item-row";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { parseKoreanMoney } from "@/utils/currency";

import { CATEGORY_COLORS, getCategoryColor } from "@/constants/category-colors";

// Remove local CATEGORY_COLORS definition
// const getColors = ... removed


interface CostCategoryCardProps {
    category: CostCategory;
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    totalExpense?: number;
    onUpdateItem: (catId: string, itemId: string, val: number) => void;
    onUpdateItemBasis: (catId: string, itemId: string, basis: CostItem['calculationBasis']) => void;
    onUpdateItemCondition?: (catId: string, itemId: string, allocationId: string, amount: number) => void;
    onUpdateItemRate: (catId: string, itemId: string, rate: number) => void;
    onUpdateItemArea?: (catId: string, itemId: string, area: number) => void;
    onUpdateItemMemo: (catId: string, itemId: string, memo: string) => void;
    onAddItem: (catId: string, name: string, amount: number) => void;
    onRemoveCategory: (id: string) => void;
    onRemoveItem: (catId: string, itemId: string) => void;
    onAddSubItem: (catId: string, itemId: string, name: string, amount: number) => void;
    onUpdateSubItem: (catId: string, itemId: string, subItemId: string, field: 'name' | 'amount', value: string | number) => void;
    onRemoveSubItem: (catId: string, itemId: string, subItemId: string) => void;
    onUpdateCategoryMemo: (catId: string, memo: string) => void;
    onUpdateSubItemMemo: (catId: string, itemId: string, subItemId: string, memo: string) => void;
    onUpdateItemName: (catId: string, itemId: string, newName: string) => void;
    onUpdateCategoryTitle: (catId: string, newTitle: string) => void;
    reorderCategoryItem: (catId: string, activeId: string, overId: string) => void;
    dragAttributes?: any;
    dragListeners?: any;
    isExpanded?: boolean;
    highlightItemId?: string;
    allowItemMoving?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

export function CostCategoryCard({
    category,
    projectTarget,
    unitAllocations,
    unitTypes,
    totalExpense = 0,
    onUpdateItem,
    onUpdateItemBasis,
    onUpdateItemCondition,
    onUpdateItemRate,
    onUpdateItemArea,
    onUpdateItemMemo,
    onAddItem,
    onRemoveItem,
    onRemoveCategory,
    onAddSubItem,
    onUpdateSubItem,
    onRemoveSubItem,
    onUpdateCategoryMemo,
    onUpdateSubItemMemo,
    onUpdateItemName,
    onUpdateCategoryTitle,
    reorderCategoryItem,
    dragAttributes,
    dragListeners,
    isExpanded: initialExpanded,
    highlightItemId,
    allowItemMoving = true,
    allowCategoryAdding = true,
    allowItemDeleting = true,
}: CostCategoryCardProps) {
    const [isOpen, setIsOpen] = useState(initialExpanded || false);
    const cardRef = useRef<HTMLDivElement>(null);
    const colors = getCategoryColor(category.title);

    // Auto-expand and scroll when navigating from search
    useEffect(() => {
        if (initialExpanded) {
            setIsOpen(true);
            // Scroll to card after a brief delay for DOM update
            setTimeout(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [initialExpanded]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // We always pass sensors to avoid Hook errors about changing array size.
    // Dragging is disabled by not passing listeners to items.

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            reorderCategoryItem(category.id, active.id as string, over.id as string);
        }
    }

    // Calculate actual total value
    const totalAmount = category.items.reduce((acc, item) => {
        let val = item.amount;
        if (item.calculationBasis === 'per_unit') val *= projectTarget.totalHouseholds;
        else if (item.calculationBasis === 'per_site_pyung') val *= projectTarget.totalLandArea;
        else if (item.calculationBasis === 'per_site_private') val *= (projectTarget.privateLandArea || 0);
        else if (item.calculationBasis === 'per_site_public') val *= (projectTarget.publicLandArea || 0);
        else if (item.calculationBasis === 'per_floor_pyung') val *= projectTarget.totalFloorArea;
        else if (item.calculationBasis === 'manual_pyeong') val *= (item.manualArea || 0);
        else if (item.calculationBasis === 'mix_linked' && item.mixConditions && unitAllocations) {
            val = unitAllocations.reduce((sub, alloc) => {
                const specific = item.mixConditions?.[alloc.id] || 0;
                return sub + (alloc.count * specific);
            }, 0);
        }

        const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
        val = val * (rate / 100);

        return acc + val;
    }, 0);

    const percentage = totalExpense > 0 ? (totalAmount / totalExpense) * 100 : 0;

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(val);

    const handleAddItem = () => {
        const name = prompt("추가할 항목명을 입력하세요:", "새 항목");
        if (!name) return;
        const amountStr = prompt("금액을 입력하세요 (예: 1000만원, 1.5억, 500000 등):", "0");
        if (amountStr === null) return;
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
        <Card ref={cardRef} className={`
            group overflow-hidden transition-all duration-300 ease-out border-l-[6px]
            ${colors.border}
            ${isOpen ? "ring-2 ring-blue-400 shadow-xl" : "hover:shadow-lg border-y-slate-200 border-r-slate-200"}
            ${initialExpanded ? "animate-pulse-once" : ""}
        `}>
            <CardHeader
                className="p-3 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Top Row: Title + Drag + Delete */}
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        {/* Drag Handle */}
                        {dragListeners && (
                            <div
                                {...dragAttributes}
                                {...dragListeners}
                                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1 rounded hover:bg-slate-100 touch-none"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <GripVertical className="w-5 h-5" />
                            </div>
                        )}

                        <Popover>
                            <PopoverTrigger asChild>
                                <span
                                    className="text-base font-bold text-slate-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {category.title}
                                    {category.note ? (
                                        <span className="ml-1 text-blue-400 text-xs">💬</span>
                                    ) : (
                                        <span className="ml-1 text-slate-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">+ 메모</span>
                                    )}
                                </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3" side="top" align="start" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">카테고리 이름</label>
                                        <Input
                                            type="text"
                                            value={category.title}
                                            onChange={(e) => onUpdateCategoryTitle(category.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                            className="h-9 text-sm w-full font-medium"
                                            placeholder="카테고리 이름..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">메모</label>
                                        <Input
                                            type="text"
                                            value={category.note || ""}
                                            onChange={(e) => onUpdateCategoryMemo(category.id, e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                            className="h-9 text-sm w-full"
                                            placeholder="이 카테고리에 대한 메모..."
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">Enter 또는 바깥을 클릭하면 저장됩니다</p>
                                </div>
                            </PopoverContent>
                        </Popover>
                        {allowItemDeleting && (
                            <button
                                onClick={handleDeleteCategory}
                                className="text-slate-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="카테고리 삭제"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                </div>

                {/* Bottom Row: Amount + Percentage */}
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {percentage.toFixed(1)}%
                    </span>
                    <span className={`text-xl font-extrabold ${totalAmount === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
                        {formatMoney(totalAmount)}
                    </span>
                </div>
            </CardHeader>

            {/* Expandable Content with Animation */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-out
                ${isOpen ? 'max-h-[15000px] opacity-100' : 'max-h-0 opacity-0'}
            `}>
                <CardContent className={`p-3 pt-0 border-t ${colors.bg}`}>
                    <div className="space-y-2 mb-3 pt-3">
                        <DndContext
                            id={`dnd-context-${category.id}`}
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={category.items}
                                strategy={verticalListSortingStrategy}
                            >
                                {category.items.map((item) => (
                                    <SortableCostItemRow
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
                                        onUpdateRate={(itemId, rate) => onUpdateItemRate(category.id, itemId, rate)}
                                        onUpdateArea={(itemId, area) => onUpdateItemArea?.(category.id, itemId, area)}
                                        onUpdateMemo={(itemId, memo) => onUpdateItemMemo(category.id, itemId, memo)}
                                        onRemove={(itemId) => onRemoveItem(category.id, itemId)}
                                        applicationRate={item.applicationRate}
                                        manualArea={item.manualArea}
                                        memo={item.note}
                                        subItems={item.subItems}
                                        onAddSubItem={(name, amount) => onAddSubItem(category.id, item.id, name, amount)}
                                        onUpdateSubItem={(subId, field, val) => onUpdateSubItem(category.id, item.id, subId, field, val)}
                                        onRemoveSubItem={(subId) => onRemoveSubItem(category.id, item.id, subId)}
                                        onUpdateSubItemMemo={(subId, memo) => onUpdateSubItemMemo(category.id, item.id, subId, memo)}
                                        onUpdateName={(itemId, newName) => onUpdateItemName(category.id, itemId, newName)}
                                        isHighlighted={item.id === highlightItemId}
                                        allowCategoryAdding={allowCategoryAdding}
                                        allowItemDeleting={allowItemDeleting}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                    {allowCategoryAdding && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-blue-600 hover:bg-blue-100 hover:text-blue-700 py-2 h-auto border border-dashed border-blue-300 rounded-lg"
                            onClick={handleAddItem}
                        >
                            <Plus className="h-4 w-4 mr-1" /> 항목 추가하기
                        </Button>
                    )}
                </CardContent>
            </div>
        </Card>
    );
}
