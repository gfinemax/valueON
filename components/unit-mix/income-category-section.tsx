"use client";

import type {
    CSSProperties,
    KeyboardEvent as ReactKeyboardEvent,
    PointerEvent as ReactPointerEvent,
} from "react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, PanelRight, X } from "lucide-react";
import { AnalysisResult, MemberTier, UnitAllocation, UnitType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatKoreanCurrency, formatKrwEok, formatKrwMan, formatKrwThousands, parseKoreanMoney } from "@/utils/currency";

type IncomeCategoryId = "member1" | "member2" | "general" | "rental" | "other";

interface IncomeCategorySectionProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    unitPricing?: AnalysisResult["unitPricing"];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number | string) => void;
    isEditMode?: boolean;
    summaryContent?: ReactNode;
}

interface IncomeRow {
    allocation: UnitAllocation;
    unitType: UnitType;
    label: string;
    totalPrice: number;
    pricePerPyung: number;
    revenue: number;
}

interface IncomeCategorySummary {
    id: IncomeCategoryId;
    title: string;
    description: string;
    color: string;
    border: string;
    rows: IncomeRow[];
    itemCount: number;
    householdCount: number;
    revenue: number;
}

const CATEGORY_META: Record<IncomeCategoryId, { title: string; description: string; color: string; border: string }> = {
    member1: {
        title: "1차 조합원",
        description: "1차 조합원 분담금",
        color: "bg-emerald-500",
        border: "border-l-emerald-500",
    },
    member2: {
        title: "2차 조합원",
        description: "2차 조합원 분담금",
        color: "bg-amber-500",
        border: "border-l-amber-500",
    },
    general: {
        title: "일반분양수입",
        description: "아파트 일반분양",
        color: "bg-blue-500",
        border: "border-l-blue-500",
    },
    rental: {
        title: "임대주택수입",
        description: "임대주택 분양/수입",
        color: "bg-violet-500",
        border: "border-l-violet-500",
    },
    other: {
        title: "기타수입",
        description: "업무대행비, 이자수입 등",
        color: "bg-slate-500",
        border: "border-l-slate-500",
    },
};

const TIER_LABELS: Record<MemberTier, string> = {
    "1st": "1차 조합원",
    "2nd": "2차 조합원",
    General: "일반분양",
};
const INCOME_DETAIL_STORAGE_KEY = "valueon-income-selected-category-v1";
const MIN_DETAIL_PANEL_WIDTH = 360;
const MAX_DETAIL_PANEL_WIDTH = 720;

function isIncomeCategoryId(value: string | null): value is IncomeCategoryId {
    return value !== null && value in CATEGORY_META;
}

function formatEok(amount: number) {
    return formatKrwEok(amount);
}

function getRows(
    unitTypes: UnitType[],
    allocations: UnitAllocation[],
    unitPricing?: AnalysisResult["unitPricing"]
) {
    return allocations.flatMap<IncomeRow>((allocation) => {
        const unitType = unitTypes.find((type) => type.id === allocation.unitTypeId);
        if (!unitType) return [];

        const pricing = unitPricing?.find((item) => item.allocationId === allocation.id);
        const pricePerPyung = allocation.targetPricePerPyung ?? pricing?.pricePerPyung ?? 0;
        const totalPrice = pricing?.totalPrice ?? unitType.supplyArea * pricePerPyung;

        return [{
            allocation,
            unitType,
            label: unitType.category === "RENTAL" ? "임대수입" : TIER_LABELS[allocation.tier],
            totalPrice,
            pricePerPyung,
            revenue: totalPrice * allocation.count,
        }];
    });
}

