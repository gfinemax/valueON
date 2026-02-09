"use client";

import { useState, useEffect, useRef } from "react";
import { parseKoreanMoney, formatKoreanCurrency } from "@/utils/currency";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Settings, Pencil, Check, GripVertical } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { MixConditionDialog } from "./mix-condition-dialog";

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

    // Handle typing - only update local state (NOT parent)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow only numbers
        const raw = val.replace(/[^0-9]/g, '');
        // Format with commas for display
        const formatted = raw === "" ? "" : parseInt(raw, 10).toLocaleString();
        setLocalAmount(formatted);
    };

    // Update parent state only on blur
    const handleBlur = () => {
        const raw = localAmount.replace(/[^0-9]/g, '');
        const parsed = raw === "" ? 0 : parseInt(raw, 10);
        onUpdate(sub.id, 'amount', parsed);
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
    calculationBasis?: 'fixed' | 'per_unit' | 'per_site_pyung' | 'per_floor_pyung' | 'mix_linked';
    projectTarget?: ProjectTarget;
    mixConditions?: Record<string, number>;
    unitAllocations?: UnitAllocation[];
    unitTypes?: UnitType[];
    onUpdate: (id: string, newAmount: number) => void;
    onUpdateBasis: (id: string, basis: 'fixed' | 'per_unit' | 'per_site_pyung' | 'per_floor_pyung' | 'mix_linked') => void;
    onUpdateCondition?: (id: string, allocationId: string, amount: number) => void;
    onUpdateRate?: (id: string, rate: number) => void;
    onUpdateMemo?: (id: string, memo: string) => void;
    onRemove: (id: string) => void;

    applicationRate?: number;
    memo?: string;
    subItems?: { id: string; name: string; amount: number; note?: string }[];
    onAddSubItem?: (name: string, amount: number) => void;
    onUpdateSubItem?: (subId: string, field: 'name' | 'amount', value: string | number) => void;
    onRemoveSubItem?: (subId: string) => void;
    onUpdateSubItemMemo?: (subId: string, memo: string) => void;
    onUpdateName?: (id: string, newName: string) => void;
    dragAttributes?: any;
    dragListeners?: any;
    isHighlighted?: boolean;
    allowCategoryAdding?: boolean;
    allowItemDeleting?: boolean;
}

