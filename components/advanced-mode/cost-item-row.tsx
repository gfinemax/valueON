"use client";

import { useState, useEffect, useRef } from "react";
import { formatKrwThousands, parseKoreanMoney } from "@/utils/currency";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Pencil, Check, GripVertical, Calculator } from "lucide-react";
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
    onUpdateMemo
}: {
    sub: { id: string; name: string; amount: number; note?: string };
    onUpdate: (id: string, field: 'name' | 'amount', value: string | number) => void;
    onRemove: (id: string) => void;
    onUpdateMemo?: (id: string, memo: string) => void;
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
                />
            </div>
            {onRemove && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 shrink-0"
                    onClick={() => onRemove(sub.id)}
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
    dragAttributes?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    dragListeners?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    isHighlighted?: boolean;
    compact?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

type CalculationBasis = CostItemRowProps['calculationBasis'];

const PYUNG_TO_SQUARE_METERS = 3.305785;
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
    subItems = [], onAddSubItem, onUpdateSubItem, onRemoveSubItem, onUpdateSubItemMemo, onUpdateName,
    dragAttributes, dragListeners, isHighlighted,
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

    const handleCompleteEdit = () => {
        onUpdateName?.(id, editName);
        onUpdateMemo?.(id, editMemo);
        setIsEditMode(false);
    };

    const handleMixSave = (conditions: Record<string, number>) => {
        if (onUpdateCondition) {
            Object.entries(conditions).forEach(([allocId, val]) => {
                onUpdateCondition(id, allocId, val);
            });
        }
    };

    const handleAddSubItemClick = () => {
        if (onAddSubItem) {
            onAddSubItem("새 세부항목", 0);
            setIsSubItemsOpen(true);
        }
    };

    const handleSubItemUpdate = (subId: string, field: 'name' | 'amount', val: string | number) => {
        if (onUpdateSubItem) {
            onUpdateSubItem(subId, field, val);
        }
    };

    const handleSubItemRemove = (subId: string) => {
        if (onRemoveSubItem && allowItemDeleting) {
            onRemoveSubItem(subId);
        }
    };

    const handleBlur = () => {
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

    const compactMoney = (val: number) => formatKrwThousands(val);

    // Calculate formula display
    let secondaryFormulaText = "";
    let calculatedTotal = 0;

    const formatCompact = (val: number) => formatKrwThousands(val);
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

    const rowPadding = compact ? "py-2.5 px-2" : "py-4 px-3";
    const sectionGap = compact ? "mb-2" : "mb-3";
    const titleSize = compact ? "text-base" : "text-lg";
    const basisButtonClass = compact ? "text-[11px] px-2.5 py-1.5" : "text-xs px-3 py-2";
    const calcBoxClass = compact ? "p-2 mb-2" : "p-3 mb-3";
    const inputHeight = compact ? "h-9" : "h-10";
    const resultTextSize = compact ? "text-lg" : "text-xl";


    return (
        <div
            ref={rowRef}
            className={`${rowPadding} border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg -mx-2 ${isHighlighted ? 'animate-highlight-pulse ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
        >

            {/* 1. Header Row: Name + Edit/Delete Buttons (Right) */}
            <div className={`flex items-center justify-between gap-2 ${sectionGap}`}>
                {/* Drag Handle */}
                {/* Always show handle if listeners are provided, or maybe hide in edit mode if needed? User wants reorder. */}
                {dragListeners && (
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
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            {allowItemDeleting && (
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
                    />
                </div>
            )}

            {/* 2. Basis Row: Basis Selection with Icons */}
            <div className={`flex gap-1.5 flex-wrap ${sectionGap}`}>
                {basisOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onUpdateBasis(id, option.value)}
                        title={option.desc}
                        className={`
                            ${basisButtonClass} rounded-lg border font-bold transition-all flex items-center gap-1.5
                            ${(!calculationBasis && option.value === 'fixed') || calculationBasis === option.value
                                ? `${option.color} shadow-sm`
                                : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50 hover:text-slate-600'}
                        `}
                    >
                        <span className="text-sm">{option.icon}</span>
                        {option.label}
                    </button>
                ))}

                {/* Template Selector */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className={`${basisButtonClass} rounded-lg border border-dashed border-orange-300 bg-orange-50 text-orange-600 font-bold transition-all flex items-center gap-1.5 hover:bg-orange-100`}
                            title="전용 계산기"
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            템플릿
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" side="bottom" align="start">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-500 mb-2 px-2">전용 계산기</p>
                            <button
                                onClick={() => setIsAcquisitionTaxOpen(true)}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors"
                            >
                                <span>📋</span>
                                <span>취득세/등록세</span>
                            </button>
                            <button
                                onClick={() => setIsPFInterestOpen(true)}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-amber-50 flex items-center gap-2 transition-colors"
                            >
                                <span>💰</span>
                                <span>PF 이자</span>
                            </button>
                            <button
                                onClick={() => setIsManagementFeeOpen(true)}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-purple-50 flex items-center gap-2 transition-colors"
                            >
                                <span>📊</span>
                                <span>업무대행료 (평형별)</span>
                            </button>
                            <button
                                onClick={() => setIsLandPurchaseOpen(true)}
                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                            >
                                <span>🏞️</span>
                                <span>토지매입 (유형별)</span>
                            </button>
                        </div>
                    </PopoverContent>


                </Popover>
            </div>

            {/* 3. Calculation Row - Template-based Layout */}
            <div className={`bg-white ${calcBoxClass} rounded-lg border border-slate-100 shadow-sm`}>
                {calculationBasis && calculationBasis !== 'fixed' && projectTarget ? (
                    // Template Mode: [기준값] × [단가] × [적용률] = [결과]
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Basis Value (Read-only) */}
                        {/* Basis Value (Read-only or Input) */}
                        {calculationBasis === 'manual_pyeong' ? (
                            <div className="relative w-[120px]">
                                <Input
                                    type="number"
                                    value={manualArea || ""}
                                    onChange={(e) => onUpdateArea?.(id, Number(e.target.value))}
                                    className={`${inputHeight} text-right pr-8 font-bold bg-indigo-50 border-indigo-200 text-indigo-700 focus:border-indigo-400 focus:ring-indigo-400`}
                                    placeholder="0"
                                />
                                <span className="absolute right-2 top-3 text-xs text-indigo-400">평</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <span className="text-lg font-bold text-slate-700">
                                    {basisValue.toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {basisLabel}
                                </span>
                            </div>
                        )}

                        <span className="text-slate-300 font-light text-lg">×</span>

                        {/* Unit Price Input */}
                        <div className="relative flex-1 min-w-[140px]">
                            <Input
                                type="text"
                                value={localValue}
                                onChange={(e) => setLocalValue(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                readOnly={calculationBasis === 'mix_linked'}
                                disabled={calculationBasis === 'mix_linked'}
                                className={`${inputHeight} text-right pr-14 font-mono font-bold ${calculationBasis === 'mix_linked' ? 'bg-slate-50 text-slate-500' : 'bg-white'} focus:border-blue-400 focus:ring-blue-400`}
                                placeholder="0"
                            />

                            <span className="absolute right-2 top-3 text-[10px] text-slate-400 font-medium">
                                원/{calculationBasis === 'per_unit' ? '세대' : '평'}
                            </span>
                        </div>

                        <span className="text-slate-300 font-light text-lg">×</span>

                        {/* Rate Input */}
                        <div className="relative w-[80px]">
                            <Input
                                type="number"
                                value={applicationRate}
                                onChange={(e) => onUpdateRate?.(id, Number(e.target.value))}
                                className={`${inputHeight} text-right pr-6 font-bold bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400`}
                            />
                            <span className="absolute right-2 top-3 text-xs text-slate-400">%</span>
                        </div>

                        <span className="text-slate-300 font-light text-lg">=</span>

                        {/* Total Result */}
                        <div className={`${resultTextSize} font-bold text-blue-600 tabular-nums tracking-tighter min-w-[100px] text-right`}>
                            {compactMoney(calculatedTotal)}
                        </div>

                        {secondaryFormulaText && (
                            <div className="basis-full text-xs text-slate-400 pl-1">
                                {secondaryFormulaText}
                            </div>
                        )}
                    </div>
                ) : (
                    // Fixed Mode: [적용률] × [금액] = [결과]
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Rate Input */}
                        <div className="relative w-[90px]">
                            <Input
                                type="number"
                                value={applicationRate}
                                onChange={(e) => onUpdateRate?.(id, Number(e.target.value))}
                                className={`${inputHeight} text-right pr-6 text-lg font-bold bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400`}
                            />
                            <span className="absolute right-2 top-3 text-xs text-slate-400">%</span>
                        </div>

                        <span className="text-slate-300 font-light text-lg">×</span>

                        {/* Amount Input */}
                        <div className="relative flex-1 min-w-[120px]">
                            <Input
                                type="text"
                                value={localValue}
                                onChange={(e) => setLocalValue(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                readOnly={calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)}
                                disabled={calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)}
                                className={`${inputHeight} text-right font-mono font-bold ${(calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)) ? 'bg-slate-50 text-slate-500' : 'bg-white'} focus:border-blue-400 focus:ring-blue-400`}
                                placeholder="0"
                            />
                        </div>

                        <span className="text-slate-300 font-light text-lg">=</span>

                        {/* Total Result */}
                        <div className={`${resultTextSize} font-bold text-blue-600 tabular-nums tracking-tighter min-w-[100px] text-right`}>
                            {compactMoney(calculatedTotal)}
                        </div>
                    </div>
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
                        />
                    ))}
                </div>
            )}

            {/* Add Sub-Item Button (Start or Append) */}
            {allowCategoryAdding && (
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
                    onUpdate(id, newAmount);
                }}
            />
            <PFInterestTemplate
                open={isPFInterestOpen}
                onOpenChange={setIsPFInterestOpen}
                itemName={name}
                currentAmount={amount}
                onSave={(newAmount) => {
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



