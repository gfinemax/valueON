"use client";

import { useState, useEffect } from "react";
import { parseKoreanMoney, formatKoreanCurrency } from "@/utils/currency";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Settings } from "lucide-react";
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
import { ProjectTarget, UnitAllocation, UnitType } from "@/types";
import { MixConditionDialog } from "./mix-condition-dialog";

interface CostItemRowProps {
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
    onRemove: (id: string) => void;
}

export function CostItemRow({
    id, name, amount, calculationBasis, projectTarget,
    mixConditions, unitAllocations, unitTypes,
    onUpdate, onUpdateBasis, onUpdateCondition, onRemove
}: CostItemRowProps) {
    const [localValue, setLocalValue] = useState(formatKoreanCurrency(amount));
    const [isMixDialogOpen, setIsMixDialogOpen] = useState(false);

    useEffect(() => {
        setLocalValue(formatKoreanCurrency(amount));
    }, [amount]);

    const handleMixSave = (conditions: Record<string, number>) => {
        if (onUpdateCondition) {
            Object.entries(conditions).forEach(([allocId, val]) => {
                onUpdateCondition(id, allocId, val);
            });
        }
    };

    const handleBlur = () => {
        const parsed = parseKoreanMoney(localValue);
        if (!isNaN(parsed) && parsed !== 0) {
            onUpdate(id, parsed);
            setLocalValue(formatKoreanCurrency(parsed));
        } else {
            if (parsed === 0) {
                onUpdate(id, 0);
                setLocalValue("0");
            } else {
                setLocalValue(formatKoreanCurrency(amount));
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    }

    const formatMoney = (val: number) => new Intl.NumberFormat("ko-KR").format(val);

    // Calculate formula display
    let formulaText = "";
    if (projectTarget && calculationBasis && calculationBasis !== 'fixed') {
        const basisValue =
            calculationBasis === 'per_unit' ? projectTarget.totalHouseholds :
                calculationBasis === 'per_site_pyung' ? projectTarget.totalLandArea :
                    calculationBasis === 'per_floor_pyung' ? projectTarget.totalFloorArea : 0;

        const basisLabel =
            calculationBasis === 'per_unit' ? "세대" :
                calculationBasis === 'per_site_pyung' ? "평(대지)" :
                    calculationBasis === 'per_floor_pyung' ? "평(연면적)" : "";

        const calculatedTotal = amount * basisValue;

        formulaText = `(${basisValue.toLocaleString()}${basisLabel} × ${formatMoney(amount)}원 = ${new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(calculatedTotal)}원)`;
    }

    return (
        <div className="flex items-center gap-2 py-3 text-sm border-b last:border-0 border-slate-100">
            <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-700 truncate">{name}</div>
                {/* Basis Toggle */}
                <div className="flex gap-1 mt-1.5 flex-wrap">
                    <button
                        onClick={() => onUpdateBasis(id, 'fixed')}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${!calculationBasis || calculationBasis === 'fixed'
                            ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold'
                            : 'border-transparent text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        고정
                    </button>
                    <button
                        onClick={() => onUpdateBasis(id, 'per_site_pyung')}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${calculationBasis === 'per_site_pyung'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                            : 'border-transparent text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        대지평당
                    </button>
                    <button
                        onClick={() => onUpdateBasis(id, 'per_floor_pyung')}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${calculationBasis === 'per_floor_pyung'
                            ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold'
                            : 'border-transparent text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        연면적평당
                    </button>
                    <button
                        onClick={() => onUpdateBasis(id, 'per_unit')}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-colors ${calculationBasis === 'per_unit'
                            ? 'bg-green-50 border-green-200 text-green-700 font-bold'
                            : 'border-transparent text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        세대당
                    </button>
                </div>
            </div>

            <div className="w-32 flex flex-col items-end">
                <div className="relative w-full">
                    <Input
                        type="text"
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="h-9 text-right pr-2 text-sm"
                        placeholder="0"
                    />
                </div>
                {formulaText ? (
                    <div className="text-[10px] text-blue-600 text-right mt-1 font-medium whitespace-nowrap">
                        {formulaText}
                    </div>
                ) : (
                    <div className="text-[10px] text-gray-400 text-right mt-1">
                        {formatMoney(amount)} 원
                    </div>
                )}
            </div>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-red-300 hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
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
                        <AlertDialogAction
                            onClick={() => onRemove(id)}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-600"
                        >
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
        </div>
    );
}
