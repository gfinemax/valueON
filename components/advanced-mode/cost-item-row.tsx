"use client";

import { useState, useEffect, useRef } from "react";
import { formatKrwMan, parseKoreanMoney } from "@/utils/currency";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, GripVertical, Calculator, ChevronDown, Lock, Unlock } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { MixConditionDialog } from "./mix-condition-dialog";
import { AcquisitionTaxTemplate, PFInterestTemplate, ManagementFeeTemplate, LandPurchaseTemplate } from "./calculation-templates";




// Dedicated Sub-Item Row for stable input
function SubItemRow({
    sub,
    onUpdate,
    onRemove,
    onUpdateMemo,
    disabled = false,
}: {
    sub: { id: string; name: string; amount: number; note?: string };
    onUpdate: (id: string, field: 'name' | 'amount', value: string | number) => void;
    onRemove: (id: string) => void;
    onUpdateMemo?: (id: string, memo: string) => void;
    disabled?: boolean;
}) {
    // Local state for amount input - only syncs on blur
    const [localAmount, setLocalAmount] = useState(sub.amount === 0 ? "" : sub.amount.toLocaleString());

    // Handle typing - allow numbers and formula characters
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow formula input: numbers, operators, comma, 만/억 units
        setLocalAmount(e.target.value);
    };

    // Update parent state only on blur - parse Korean money with formula support
    const handleBlur = () => {
        const parsed = parseKoreanMoney(localAmount);
        if (!isNaN(parsed)) {
            onUpdate(sub.id, 'amount', parsed);
            setLocalAmount(parsed === 0 ? "" : parsed.toLocaleString());
        } else {
            // Reset to previous value
            setLocalAmount(sub.amount === 0 ? "" : sub.amount.toLocaleString());
        }
    };


    return (
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <div className="flex-1 min-w-0 cursor-pointer">
                        <Input
                            value={sub.name}
                            onChange={(e) => onUpdate(sub.id, 'name', e.target.value)}
                            className={`h-8 text-xs bg-white ${sub.note ? 'border-blue-200' : ''}`}
                            placeholder="세부항목명"
                            disabled={disabled}
                        />
                        {sub.note && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 text-xs">💬</span>}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" side="top" align="start">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-700">세부항목 메모</label>
                        <Input
                            type="text"
                            value={sub.note || ""}
                            onChange={(e) => onUpdateMemo?.(sub.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                            className="h-8 text-xs w-full"
                            placeholder="이 세부항목에 대한 메모..."
                            autoFocus
                            disabled={disabled}
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <div className="flex-1 relative">
                <Input
                    value={localAmount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="h-8 text-xs text-right font-mono bg-white"
                    placeholder="0"
                    inputMode="numeric"
                    disabled={disabled}
                />
            </div>
            {onRemove && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 shrink-0"
                    onClick={() => onRemove(sub.id)}
                    disabled={disabled}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}


export interface CostItemRowProps {
    id: string; // item id
    name: string;
    amount: number;
    calculationBasis?: 'fixed' | 'per_unit' | 'per_site_pyung' | 'per_site_private' | 'per_site_public' | 'per_floor_pyung' | 'mix_linked' | 'manual_pyeong';
    projectTarget?: ProjectTarget;
    mixConditions?: Record<string, number>;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    onUpdate: (id: string, newAmount: number) => void;
    onUpdateBasis: (id: string, basis: 'fixed' | 'per_unit' | 'per_site_pyung' | 'per_site_private' | 'per_site_public' | 'per_floor_pyung' | 'mix_linked' | 'manual_pyeong') => void;
    onUpdateCondition?: (id: string, allocationId: string, amount: number) => void;
    onUpdateRate?: (id: string, rate: number) => void;
    onUpdateArea?: (id: string, area: number) => void;
    onUpdateMemo?: (id: string, memo: string) => void;
    onRemove: (id: string) => void;

    applicationRate?: number;
    manualArea?: number;
    memo?: string;
    subItems?: { id: string; name: string; amount: number; note?: string }[];
    onAddSubItem?: (name: string, amount: number) => void;
    onUpdateSubItem?: (subId: string, field: 'name' | 'amount', value: string | number) => void;
    onRemoveSubItem?: (subId: string) => void;
    onUpdateSubItemMemo?: (subId: string, memo: string) => void;
    onUpdateName?: (id: string, newName: string) => void;
    onToggleLock?: (id: string, locked: boolean) => void;
    dragAttributes?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    dragListeners?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    isHighlighted?: boolean;
    isLocked?: boolean;
    isLockForced?: boolean;
    compact?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

type CalculationBasis = CostItemRowProps['calculationBasis'];

const PYUNG_TO_SQUARE_METERS = 3.305785;
const MAX_UNIT_PRICE_DIGITS = 10;
const SQUARE_METER_BASES: CalculationBasis[] = [
    'per_site_pyung',
    'per_site_private',
    'per_site_public',
    'per_floor_pyung',
    'manual_pyeong',
];

function usesSquareMeterDisplay(basis?: CalculationBasis) {
    return !!basis && SQUARE_METER_BASES.includes(basis);
}

function toDisplayUnitAmount(amount: number, basis?: CalculationBasis) {
    return usesSquareMeterDisplay(basis) ? amount / PYUNG_TO_SQUARE_METERS : amount;
}

function toSquareMeters(pyung: number) {
    return pyung * PYUNG_TO_SQUARE_METERS;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(value);
}

function formatArea(value: number) {
    return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
}

function limitNumericDigits(value: string, maxDigits: number) {
    let digitCount = 0;

    return Array.from(value).filter((char) => {
        if (!/\d/.test(char)) return true;
        digitCount += 1;
        return digitCount <= maxDigits;
    }).join("");
}

function getBasisValue(basis: CalculationBasis, projectTarget?: ProjectTarget, manualArea = 0) {
    if (!projectTarget || !basis) return 0;

    return basis === 'per_unit' ? projectTarget.totalHouseholds :
        basis === 'per_site_pyung' ? projectTarget.totalLandArea :
            basis === 'per_site_private' ? (projectTarget.privateLandArea || 0) :
                basis === 'per_site_public' ? (projectTarget.publicLandArea || 0) :
                    basis === 'per_floor_pyung' ? projectTarget.totalFloorArea :
                        basis === 'manual_pyeong' ? manualArea : 0;
}

function getBasisLabel(basis: CalculationBasis) {
    return basis === 'per_unit' ? "세대" :
        basis === 'per_site_pyung' ? "대지면적" :
            basis === 'per_site_private' ? "사유지" :
                basis === 'per_site_public' ? "국유지" :
                    basis === 'per_floor_pyung' ? "연면적" :
                        basis === 'manual_pyeong' ? "직접입력" : "";
}

export function CostItemRow({
    id, name, amount, calculationBasis, projectTarget,
    mixConditions, unitAllocations, unitTypes,
    onUpdate, onUpdateBasis, onUpdateCondition, onUpdateRate, onUpdateArea, onUpdateMemo, onRemove, applicationRate = 100, manualArea = 0, memo,
    subItems = [], onAddSubItem, onUpdateSubItem, onRemoveSubItem, onUpdateSubItemMemo, onUpdateName, onToggleLock,
    dragAttributes, dragListeners, isHighlighted, isLocked = false, isLockForced = false,
    compact = false,
    allowCategoryAdding = true,
    allowItemDeleting = true,
}: CostItemRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [localValue, setLocalValue] = useState(formatNumber(amount));
    const [isMixDialogOpen, setIsMixDialogOpen] = useState(false);
    const [isSubItemsOpen, setIsSubItemsOpen] = useState(subItems && subItems.length > 0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editMemo, setEditMemo] = useState(memo || "");

    // Template Dialog States
    const [isAcquisitionTaxOpen, setIsAcquisitionTaxOpen] = useState(false);
    const [isPFInterestOpen, setIsPFInterestOpen] = useState(false);
    const [isManagementFeeOpen, setIsManagementFeeOpen] = useState(false);
    const [isLandPurchaseOpen, setIsLandPurchaseOpen] = useState(false);
    const [isBasisMenuOpen, setIsBasisMenuOpen] = useState(false);
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
    const subItemCount = subItems.length;



    // Scroll into view when highlighted from search
    useEffect(() => {
        if (isHighlighted && rowRef.current) {
            setTimeout(() => {
                rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300); // Give time for category to expand
        }
    }, [isHighlighted]);

    useEffect(() => {
        if (subItemCount > 0) {
            setIsSubItemsOpen(true);
        }
    }, [subItemCount]);

    useEffect(() => {
        setLocalValue(formatNumber(amount));
    }, [amount]);

    // Sync edit state when entering edit mode
    useEffect(() => {
        if (isEditMode) {
            setEditName(name);
            setEditMemo(memo || "");
        }
    }, [isEditMode, name, memo]);

    useEffect(() => {
        if (isLocked) {
            setIsEditMode(false);
            setIsBasisMenuOpen(false);
            setIsTemplateMenuOpen(false);
        }
    }, [isLocked]);

    const handleCompleteEdit = () => {
        if (isLocked) return;
        onUpdateName?.(id, editName);
        onUpdateMemo?.(id, editMemo);
        setIsEditMode(false);
    };

    const handleMixSave = (conditions: Record<string, number>) => {
        if (isLocked) return;
        if (onUpdateCondition) {
            Object.entries(conditions).forEach(([allocId, val]) => {
                onUpdateCondition(id, allocId, val);
            });
        }
    };

    const handleAddSubItemClick = () => {
        if (isLocked) return;
        if (onAddSubItem) {
            onAddSubItem("새 세부항목", 0);
            setIsSubItemsOpen(true);
        }
    };

    const handleSubItemUpdate = (subId: string, field: 'name' | 'amount', val: string | number) => {
        if (isLocked) return;
        if (onUpdateSubItem) {
            onUpdateSubItem(subId, field, val);
        }
    };

    const handleSubItemRemove = (subId: string) => {
        if (isLocked) return;
        if (onRemoveSubItem && allowItemDeleting) {
            onRemoveSubItem(subId);
        }
    };

    const handleBlur = () => {
        if (isLocked) {
            setLocalValue(formatNumber(amount));
            return;
        }

        const parsed = parseKoreanMoney(localValue);
        if (!isNaN(parsed) && parsed !== 0) {
            onUpdate(id, parsed);
            setLocalValue(formatNumber(parsed));
        } else {
            if (parsed === 0) {
                onUpdate(id, 0);
                setLocalValue("0");
            } else {
                setLocalValue(formatNumber(amount));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }

    const compactMoney = (val: number) => formatKrwMan(val);

    // Calculate formula display
    let secondaryFormulaText = "";
    let calculatedTotal = 0;

    const formatCompact = (val: number) => formatKrwMan(val);
    const basisValue = getBasisValue(calculationBasis, projectTarget, manualArea);
    const isSquareMeterBasis = usesSquareMeterDisplay(calculationBasis);
    const displayBasisValue = isSquareMeterBasis ? toSquareMeters(basisValue) : basisValue;
    const displayAmount = toDisplayUnitAmount(amount, calculationBasis);
    const basisLabel = getBasisLabel(calculationBasis);

    if (projectTarget && calculationBasis && calculationBasis !== 'fixed') {
        calculatedTotal = amount * basisValue * (applicationRate / 100);

        secondaryFormulaText = isSquareMeterBasis
            ? `㎡ 환산: ${formatArea(displayBasisValue)}㎡ × ${formatCompact(displayAmount)}/㎡ × ${applicationRate}%`
            : "";
    } else {
        // Fixed or default - 항상 공식 표시
        calculatedTotal = amount * (applicationRate / 100);
    }

    const basisOptions = [
        { value: 'fixed', label: '고정', icon: '📌', color: 'bg-slate-100 border-slate-300 text-slate-700', desc: '총액 직접 입력' },
        { value: 'per_floor_pyung', label: '연면적평당', icon: '🏗️', color: 'bg-blue-50 border-blue-300 text-blue-700', desc: '공사비 등' },
        { value: 'per_site_pyung', label: '대지평당', icon: '🌍', color: 'bg-emerald-50 border-emerald-300 text-emerald-700', desc: '토지비 등' },
        { value: 'per_site_private', label: '사유지', icon: '👤', color: 'bg-emerald-50 border-emerald-500 text-emerald-800', desc: '사유지 매입' },
        { value: 'per_site_public', label: '국유지', icon: '🏛️', color: 'bg-teal-50 border-teal-500 text-teal-800', desc: '국공유지 매입' },
        { value: 'per_unit', label: '세대당', icon: '🏠', color: 'bg-purple-50 border-purple-300 text-purple-700', desc: '분양비 등' },
        { value: 'manual_pyeong', label: '평형입력', icon: '⌨️', color: 'bg-indigo-50 border-indigo-400 text-indigo-700', desc: '직접 평수 입력' },
    ] as const;
    const currentBasis = basisOptions.find((option) => option.value === calculationBasis) || basisOptions[0];

    const handleBasisSelect = (basis: typeof basisOptions[number]['value']) => {
        if (isLocked) return;
        setIsBasisMenuOpen(false);
        onUpdateBasis(id, basis);
    };

    const normalizedName = name.replace(/\s/g, "");
    const templateOptions = [
        {
            id: "land",
            label: "토지매입",
            description: "사유지/국유지 유형별 매입비",
            icon: "🏞️",
            isRecommended: /토지|국유지|사유지|매입/.test(normalizedName),
            onSelect: () => setIsLandPurchaseOpen(true),
        },
        {
            id: "tax",
            label: "취득세/등록세",
            description: "취득세, 등록세 등 세금 계산",
            icon: "📋",
            isRecommended: /취득|등록|취등록|세금|세\b/.test(normalizedName),
            onSelect: () => setIsAcquisitionTaxOpen(true),
        },
        {
            id: "pf",
            label: "PF 이자",
            description: "대출 기간과 금리 기준 이자",
            icon: "💰",
            isRecommended: /PF|이자|금융|대출/.test(name.toUpperCase()),
            onSelect: () => setIsPFInterestOpen(true),
        },
        {
            id: "management",
            label: "업무대행료",
            description: "평형별 업무대행료 합산",
            icon: "📊",
            isRecommended: /업무|대행|관리|평형/.test(normalizedName),
            onSelect: () => setIsManagementFeeOpen(true),
        },
    ].sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended));

    const handleTemplateSelect = (onSelect: () => void) => {
        if (isLocked) return;
        setIsTemplateMenuOpen(false);
        onSelect();
    };

    const handleToggleLock = () => {
        if (!onToggleLock || isLockForced) return;

        if (!isLocked) {
            onToggleLock(id, true);
            return;
        }

        if (confirm(`'${name}' 항목의 잠금을 해제할까요?`)) {
            onToggleLock(id, false);
        }
    };

    const rowPadding = compact ? "py-2.5 px-2" : "py-4 px-3";
    const sectionGap = compact ? "mb-2" : "mb-3";
    const titleSize = compact ? "text-base" : "text-lg";
    const basisButtonClass = compact ? "text-[11px] px-2.5 py-1.5" : "text-xs px-3 py-2";
    const calcBoxClass = compact ? "p-2 mb-2" : "p-3 mb-3";
    const inputHeight = compact ? "h-9" : "h-10";
    const resultTextSize = compact ? "text-lg" : "text-xl";
    const formulaRowClass = compact
        ? "flex flex-nowrap items-center gap-1 overflow-hidden pb-0.5"
        : "flex flex-wrap items-center gap-2";
    const unitPriceInputClass = compact
        ? "relative w-[176px] shrink-0"
        : "relative w-[190px] max-w-full shrink-0";
    const fixedAmountInputClass = compact
        ? "relative min-w-0 flex-1"
        : "relative min-w-[220px] max-w-full flex-[1_1_220px]";
    const rateInputClass = compact ? "relative w-[86px] shrink-0" : "relative w-[80px] shrink-0";
    const fixedRateInputClass = compact ? "relative w-[96px] shrink-0" : "relative w-[90px] shrink-0";
    const resultRowClass = compact
        ? "mt-1.5 flex items-center justify-end gap-2 border-t border-slate-100 pt-1.5"
        : "";
    const resultEqualsClass = compact
        ? "text-lg font-light text-slate-300"
        : "shrink-0 text-lg font-light text-slate-300";
    const resultClass = compact
        ? `${resultTextSize} max-w-full font-bold text-blue-600 tabular-nums tracking-tighter text-right break-keep`
        : `${resultTextSize} ml-auto min-w-[120px] font-bold text-blue-600 tabular-nums tracking-tighter text-right`;


    return (
        <div
            ref={rowRef}
            className={`${rowPadding} border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg -mx-2 ${isLocked ? 'bg-slate-50/60' : ''} ${isHighlighted ? 'animate-highlight-pulse ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
        >

            {/* 1. Header Row: Name + Edit/Delete Buttons (Right) */}
            <div className={`flex items-center justify-between gap-2 ${sectionGap}`}>
                {/* Drag Handle */}
                {/* Always show handle if listeners are provided, or maybe hide in edit mode if needed? User wants reorder. */}
                {dragListeners && !isLocked && (
                    <button
                        {...dragAttributes}
                        {...dragListeners}
                        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 mr-1 p-1 rounded hover:bg-slate-100 touch-none"
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>
                )}

                {isEditMode ? (
                    // Edit Mode: Name input
                    <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompleteEdit()}
                        className="h-9 text-lg font-bold flex-1"
                        placeholder="항목 이름..."
                        autoFocus
                    />
                ) : (
                    // Normal Mode: Display name with memo indicator
                    <div className={`font-bold text-slate-800 ${titleSize} tracking-tight flex-1`}>
                        {name}
                        {memo && <span className="ml-1.5 text-blue-400 text-xs">💬</span>}
                    </div>
                )}

                <div className="flex items-center gap-1">
                    {isEditMode ? (
                        // Edit Mode: Complete button
                        <button
                            onClick={handleCompleteEdit}
                            className="text-green-500 hover:text-green-600 hover:bg-green-50 p-1.5 rounded-full transition-all"
                            title="완료"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    ) : (
                        // Normal Mode: Edit and Delete buttons
                        <>
                            <button
                                onClick={() => setIsEditMode(true)}
                                className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-full transition-all"
                                title="편집"
                                disabled={isLocked}
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            {allowItemDeleting && !isLocked && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                                            title="항목 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                정말로 &apos;{name}&apos; 항목을 삭제하시겠습니까?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>취소</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onRemove(id)} className="bg-red-500 hover:bg-red-600">
                                                삭제
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Mode: Memo input */}
            {isEditMode && (
                <div className={sectionGap}>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">메모</label>
                    <Input
                        type="text"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCompleteEdit()}
                        className="h-9 text-sm w-full"
                        placeholder="메모를 입력하세요..."
                        disabled={isLocked}
                    />
                </div>
            )}

            {/* 2. Calculation Controls */}
            <div className={`flex gap-1.5 flex-wrap ${sectionGap}`}>
                <Popover open={isBasisMenuOpen} onOpenChange={setIsBasisMenuOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={`${basisButtonClass} rounded-lg border bg-white font-bold transition-all flex items-center gap-1.5 ${isLocked ? "cursor-not-allowed opacity-60" : "hover:bg-slate-50"} ${currentBasis.color}`}
                            title={isLocked ? "잠긴 항목입니다" : "계산 기준 변경"}
                            disabled={isLocked}
                        >
                            <span className="text-sm">{currentBasis.icon}</span>
                            <span className="text-slate-500">계산기준</span>
                            <span>{currentBasis.label}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBasisMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1.5" side="bottom" align="start">
                        <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                            계산 기준
                        </div>
                        <div className="space-y-0.5">
                            {basisOptions.map((option) => {
                                const isSelected = currentBasis.value === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleBasisSelect(option.value)}
                                        className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${isSelected ? "bg-slate-50" : "hover:bg-slate-50"}`}
                                    >
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-sm">
                                            {option.icon}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block text-sm font-semibold ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                                                {option.label}
                                            </span>
                                            <span className="block truncate text-[11px] text-slate-400">
                                                {option.desc}
                                            </span>
                                        </span>
                                        {isSelected && (
                                            <Check className="h-4 w-4 shrink-0 text-blue-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                <button
                    type="button"
                    onClick={handleToggleLock}
                    className={`${basisButtonClass} rounded-lg border font-bold transition-all flex items-center gap-1.5 ${isLockForced ? "cursor-not-allowed opacity-70" : ""} ${isLocked
                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"}`}
                    title={isLockForced ? "보기 모드에서는 잠겨 있습니다" : isLocked ? "잠금 해제" : "항목 잠금"}
                    disabled={isLockForced}
                >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {isLocked ? "잠김" : "풀림"}
                </button>

                {/* Template Selector */}
                <Popover open={isTemplateMenuOpen} onOpenChange={setIsTemplateMenuOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={`${basisButtonClass} rounded-lg border border-orange-200 bg-white text-orange-600 font-bold transition-all flex items-center gap-1.5 ${isLocked ? "cursor-not-allowed opacity-50" : "hover:border-orange-300 hover:bg-orange-50"}`}
                            title={isLocked ? "잠긴 항목입니다" : "전용 계산기"}
                            disabled={isLocked}
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            템플릿
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTemplateMenuOpen ? "rotate-180" : ""}`} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-1.5" side="bottom" align="start">
                        <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400">
                            계산 템플릿
                        </div>
                        <div className="space-y-0.5">
                            {templateOptions.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.onSelect)}
                                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-orange-50"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-sm">
                                        {template.icon}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                                            {template.label}
                                            {template.isRecommended && (
                                                <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                                                    추천
                                                </span>
                                            )}
                                        </span>
                                        <span className="block truncate text-[11px] text-slate-400">
                                            {template.description}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </PopoverContent>


                </Popover>
            </div>

            {/* 3. Calculation Row - Template-based Layout */}
            <div className={`bg-white ${calcBoxClass} rounded-lg border border-slate-100 shadow-sm`}>
                {calculationBasis && calculationBasis !== 'fixed' && projectTarget ? (
                    // Template Mode: [기준값] × [단가] × [적용률] = [결과]
                    <>
                        <div className={formulaRowClass}>
                            {/* Basis Value (Read-only) */}
                            {/* Basis Value (Read-only or Input) */}
                            {calculationBasis === 'manual_pyeong' ? (
                                <div className="relative w-[120px] shrink-0">
                                    <Input
                                        type="number"
                                        value={manualArea || ""}
                                        onChange={(e) => onUpdateArea?.(id, Number(e.target.value))}
                                        className={`${inputHeight} text-right pr-8 font-bold bg-indigo-50 border-indigo-200 text-indigo-700 focus:border-indigo-400 focus:ring-indigo-400`}
                                        placeholder="0"
                                        disabled={isLocked}
                                    />
                                    <span className="absolute right-2 top-3 text-xs text-indigo-400">평</span>
                                </div>
                            ) : (
                                <div className={`flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 ${compact ? "h-9 px-2.5" : "px-3 py-2"}`}>
                                    <span className="text-lg font-bold text-slate-700">
                                        {basisValue.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400">
                                        {basisLabel}
                                    </span>
                                </div>
                            )}

                            <span className="shrink-0 text-lg font-light text-slate-300">×</span>

                            {/* Unit Price Input */}
                            <div className={unitPriceInputClass}>
                                <Input
                                    type="text"
                                    value={localValue}
                                    onChange={(e) => setLocalValue(limitNumericDigits(e.target.value, MAX_UNIT_PRICE_DIGITS))}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    readOnly={calculationBasis === 'mix_linked'}
                                    disabled={calculationBasis === 'mix_linked' || isLocked}
                                    className={`${inputHeight} text-right pr-14 font-mono font-bold ${calculationBasis === 'mix_linked' ? 'bg-slate-50 text-slate-500' : 'bg-white'} focus:border-blue-400 focus:ring-blue-400`}
                                    placeholder="0"
                                    inputMode="numeric"
                                />

                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                                    원/{calculationBasis === 'per_unit' ? '세대' : '평'}
                                </span>
                            </div>

                            <span className="shrink-0 text-lg font-light text-slate-300">×</span>

                            {/* Rate Input */}
                            <div className={rateInputClass}>
                                <Input
                                    type="number"
                                    value={applicationRate}
                                    onChange={(e) => onUpdateRate?.(id, Number(e.target.value))}
                                    className={`${inputHeight} text-right pr-7 font-bold bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400`}
                                    disabled={isLocked}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>

                            {!compact && (
                                <span className={resultEqualsClass}>=</span>
                            )}

                            {/* Total Result */}
                            {!compact && (
                                <div className={resultClass}>
                                    {compactMoney(calculatedTotal)}
                                </div>
                            )}
                        </div>
                        {compact && (
                            <div className={resultRowClass}>
                                <span className={resultEqualsClass}>=</span>
                                <div className={resultClass}>
                                    {compactMoney(calculatedTotal)}
                                </div>
                            </div>
                        )}
                        {secondaryFormulaText && (
                            <div className="mt-2 pl-1 text-xs text-slate-400">
                                {secondaryFormulaText}
                            </div>
                        )}
                    </>
                ) : (
                    // Fixed Mode: [적용률] × [금액] = [결과]
                    <>
                        <div className={formulaRowClass}>
                            {/* Rate Input */}
                            <div className={fixedRateInputClass}>
                                <Input
                                    type="number"
                                    value={applicationRate}
                                    onChange={(e) => onUpdateRate?.(id, Number(e.target.value))}
                                    className={`${inputHeight} text-right pr-7 text-lg font-bold bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400`}
                                    disabled={isLocked}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>

                            <span className="shrink-0 text-lg font-light text-slate-300">×</span>

                            {/* Amount Input */}
                            <div className={fixedAmountInputClass}>
                                <Input
                                    type="text"
                                    value={localValue}
                                    onChange={(e) => setLocalValue(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                readOnly={calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)}
                                disabled={calculationBasis === 'mix_linked' || (subItems && subItems.length > 0) || isLocked}
                                className={`${inputHeight} text-right font-mono font-bold ${(calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)) ? 'bg-slate-50 text-slate-500' : 'bg-white'} focus:border-blue-400 focus:ring-blue-400`}
                                    placeholder="0"
                                />
                            </div>

                            {!compact && (
                                <span className={resultEqualsClass}>=</span>
                            )}

                            {/* Total Result */}
                            {!compact && (
                                <div className={resultClass}>
                                    {compactMoney(calculatedTotal)}
                                </div>
                            )}
                        </div>
                        {compact && (
                            <div className={resultRowClass}>
                                <span className={resultEqualsClass}>=</span>
                                <div className={resultClass}>
                                    {compactMoney(calculatedTotal)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>


            {/* Mix Linked Dialog Logic */}
            {calculationBasis === 'mix_linked' && unitAllocations && unitTypes && (
                <MixConditionDialog
                    open={isMixDialogOpen}
                    onOpenChange={setIsMixDialogOpen}
                    itemName={name}
                    allocations={unitAllocations}
                    unitTypes={unitTypes}
                    currentConditions={mixConditions || {}}
                    onSave={handleMixSave}
                />
            )}

            {/* Sub-Items List */}
            {isSubItemsOpen && subItems && subItems.length > 0 && (
                <div className={`${compact ? "pl-2 pr-1 pb-1 space-y-1 mb-2" : "pl-2 pr-2 pb-2 space-y-2 mb-4"} border-l-2 border-slate-100 ml-2`}>
                    {subItems.map((sub) => (
                        <SubItemRow
                            key={sub.id}
                            sub={sub}
                            onUpdate={handleSubItemUpdate}
                            onRemove={handleSubItemRemove}
                            onUpdateMemo={onUpdateSubItemMemo}
                            disabled={isLocked}
                        />
                    ))}
                </div>
            )}

            {/* Add Sub-Item Button (Start or Append) */}
            {allowCategoryAdding && !isLocked && (
                <div className={`flex justify-end ${subItems && subItems.length > 0 ? 'mt-[-10px] mb-2' : 'mt-0'}`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-blue-500 hover:text-blue-700 h-6 px-2"
                        onClick={handleAddSubItemClick}
                    >
                        + 세부항목 추가
                    </Button>
                </div>
            )}

            {/* Template Dialogs */}
            <AcquisitionTaxTemplate
                open={isAcquisitionTaxOpen}
                onOpenChange={setIsAcquisitionTaxOpen}
                itemName={name}
                currentAmount={amount}
                onSave={(newAmount) => {
                    if (isLocked) return;
                    onUpdate(id, newAmount);
                }}
            />
            <PFInterestTemplate
                open={isPFInterestOpen}
                onOpenChange={setIsPFInterestOpen}
                itemName={name}
                currentAmount={amount}
                onSave={(newAmount) => {
                    if (isLocked) return;
                    onUpdate(id, newAmount);
                }}
            />
            <ManagementFeeTemplate
                open={isManagementFeeOpen}
                onOpenChange={setIsManagementFeeOpen}
                itemName={name}
                currentAmount={amount}
                unitTypes={unitTypes || []}
                onSave={(newAmount) => {
                    if (isLocked) return;
                    onUpdate(id, newAmount);
                }}
            />
            <LandPurchaseTemplate
                open={isLandPurchaseOpen}
                onOpenChange={setIsLandPurchaseOpen}
                itemName={name}
                totalLandArea={projectTarget?.totalLandArea || 0}
                existingSubItems={subItems}
                onSave={(newSubItems) => {
                    if (isLocked) return;
                    // 기존 세부항목 모두 삭제 후 새로 추가
                    if (subItems && onRemoveSubItem) {
                        subItems.forEach(sub => onRemoveSubItem(sub.id));
                    }
                    // 새 세부항목 추가
                    if (onAddSubItem && onUpdateSubItemMemo) {
                        newSubItems.forEach((sub, idx) => {
                            // 약간의 딜레이로 순서 보장 (React state batch)
                            setTimeout(() => {
                                onAddSubItem(sub.name, sub.amount);
                            }, idx * 50);
                        });
                        // 메모 업데이트는 별도로 처리 필요 (세부항목 ID가 새로 생성되므로)
                    }
                    // 상위 항목 금액 업데이트
                    const totalAmount = newSubItems.reduce((sum, sub) => sum + sub.amount, 0);
                    onUpdate(id, totalAmount);
                }}
            />
        </div>
    );
}



