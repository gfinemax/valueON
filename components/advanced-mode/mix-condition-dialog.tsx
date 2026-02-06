"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitAllocation, UnitType } from "@/types";
import { formatKoreanCurrency, parseKoreanMoney } from "@/utils/currency";

interface MixConditionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    allocations: UnitAllocation[];
    unitTypes: UnitType[];
    currentConditions: Record<string, number>; // allocationId -> amount
    onSave: (conditions: Record<string, number>) => void;
}

export function MixConditionDialog({
    open,
    onOpenChange,
    itemName,
    allocations,
    unitTypes,
    currentConditions,
    onSave,
}: MixConditionDialogProps) {
    const [localConditions, setLocalConditions] = useState<Record<string, number>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setLocalConditions(currentConditions || {});
            // Initialize inputs
            const initialInputs: Record<string, string> = {};
            allocations.forEach(alloc => {
                const val = currentConditions?.[alloc.id] || 0;
                initialInputs[alloc.id] = formatKoreanCurrency(val);
            });
            setInputValues(initialInputs);
        }
    }, [open, currentConditions, allocations]);

    const handleInputChange = (id: string, value: string) => {
        setInputValues(prev => ({ ...prev, [id]: value }));
    };

    const handleBlur = (id: string) => {
        const raw = inputValues[id];
        const parsed = parseKoreanMoney(raw);

        // Update numeric state
        setLocalConditions(prev => ({ ...prev, [id]: parsed }));

        // Formatting
        const formatted = parsed === 0 && raw !== "0" && raw !== "" ? "0" : formatKoreanCurrency(parsed);
        setInputValues(prev => ({ ...prev, [id]: formatted }));
    };

    const handleSave = () => {
        onSave(localConditions);
        onOpenChange(false);
    };

    const getUnitTypeName = (typeId: string) => unitTypes.find(u => u.id === typeId)?.name || "?";

    // Calculate total preview
    const totalPreview = allocations.reduce((acc, alloc) => {
        const amount = localConditions[alloc.id] || 0;
        return acc + (amount * alloc.count);
    }, 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-[400px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>차등 비용 설정 ({itemName})</DialogTitle>
                    <DialogDescription>
                        타입 및 차수별로 적용할 단가를 입력하세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        {allocations.map((alloc) => {
                            const typeName = getUnitTypeName(alloc.unitTypeId);
                            const tierLabel = alloc.tier === '1st' ? '1차' : alloc.tier === '2nd' ? '2차' : '일반';
                            const labelColor = alloc.tier === 'General' ? 'text-gray-500' : 'text-blue-600 font-medium';

                            return (
                                <div key={alloc.id} className="flex items-center justify-between gap-2">
                                    <div className="flex flex-col text-sm">
                                        <span className={`${labelColor}`}>{typeName} ({tierLabel})</span>
                                        <span className="text-xs text-slate-400">{alloc.count}세대</span>
                                    </div>
                                    <div className="w-32">
                                        <Input
                                            className="text-right h-8 text-sm"
                                            value={inputValues[alloc.id] || ""}
                                            onChange={(e) => handleInputChange(alloc.id, e.target.value)}
                                            onBlur={() => handleBlur(alloc.id)}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700">총 합계 적용액</span>
                        <span className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(totalPreview)}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
                    <Button onClick={handleSave}>설정 저장</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
