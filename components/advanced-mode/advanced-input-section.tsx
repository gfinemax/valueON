"use client";

import { useState, useEffect } from "react";
import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { CostCategoryCard } from "./cost-category-card";
import { SortableCostCategoryCard } from "./sortable-cost-category-card";
import { Plus } from "lucide-react";
import { getCategoryColor } from "@/constants/category-colors";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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
    rectSortingStrategy,
} from "@dnd-kit/sortable";

interface AdvancedInputSectionProps {
    categories: CostCategory[];
    projectTarget: ProjectTarget;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    totalIncome?: number;
    updateCategoryItem: (catId: string, itemId: string, val: number) => void;
    updateCategoryItemBasis: (catId: string, itemId: string, basis: CostItem['calculationBasis']) => void;
    updateCategoryItemCondition?: (catId: string, itemId: string, allocationId: string, amount: number) => void;
    updateCategoryItemRate: (catId: string, itemId: string, rate: number) => void;
    updateCategoryItemMemo: (catId: string, itemId: string, memo: string) => void;
    addCategoryItem: (catId: string, name: string, amount: number) => void;
    removeCategoryItem: (catId: string, itemId: string) => void;
    addCostCategory: (title: string) => void;
    removeCostCategory: (id: string) => void;
    addSubItem: (catId: string, itemId: string, name: string, amount: number) => void;
    updateSubItem: (catId: string, itemId: string, subItemId: string, field: 'name' | 'amount', value: string | number) => void;
    removeSubItem: (catId: string, itemId: string, subItemId: string) => void;
    updateCategoryMemo: (catId: string, memo: string) => void;
    updateSubItemMemo: (catId: string, itemId: string, subItemId: string, memo: string) => void;
    updateCategoryItemName: (catId: string, itemId: string, newName: string) => void;
    updateCategoryTitle: (catId: string, newTitle: string) => void;
    reorderCategoryItem: (catId: string, activeId: string, overId: string) => void;
    reorderCostCategory: (activeId: string, overId: string) => void;
    expandCategoryId?: string;
    highlightItemId?: string;
}

export function AdvancedInputSection({
    categories,
    projectTarget,
    unitAllocations,
    unitTypes,
    totalIncome,
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
    expandCategoryId,
    highlightItemId,
}: AdvancedInputSectionProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate total expense for percentage calculation
    const totalExpense = categories.reduce((total, cat) => {
        return total + cat.items.reduce((catTotal, item) => {
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
            const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
            return catTotal + (val * rate / 100);
        }, 0);
    }, 0);

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(val);

    const handleAddCategory = () => {
        const title = prompt("새로운 카테고리 이름을 입력하세요:", "새 카테고리");
        if (title) {
            addCostCategory(title);
        }
    };

    // Prepare Data for Pie Chart
    const pieData = categories.map(cat => {
        const amount = cat.items.reduce((acc, item) => {
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
            const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
            return acc + (val * rate / 100);
        }, 0);

        return {
            name: cat.title,
            value: amount,
        };
    }).filter(d => d.value > 0);

    // Helper for Hex Colors (Tailwind 500 equivalent)
    const getHexColor = (title: string) => {
        const map: Record<string, string> = {
            '토지비': '#10b981',   // emerald-500
            '공사비': '#3b82f6',   // blue-500
            '인허가비': '#a855f7', // purple-500
            '부(분)담금': '#f59e0b',   // amber-500
            '분양제비용': '#ec4899', // pink-500
            '기타개발비': '#06b6d4', // cyan-500
            '보존등기비': '#6366f1', // indigo-500
            '금융비용': '#f97316', // orange-500
            '기타': '#64748b',     // slate-500
        };
        return map[title] || '#64748b';
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            reorderCostCategory(active.id as string, over.id as string);
        }
    }

    return (
        <div className="space-y-4 pb-20">
            {/* Summary Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-5 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-300 text-sm mb-1">총 지출 예상</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-extrabold">{formatMoney(totalExpense)}</p>
                            {totalIncome !== undefined && (
                                <span className="text-lg text-slate-300 font-medium opacity-80">
                                    (수입: {formatMoney(totalIncome)})
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-300 text-sm mb-1">카테고리</p>
                        <p className="text-2xl font-bold">{categories.length}개</p>
                    </div>
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600 shadow-sm">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    지출 구성 분석
                </h3>

                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* Legend Grid */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 content-start">
                        {categories.map((cat) => {
                            const amount = cat.items.reduce((acc, item) => {
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
                                const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
                                return acc + (val * rate / 100);
                            }, 0);
                            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                            const colors = getCategoryColor(cat.title);

                            return (
                                <div key={cat.id} className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.bar}`} />
                                    <div className="flex items-baseline gap-1.5 overflow-hidden">
                                        <span className="text-sm text-slate-300 font-medium tracking-tight whitespace-nowrap truncate">{cat.title}</span>
                                        <span className="text-xs text-slate-500 tracking-tight whitespace-nowrap">({pct.toFixed(1)}%)</span>
                                        <span className="text-sm font-bold text-white tracking-tight ml-1 whitespace-nowrap">{formatMoney(amount)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pie Chart */}
                    <div className="w-full lg:w-[240px] h-[180px] relative flex-shrink-0 flex justify-center">
                        {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="35%"
                                        cy="45%"
                                        innerRadius={58}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getHexColor(entry.name)} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => formatMoney(Number(value))}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                차트 로딩 중...
                            </div>
                        )}
                        {/* Center Text */}
                        <div className="absolute top-[45%] left-[35%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 font-bold tracking-tight">Total</p>
                                <p className="text-xs font-bold text-white tracking-tight">100%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2-Column Grid with DndContext */}
            <DndContext
                id="categories-dnd-context"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={categories}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {categories.map((cat) => (
                            <SortableCostCategoryCard
                                key={cat.id}
                                category={cat}
                                projectTarget={projectTarget}
                                unitAllocations={unitAllocations}
                                unitTypes={unitTypes}
                                totalExpense={totalExpense}
                                onUpdateItem={updateCategoryItem}
                                onUpdateItemBasis={updateCategoryItemBasis}
                                onUpdateItemCondition={updateCategoryItemCondition}
                                onUpdateItemRate={updateCategoryItemRate}
                                onUpdateItemMemo={updateCategoryItemMemo}
                                onAddItem={addCategoryItem}
                                onRemoveItem={removeCategoryItem}
                                onRemoveCategory={removeCostCategory}
                                onAddSubItem={addSubItem}
                                onUpdateSubItem={updateSubItem}
                                onRemoveSubItem={removeSubItem}
                                onUpdateCategoryMemo={updateCategoryMemo}
                                onUpdateSubItemMemo={updateSubItemMemo}
                                onUpdateItemName={updateCategoryItemName}
                                onUpdateCategoryTitle={updateCategoryTitle}
                                reorderCategoryItem={reorderCategoryItem}
                                isExpanded={cat.id === expandCategoryId}
                                highlightItemId={cat.id === expandCategoryId ? highlightItemId : undefined}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Add Category Button */}
            <button
                onClick={handleAddCategory}
                className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                <span>새로운 카테고리 추가</span>
            </button>
        </div>
    );
}
