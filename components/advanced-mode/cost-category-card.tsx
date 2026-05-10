"use client";

import { useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical, PanelRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";

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
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { formatKrwThousands, parseKoreanMoney } from "@/utils/currency";
import { calculateCostItemAmount } from "@/lib/analysis";

import { getCategoryColor } from "@/constants/category-colors";

// Remove local CATEGORY_COLORS definition
// const getColors = ... removed


interface CostCategoryDetailsProps {
    category: CostCategory;
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
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
    highlightItemId?: string;
    allowItemMoving?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

interface CostCategoryCardProps extends CostCategoryDetailsProps {
    totalExpense?: number;
    dragAttributes?: React.HTMLAttributes<HTMLDivElement>;
    dragListeners?: React.HTMLAttributes<HTMLDivElement>;
    isExpanded?: boolean;
    isSelected?: boolean;
    onSelect?: () => void;
}

export function CostCategoryDetails({
    category,
    projectTarget,
    unitAllocations,
    unitTypes,
    onUpdateItem,
    onUpdateItemBasis,
    onUpdateItemCondition,
    onUpdateItemRate,
    onUpdateItemArea,
    onUpdateItemMemo,
    onAddItem,
    onRemoveItem,
    onAddSubItem,
    onUpdateSubItem,
    onRemoveSubItem,
    onUpdateSubItemMemo,
    onUpdateItemName,
    reorderCategoryItem,
    highlightItemId,
    allowCategoryAdding = true,
    allowItemDeleting = true,
}: CostCategoryDetailsProps) {
    const colors = getCategoryColor(category.title);

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

    return (
        <CardContent className={`p-3 ${colors.bg}`}>
            <div className="space-y-1.5 mb-2">
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
                                compact
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
                    className="w-full text-blue-600 hover:bg-blue-100 hover:text-blue-700 py-1.5 h-auto border border-dashed border-blue-300 rounded-lg"
                    onClick={handleAddItem}
                >
                    <Plus className="h-4 w-4 mr-1" /> 항목 추가하기
                </Button>
            )}
        </CardContent>
    );
}

export function CostCategoryCard({
    category,
    projectTarget,
    unitAllocations,
    totalExpense = 0,
    onRemoveCategory,
    onUpdateCategoryMemo,
    onUpdateCategoryTitle,
    dragAttributes,
    dragListeners,
    isExpanded: initialExpanded,
    isSelected = false,
    onSelect,
    allowItemDeleting = true,
}: CostCategoryCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const colors = getCategoryColor(category.title);

    useEffect(() => {
        if (initialExpanded || isSelected) {
            setTimeout(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [initialExpanded, isSelected]);

    // Calculate actual total value
    const totalAmount = category.items.reduce(
        (acc, item) => acc + calculateCostItemAmount(item, { projectTarget, unitAllocations }),
        0
    );

    const percentage = totalExpense > 0 ? (totalAmount / totalExpense) * 100 : 0;

    const formatMoney = (val: number) => formatKrwThousands(val);

    const handleDeleteCategory = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`'${category.title}' 카테고리를 삭제하시겠습니까? 포함된 모든 항목이 삭제됩니다.`)) {
            onRemoveCategory(category.id);
        }
    };

    return (
        <Card ref={cardRef} className={`
            group overflow-hidden py-0 gap-0 transition-all duration-300 ease-out border-l-[5px]
            ${colors.border}
            ${isSelected ? "min-h-[86px] ring-2 ring-blue-400 shadow-md border-y-slate-200 border-r-slate-200" : "min-h-[86px] hover:shadow-md border-y-slate-200 border-r-slate-200"}
            ${initialExpanded || isSelected ? "animate-pulse-once" : ""}
        `}>
            <CardHeader
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-controls={`${category.id}-detail-panel`}
                className="p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
                onClick={onSelect}
                onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect?.();
                    }
                }}
            >
                {/* Top Row: Title + Drag + Delete */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
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
                                    className="truncate text-base font-bold text-slate-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors"
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
                    <span
                        className={`
                            flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition-colors
                            ${isSelected
                                ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                                : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700"}
                        `}
                    >
                        <PanelRight className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isSelected ? "열림" : "상세"}</span>
                    </span>
                </div>

                {/* Bottom Row: Amount + Percentage */}
                <div className="mt-2 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400">
                        항목 {category.items.length}개
                    </span>
                    <span className={`justify-self-end text-lg font-extrabold ${totalAmount === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
                        {formatMoney(totalAmount)}
                    </span>
                </div>
            </CardHeader>
        </Card>
    );
}
