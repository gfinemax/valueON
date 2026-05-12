"use client";

import type {
    CSSProperties,
    KeyboardEvent as ReactKeyboardEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CostCategory, CostItem, ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { CostCategoryCard, CostCategoryDetails } from "./cost-category-card";
import { SortableCostCategoryCard } from "./sortable-cost-category-card";
import { Plus, X } from "lucide-react";
import { getCategoryColor } from "@/constants/category-colors";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import { getCategoryHexColor } from "@/lib/colors";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { calculateCostItemAmount } from "@/lib/analysis";
import { ManagementHeroSummary } from "@/components/management/management-hero-summary";
import { formatKrwEok, formatKrwEokSigned, formatKrwThousands } from "@/utils/currency";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;
const EXPENSE_DETAIL_STORAGE_KEY = "valueon-expense-selected-category-v1";
const MIN_DETAIL_PANEL_WIDTH = 360;
const MAX_DETAIL_PANEL_WIDTH = 820;

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
    updateCategoryItemArea?: (catId: string, itemId: string, area: number) => void;
    updateCategoryItemMemo: (catId: string, itemId: string, memo: string) => void;
    toggleCategoryItemLock: (catId: string, itemId: string, locked: boolean) => void;
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
    allowItemMoving?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
    forceItemsLocked?: boolean;
    showAddCategoryButton?: boolean;
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
    updateCategoryItemArea,
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
    expandCategoryId,
    highlightItemId,
    allowItemMoving = true,
    allowCategoryAdding = true,
    allowItemDeleting = true,
    forceItemsLocked = false,
    showAddCategoryButton = true,
}: AdvancedInputSectionProps) {
    const mounted = useSyncExternalStore(
        subscribeToMount,
        getMountedSnapshot,
        getServerMountedSnapshot
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(expandCategoryId ?? null);
    const [detailPanelWidth, setDetailPanelWidth] = useState(520);
    const restoredCategoryRef = useRef(false);
    const layoutRef = useRef<HTMLDivElement>(null);

    // Helper for cx/left position
    const centerPos = "50%";

    const formatMoney = (val: number) => formatKrwEok(val);

    const handleAddCategory = () => {
        const title = prompt("새로운 카테고리 이름을 입력하세요:", "새 카테고리");
        if (title) {
            addCostCategory(title);
        }
    };

    // 1. Calculate and Sort Categories by Amount
    const categoriesWithTotals = categories.map(cat => {
        const amount = cat.items.reduce(
            (acc, item) => acc + calculateCostItemAmount(item, { projectTarget, unitAllocations }),
            0
        );

        return {
            ...cat,
            totalAmount: amount,
        };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    // 2. Derive totalExpense and pieData from sorted list
    const totalExpense = categoriesWithTotals.reduce((sum, cat) => sum + cat.totalAmount, 0);
    const largestCategory = categoriesWithTotals[0];
    const financeCategory = categoriesWithTotals.find((cat) => cat.title.includes("금융"));
    const incomeGap = totalIncome !== undefined ? totalIncome - totalExpense : undefined;
    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
    const selectedCategoryTotal = categoriesWithTotals.find((cat) => cat.id === selectedCategoryId)?.totalAmount ?? 0;
    const selectedCategoryPercent = totalExpense > 0 ? (selectedCategoryTotal / totalExpense) * 100 : 0;
    const selectedCategoryColors = selectedCategory ? getCategoryColor(selectedCategory.title) : undefined;

    useEffect(() => {
        if (!expandCategoryId || !categories.some((category) => category.id === expandCategoryId)) {
            return;
        }

        const timeoutId = window.setTimeout(() => setSelectedCategoryId(expandCategoryId), 0);
        return () => window.clearTimeout(timeoutId);
    }, [categories, expandCategoryId]);

    useEffect(() => {
        if (restoredCategoryRef.current || expandCategoryId) {
            return;
        }

        restoredCategoryRef.current = true;
        const savedCategoryId = window.localStorage.getItem(EXPENSE_DETAIL_STORAGE_KEY);
        if (savedCategoryId && categories.some((category) => category.id === savedCategoryId)) {
            const timeoutId = window.setTimeout(() => setSelectedCategoryId(savedCategoryId), 0);
            return () => window.clearTimeout(timeoutId);
        }
    }, [categories, expandCategoryId]);

    useEffect(() => {
        if (!selectedCategoryId) {
            window.localStorage.removeItem(EXPENSE_DETAIL_STORAGE_KEY);
            return;
        }

        if (!categories.some((category) => category.id === selectedCategoryId)) {
            window.localStorage.removeItem(EXPENSE_DETAIL_STORAGE_KEY);
            const timeoutId = window.setTimeout(() => setSelectedCategoryId(null), 0);
            return () => window.clearTimeout(timeoutId);
        }

        window.localStorage.setItem(EXPENSE_DETAIL_STORAGE_KEY, selectedCategoryId);
    }, [categories, selectedCategoryId]);

    const pieData = categoriesWithTotals
        .filter(cat => cat.totalAmount > 0)
        .map((cat, index) => ({
            name: cat.title,
            value: cat.totalAmount,
            fill: getCategoryHexColor(cat.title, index)
        }));


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
            reorderCostCategory(active.id as string, over.id as string);
        }
    }

    const clampDetailPanelWidth = (width: number) => {
        const containerWidth = layoutRef.current?.getBoundingClientRect().width ?? 0;
        const dynamicMaxWidth = containerWidth > 0
            ? Math.min(MAX_DETAIL_PANEL_WIDTH, Math.max(MIN_DETAIL_PANEL_WIDTH, containerWidth - 360))
            : MAX_DETAIL_PANEL_WIDTH;

        return Math.min(Math.max(width, MIN_DETAIL_PANEL_WIDTH), dynamicMaxWidth);
    };

    const handleDetailResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!layoutRef.current) return;

        event.preventDefault();
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        const handlePointerMove = (pointerEvent: PointerEvent) => {
            const containerRect = layoutRef.current?.getBoundingClientRect();
            if (!containerRect) return;

            setDetailPanelWidth(clampDetailPanelWidth(containerRect.right - pointerEvent.clientX));
        };

        const handlePointerUp = () => {
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp, { once: true });
    };

    const handleDetailResizeKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? 24 : -24;
        setDetailPanelWidth((currentWidth) => clampDetailPanelWidth(currentWidth + direction));
    };

    const detailPanel = selectedCategory && selectedCategoryColors ? (
        <aside
            id={`${selectedCategory.id}-detail-panel`}
            className="rounded-xl border border-slate-200 bg-white shadow-sm lg:h-full lg:overflow-y-auto lg:overscroll-contain"
        >
            <div className={`sticky top-0 z-20 rounded-t-xl border-l-[5px] ${selectedCategoryColors.border} border-b border-slate-200 bg-slate-50 p-4 shadow-sm`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${selectedCategoryColors.bar}`} />
                            <h4 className="truncate text-base font-extrabold tracking-tight text-slate-900">
                                {selectedCategory.title}
                            </h4>
                        </div>
                        <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1 text-sm">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {selectedCategoryPercent.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-400">
                                항목 {selectedCategory.items.length}개
                            </span>
                            <span className="justify-self-end text-right font-bold text-slate-900 tabular-nums">
                                {formatMoney(selectedCategoryTotal)}
                            </span>
                        </div>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => setSelectedCategoryId(null)}
                                className="shrink-0 rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                aria-label="상세 패널 닫기"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="left">상세 패널 닫기</TooltipContent>
                    </Tooltip>
                </div>
            </div>
            <div className="rounded-b-xl bg-slate-50/60 p-4">
                <CostCategoryDetails
                    category={selectedCategory}
                    projectTarget={projectTarget}
                    unitAllocations={unitAllocations}
                    unitTypes={unitTypes}
                    onUpdateItem={updateCategoryItem}
                    onUpdateItemBasis={updateCategoryItemBasis}
                    onUpdateItemCondition={updateCategoryItemCondition}
                    onUpdateItemRate={updateCategoryItemRate}
                    onUpdateItemArea={updateCategoryItemArea}
                    onUpdateItemMemo={updateCategoryItemMemo}
                    onToggleItemLock={toggleCategoryItemLock}
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
                    highlightItemId={selectedCategory.id === expandCategoryId ? highlightItemId : undefined}
                    allowItemMoving={allowItemMoving}
                    allowCategoryAdding={allowCategoryAdding}
                    allowItemDeleting={allowItemDeleting}
                    forceItemsLocked={forceItemsLocked}
                />
            </div>
        </aside>
    ) : null;

    return (
        <div
            ref={layoutRef}
            style={detailPanel ? ({ "--detail-panel-width": `${detailPanelWidth}px` } as CSSProperties) : undefined}
            className={detailPanel ? "grid grid-cols-1 gap-3 pb-10 lg:h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(320px,1fr)_0.5rem_minmax(360px,var(--detail-panel-width))] lg:gap-0 lg:overflow-hidden" : "grid grid-cols-1 gap-3 pb-10 lg:h-[calc(100vh-5.5rem)] lg:overflow-hidden"}
        >
            <div className="min-w-0 space-y-3 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-10">
                <ManagementHeroSummary
                    title="총 지출 예상"
                    value={formatKrwEok(totalExpense)}
                    description={totalIncome !== undefined ? `수입 ${formatKrwEok(totalIncome)} 기준` : `정확값 ${formatKrwThousands(totalExpense)}`}
                    tone="negative"
                    sticky
                    items={[
                        {
                            label: "카테고리 구성",
                            value: `${categories.length}개`,
                            description: `세부 항목 ${categories.reduce((sum, category) => sum + category.items.length, 0)}개`,
                        },
                        {
                            label: "최대 비용 항목",
                            value: largestCategory ? formatKrwEok(largestCategory.totalAmount) : "0억원",
                            description: largestCategory ? largestCategory.title : "등록된 비용 없음",
                            tone: "accent",
                        },
                        {
                            label: "수입 대비 차이",
                            value: incomeGap === undefined ? "-" : formatKrwEokSigned(incomeGap),
                            description: financeCategory ? `금융비용 ${formatKrwEok(financeCategory.totalAmount)}` : "수입 데이터 연동 필요",
                            tone: incomeGap === undefined ? "neutral" : incomeGap >= 0 ? "positive" : "negative",
                        },
                    ]}
                />

                {/* Compact Statistics Dashboard */}
                <div className="expense-analysis-card bg-card p-4 rounded-xl border border-border shadow-sm">
                    <div className="mb-3">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-tight">
                            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                            지출 구성 분석
                        </h3>
                    </div>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                        {/* Legend Grid */}
                        <div className="relative grid w-full min-w-0 flex-1 grid-cols-1 gap-x-8 gap-y-2 py-2 md:grid-cols-2 lg:grid-cols-3">
                            <span className="pointer-events-none absolute left-1/2 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-slate-200 md:block lg:hidden" />
                            <span className="pointer-events-none absolute left-1/3 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-slate-200 lg:block" />
                            <span className="pointer-events-none absolute left-2/3 top-1/2 hidden h-24 w-px -translate-y-1/2 bg-slate-200 lg:block" />
                            {categoriesWithTotals.map((cat) => {
                                const pct = totalExpense > 0 ? (cat.totalAmount / totalExpense) * 100 : 0;
                                const colors = getCategoryColor(cat.title);

                                return (
                                    <div key={cat.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-baseline gap-2 border-b border-slate-100 pb-1.5">
                                        <div className="flex min-w-0 items-baseline gap-1.5">
                                            <div className={`h-2 w-2 shrink-0 rounded-full ${colors.bar}`} />
                                            <span className="truncate text-sm font-bold tracking-tight text-slate-700">{cat.title}</span>
                                            <span className="expense-analysis-percent shrink-0 text-xs tracking-tight text-muted-foreground/50">
                                                {pct.toFixed(1)}%
                                            </span>
                                        </div>
                                        <span className="justify-self-end text-right text-sm font-medium text-slate-700 tracking-tight whitespace-nowrap tabular-nums">{formatMoney(cat.totalAmount)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pie Chart */}
                        <div className="relative flex h-[170px] w-full shrink-0 justify-center px-6 lg:w-[240px]">
                            {mounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx={centerPos}
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={72}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(value: unknown) => formatMoney(Number(value))}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            wrapperStyle={{ zIndex: 100 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                    차트 로딩 중...
                                </div>
                            )}
                            {/* Center Text */}
                            <div
                                className="absolute top-[50%] flex flex-col items-center justify-center pointer-events-none z-0"
                                style={{ left: centerPos, transform: 'translate(-50%, -50%)' }}
                            >
                                <div className="text-center">
                                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">Total</p>
                                    <p className="text-xs font-bold text-foreground tracking-tight">100%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        표시 금액은 억원 단위로 반올림되며, 정확값은 상세 항목 기준으로 계산됩니다.
                    </p>
                </div>

                {/* Category grid */}
                <div className="min-w-0">
                    {mounted ? (
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
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${detailPanel ? "2xl:grid-cols-2" : "xl:grid-cols-3"}`}>
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
                                            onUpdateItemArea={updateCategoryItemArea}
                                            onUpdateItemMemo={updateCategoryItemMemo}
                                            onToggleItemLock={toggleCategoryItemLock}
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
                                            isSelected={cat.id === selectedCategoryId}
                                            onSelect={() => setSelectedCategoryId((currentId) => (
                                                currentId === cat.id ? null : cat.id
                                            ))}
                                            highlightItemId={cat.id === expandCategoryId ? highlightItemId : undefined}
                                            allowItemMoving={allowItemMoving}
                                            allowCategoryAdding={allowCategoryAdding}
                                            allowItemDeleting={allowItemDeleting}
                                            forceItemsLocked={forceItemsLocked}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${detailPanel ? "2xl:grid-cols-2" : "xl:grid-cols-3"}`}>
                            {categories.map((cat) => (
                                <CostCategoryCard
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
                                    onUpdateItemArea={updateCategoryItemArea}
                                    onUpdateItemMemo={updateCategoryItemMemo}
                                    onToggleItemLock={toggleCategoryItemLock}
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
                                    isSelected={cat.id === selectedCategoryId}
                                    onSelect={() => setSelectedCategoryId((currentId) => (
                                        currentId === cat.id ? null : cat.id
                                    ))}
                                    allowItemMoving={allowItemMoving}
                                    allowCategoryAdding={allowCategoryAdding}
                                    allowItemDeleting={allowItemDeleting}
                                    forceItemsLocked={forceItemsLocked}
                                />
                            ))}
                        </div>
                    )}
            </div>

            {/* Add Category Button */}
            {showAddCategoryButton && allowCategoryAdding && (
                <button
                    onClick={handleAddCategory}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-border text-muted-foreground font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>새로운 카테고리 추가</span>
                </button>
            )}
            </div>

            {detailPanel && (
                <div
                    role="separator"
                    aria-label="카테고리와 상세페이지 너비 조절"
                    aria-orientation="vertical"
                    tabIndex={0}
                    onPointerDown={handleDetailResizePointerDown}
                    onKeyDown={handleDetailResizeKeyDown}
                    className="group hidden h-full cursor-col-resize items-stretch justify-center px-0.5 outline-none lg:flex"
                >
                    <span className="h-full w-px bg-slate-200 transition-colors group-hover:bg-blue-400 group-focus-visible:bg-blue-500" />
                </div>
            )}

            {mounted && detailPanel}
        </div>
    );
}