export function CostItemRow({
    id, name, amount, calculationBasis, projectTarget,
    mixConditions, unitAllocations, unitTypes,
    onUpdate, onUpdateBasis, onUpdateCondition, onUpdateRate, onUpdateMemo, onRemove, applicationRate = 100, memo,
    subItems = [], onAddSubItem, onUpdateSubItem, onRemoveSubItem, onUpdateSubItemMemo, onUpdateName,
    dragAttributes, dragListeners, isHighlighted,
    allowCategoryAdding = true,
    allowItemDeleting = true,
}: CostItemRowProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [localValue, setLocalValue] = useState(new Intl.NumberFormat("ko-KR").format(amount));
    const [isMixDialogOpen, setIsMixDialogOpen] = useState(false);
    const [isSubItemsOpen, setIsSubItemsOpen] = useState(subItems && subItems.length > 0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState(name);
    const [editMemo, setEditMemo] = useState(memo || "");

    // Scroll into view when highlighted from search
    useEffect(() => {
        if (isHighlighted && rowRef.current) {
            setTimeout(() => {
                rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300); // Give time for category to expand
        }
    }, [isHighlighted]);

    useEffect(() => {
        if (subItems && subItems.length > 0) {
            setIsSubItemsOpen(true);
        }
    }, [subItems?.length]);

    useEffect(() => {
        setLocalValue(new Intl.NumberFormat("ko-KR").format(amount));
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
            setLocalValue(new Intl.NumberFormat("ko-KR").format(parsed));
        } else {
            if (parsed === 0) {
                onUpdate(id, 0);
                setLocalValue("0");
            } else {
                setLocalValue(new Intl.NumberFormat("ko-KR").format(amount));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }

    const formatMoney = (val: number) => new Intl.NumberFormat("ko-KR").format(val);
    const compactMoney = (val: number) => new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(val);

    // Calculate formula display
    let formulaText = "";
    let calculatedTotal = 0;

    if (projectTarget && calculationBasis && calculationBasis !== 'fixed') {
        const basisValue =
            calculationBasis === 'per_unit' ? projectTarget.totalHouseholds :
                calculationBasis === 'per_site_pyung' ? projectTarget.totalLandArea :
                    calculationBasis === 'per_floor_pyung' ? projectTarget.totalFloorArea : 0;

        const basisLabel =
            calculationBasis === 'per_unit' ? "세대" :
                calculationBasis === 'per_site_pyung' ? "대지평" :
                    calculationBasis === 'per_floor_pyung' ? "연면적평" : "";

        calculatedTotal = amount * basisValue * (applicationRate / 100);

        // formulaText = `(${basisValue.toLocaleString()}${basisLabel} × ${formatMoney(amount)}원 × ${applicationRate}%)`;
    } else {
        // Fixed or default
        calculatedTotal = amount * (applicationRate / 100);
        // formulaText = `(${formatMoney(amount)}원 × ${applicationRate}%)`;
    }

    const basisOptions = [
        { value: 'fixed', label: '고정', color: 'bg-slate-100 border-slate-300 text-slate-800' },
        { value: 'per_site_pyung', label: '대지평당', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        { value: 'per_floor_pyung', label: '연면적평당', color: 'bg-blue-50 border-blue-200 text-blue-700' },
        { value: 'per_unit', label: '세대당', color: 'bg-purple-50 border-purple-200 text-purple-700' },
    ] as const;

    return (
        <div
            ref={rowRef}
            className={`py-4 border-b border-dashed border-slate-200 last:border-0 hover:bg-slate-50/50 transition-colors rounded-lg px-3 -mx-2 ${isHighlighted ? 'animate-highlight-pulse ring-2 ring-yellow-400 bg-yellow-50' : ''}`}
        >

            {/* 1. Header Row: Name + Edit/Delete Buttons (Right) */}
            <div className="flex items-center justify-between gap-2 mb-3">
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
                    <div className="font-bold text-slate-800 text-lg tracking-tight flex-1">
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
                                                정말로 '{name}' 항목을 삭제하시겠습니까?
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
                <div className="mb-3">
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

            {/* 2. Basis Row: Basis Selection Only */}
            <div className="flex gap-1 flex-wrap mb-3">
                {basisOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onUpdateBasis(id, option.value)}
                        className={`
                            text-xs px-3 py-1.5 rounded-md border font-bold transition-all
                            ${(!calculationBasis && option.value === 'fixed') || calculationBasis === option.value
                                ? option.color
                                : 'border-transparent text-slate-400 bg-transparent hover:bg-slate-200'}
                        `}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* 3. Calculation Row: Rate * Amount = Total */}
            <div className="flex flex-wrap items-center gap-2 mb-3 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">

                {/* Rate Input */}
                <div className="relative w-[90px]">
                    <Input
                        type="number"
                        value={applicationRate}
                        onChange={(e) => onUpdateRate?.(id, Number(e.target.value))}
                        className="h-10 text-right pr-6 text-lg font-bold bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
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
                        className={`h-9 text-right font-mono font-bold ${(calculationBasis === 'mix_linked' || (subItems && subItems.length > 0)) ? 'bg-slate-50 text-slate-500' : 'bg-white'} focus:border-blue-400 focus:ring-blue-400`}
                        placeholder="0"
                    />
                </div>

                <span className="text-slate-300 font-light text-lg">=</span>

                {/* Total Result */}
                <div className="text-xl font-bold text-blue-600 tabular-nums tracking-tighter min-w-[100px] text-right">
                    {compactMoney(calculatedTotal)}원
                </div>
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
                <div className="pl-2 pr-2 pb-2 space-y-2 border-l-2 border-slate-100 ml-2 mb-4">
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
        </div>
    );
}