export function IncomeCategorySection({
    unitTypes,
    allocations,
    unitPricing,
    onUpdateAllocation,
    isEditMode = true,
    summaryContent,
}: IncomeCategorySectionProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<IncomeCategoryId | null>(null);
    const [detailPanelWidth, setDetailPanelWidth] = useState(500);
    const restoredCategoryRef = useRef(false);
    const layoutRef = useRef<HTMLElement>(null);

    const summaries = useMemo<IncomeCategorySummary[]>(() => {
        const rows = getRows(unitTypes, allocations, unitPricing);
        const apartmentRows = rows.filter((row) => row.unitType.category !== "RENTAL");
        const firstMemberRows = apartmentRows.filter((row) => row.allocation.tier === "1st");
        const secondMemberRows = apartmentRows.filter((row) => row.allocation.tier === "2nd");
        const generalRows = apartmentRows.filter((row) => row.allocation.tier === "General");
        const rentalRows = rows.filter((row) => row.unitType.category === "RENTAL");

        const buildSummary = (id: IncomeCategoryId, categoryRows: IncomeRow[], itemCount = categoryRows.length) => {
            const meta = CATEGORY_META[id];
            return {
                id,
                ...meta,
                rows: categoryRows,
                itemCount,
                householdCount: categoryRows.reduce((sum, row) => sum + row.allocation.count, 0),
                revenue: categoryRows.reduce((sum, row) => sum + row.revenue, 0),
            };
        };

        return [
            buildSummary("member1", firstMemberRows),
            buildSummary("member2", secondMemberRows),
            buildSummary("general", generalRows),
            buildSummary("rental", rentalRows),
            buildSummary("other", [], 0),
        ];
    }, [allocations, unitPricing, unitTypes]);

    const totalRevenue = summaries.reduce((sum, summary) => sum + summary.revenue, 0);
    const selectedCategory = summaries.find((summary) => summary.id === selectedCategoryId);

    useEffect(() => {
        if (restoredCategoryRef.current) {
            return;
        }

        restoredCategoryRef.current = true;
        const savedCategoryId = window.localStorage.getItem(INCOME_DETAIL_STORAGE_KEY);
        if (isIncomeCategoryId(savedCategoryId) && summaries.some((summary) => summary.id === savedCategoryId)) {
            const timeoutId = window.setTimeout(() => setSelectedCategoryId(savedCategoryId), 0);
            return () => window.clearTimeout(timeoutId);
        }
    }, [summaries]);

    useEffect(() => {
        if (!selectedCategoryId) {
            window.localStorage.removeItem(INCOME_DETAIL_STORAGE_KEY);
            return;
        }

        if (!summaries.some((summary) => summary.id === selectedCategoryId)) {
            setSelectedCategoryId(null);
            window.localStorage.removeItem(INCOME_DETAIL_STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(INCOME_DETAIL_STORAGE_KEY, selectedCategoryId);
    }, [selectedCategoryId, summaries]);

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

    return (
        <section
            ref={layoutRef}
            style={selectedCategory ? ({ "--detail-panel-width": `${detailPanelWidth}px` } as CSSProperties) : undefined}
            className={selectedCategory ? "grid grid-cols-1 gap-3 pb-10 lg:h-[calc(100vh-5.5rem)] lg:grid-cols-[minmax(320px,1fr)_0.5rem_minmax(360px,var(--detail-panel-width))] lg:gap-0 lg:overflow-hidden" : "grid grid-cols-1 gap-3 pb-10 lg:h-[calc(100vh-5.5rem)] lg:overflow-hidden"}
        >
            <div className="min-w-0 space-y-3 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:pr-2 lg:pb-10">
                {summaryContent}

                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <span className="inline-block h-4 w-1 rounded-full bg-slate-800" />
                    수입 카테고리
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {summaries.map((summary) => {
                        const percent = totalRevenue > 0 ? (summary.revenue / totalRevenue) * 100 : 0;
                        const selected = summary.id === selectedCategory?.id;
                        const priceRows = summary.rows
                            .slice()
                            .sort((a, b) => a.unitType.supplyArea - b.unitType.supplyArea);

                        return (
                            <button
                                key={summary.id}
                                type="button"
                                onClick={() => setSelectedCategoryId((currentId) => (
                                    currentId === summary.id ? null : summary.id
                                ))}
                                className={`group min-h-[168px] rounded-xl border border-slate-200 border-l-4 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md ${summary.border} ${selected ? "ring-2 ring-blue-400 shadow-md" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                                                <h4 className="truncate text-lg font-extrabold tracking-tight text-slate-950">
                                                    {summary.title}
                                                </h4>
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    {percent.toFixed(1)}%
                                                </span>
                                                <span className="text-sm text-slate-400">항목 {summary.itemCount}개</span>
                                                <span className="text-sm text-slate-400">{summary.householdCount}세대</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className={`
                                                    inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold transition-colors
                                                    ${selected
                                                        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                                                        : "border-slate-200 bg-slate-50 text-slate-500 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700"}
                                                `}
                                            >
                                                <PanelRight className="h-3.5 w-3.5" aria-hidden="true" />
                                                <span>{selected ? "열림" : "상세"}</span>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            {selected ? "다시 클릭하면 상세 패널이 닫힙니다" : "상세 패널 열기"}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                {priceRows.length > 0 && (
                                    <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-3">
                                        {priceRows.map((row) => (
                                            <div key={row.allocation.id} className="flex min-w-0 items-center justify-between gap-3 text-sm">
                                                <span className="truncate font-semibold text-slate-600">
                                                    {row.unitType.name}
                                                </span>
                                                <span
                                                    className="shrink-0 font-bold tabular-nums text-slate-900"
                                                    title={`정확값 ${formatKrwThousands(row.totalPrice)}`}
                                                >
                                                    {formatKrwEok(row.totalPrice)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div
                                    className="mt-4 text-right text-2xl font-extrabold tracking-tight text-slate-950"
                                    title={`정확값 ${formatKrwThousands(summary.revenue)}`}
                                >
                                    {formatEok(summary.revenue)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedCategory && (
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

            {selectedCategory && (
                <aside className="rounded-xl border border-slate-200 bg-white shadow-sm lg:h-full lg:overflow-y-auto lg:overscroll-contain">
                    <div className={`sticky top-0 z-20 rounded-t-xl border-l-[5px] ${selectedCategory.border} border-b border-slate-200 bg-slate-50 p-4 shadow-sm`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${selectedCategory.color}`} />
                                    <h4 className="truncate text-base font-extrabold tracking-tight text-slate-900">
                                        {selectedCategory.title}
                                    </h4>
                                </div>
                                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                        {totalRevenue > 0 ? ((selectedCategory.revenue / totalRevenue) * 100).toFixed(1) : "0.0"}%
                                    </span>
                                    <span
                                        className="font-bold text-slate-900 tabular-nums"
                                        title={`정확값 ${formatKrwThousands(selectedCategory.revenue)}`}
                                    >
                                        {formatEok(selectedCategory.revenue)}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {selectedCategory.householdCount}세대
                                    </span>
                                </div>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label="상세 패널 닫기"
                                        className="shrink-0 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        onClick={() => setSelectedCategoryId(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">상세 패널 닫기</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    <div className="rounded-b-xl bg-slate-50/60 p-4">
                        {selectedCategory.rows.length > 0 ? (
                            <div className="space-y-3">
                                {selectedCategory.rows.map((row) => (
                                    <IncomeDetailRow
                                        key={row.allocation.id}
                                        row={row}
                                        isEditMode={isEditMode}
                                        onUpdateAllocation={onUpdateAllocation}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                                등록된 세부 수입 항목이 없습니다.
                            </div>
                        )}
                    </div>
                </aside>
            )}
        </section>
    );
}

function IncomeDetailRow({
    row,
    isEditMode,
    onUpdateAllocation,
}: {
    row: IncomeRow;
    isEditMode: boolean;
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number | string) => void;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h5 className="truncate text-sm font-extrabold text-slate-950">
                        {row.unitType.name} · {row.label}
                    </h5>
                    <p className="mt-1 text-xs text-slate-500">
                        공급 {row.unitType.supplyArea}평 · 전용 {row.unitType.exclusiveAreaM2}㎡
                    </p>
                </div>
                <div className="text-right text-base font-extrabold text-slate-950">
                    {formatKrwEok(row.revenue)}
                </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                    <label className="mb-1 block text-xs text-slate-500">세대수</label>
                    {isEditMode ? (
                        <div className="flex items-center gap-1">
                            <Input
                                type="number"
                                className="h-8 text-center text-sm font-medium"
                                value={row.allocation.count}
                                onChange={(event) => onUpdateAllocation(row.allocation.id, "count", Number(event.target.value))}
                            />
                            <span className="text-xs text-slate-400">세대</span>
                        </div>
                    ) : (
                        <div className="text-sm font-semibold text-slate-700">{row.allocation.count}세대</div>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs text-slate-500">평당 단가</label>
                    {isEditMode ? (
                        <MoneyInput
                            value={row.pricePerPyung}
                            onChange={(value) => onUpdateAllocation(row.allocation.id, "targetPricePerPyung", value)}
                        />
                    ) : (
                        <div className="text-right text-sm font-semibold text-slate-700">
                            {formatKrwMan(row.pricePerPyung)}
                        </div>
                    )}
                </div>
            </div>

            {isEditMode && (
                <div className="mt-3">
                    <label className="mb-1 block text-xs text-slate-500">메모</label>
                    <Input
                        type="text"
                        placeholder="—"
                        className="h-8 text-sm"
                        value={row.allocation.note || ""}
                        onChange={(event) => onUpdateAllocation(row.allocation.id, "note", event.target.value)}
                    />
                </div>
            )}
        </div>
    );
}

function MoneyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
    const [localValue, setLocalValue] = useState(formatKoreanCurrency(value));

    const handleBlur = () => {
        const parsed = parseKoreanMoney(localValue);
        onChange(parsed);
        setLocalValue(formatKoreanCurrency(parsed));
    };

    return (
        <Input
            className="h-8 text-right text-sm"
            value={localValue}
            onChange={(event) => setLocalValue(event.target.value)}
            onFocus={() => setLocalValue(value > 0 ? String(value) : "")}
            onBlur={handleBlur}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    (event.target as HTMLInputElement).blur();
                }
            }}
        />
    );
}
