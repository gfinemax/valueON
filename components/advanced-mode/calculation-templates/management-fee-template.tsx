"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnitType } from "@/types";

interface ManagementFeeTemplateProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    currentAmount: number;
    unitTypes: UnitType[];
    onSave: (amount: number, params: ManagementFeeParams) => void;
}

export interface ManagementFeeParams {
    feeByType: { typeId: string; feePerUnit: number }[];
}

export function ManagementFeeTemplate({
    open,
    onOpenChange,
    itemName,
    currentAmount,
    unitTypes,
    onSave,
}: ManagementFeeTemplateProps) {
    // 평형별 대행료 상태
    const [feeByType, setFeeByType] = useState<{ typeId: string; feePerUnit: number }[]>([]);

    // 초기화: unitTypes 기반으로 feeByType 생성
    useEffect(() => {
        if (open && unitTypes.length > 0) {
            // 기존 값이 없으면 현재 금액을 세대수로 나눠서 기본값 추정
            const totalUnits = unitTypes.reduce((sum, ut) => sum + (ut.totalUnits || 0), 0);
            const avgFee = totalUnits > 0 ? Math.round(currentAmount / totalUnits) : 15000000;

            setFeeByType(unitTypes.map(ut => ({
                typeId: ut.id,
                feePerUnit: avgFee,
            })));
        }
    }, [open, unitTypes]);

    // 총액 계산
    const calculateTotal = () => {
        let total = 0;
        feeByType.forEach(fee => {
            const unitType = unitTypes.find(ut => ut.id === fee.typeId);
            if (unitType) {
                total += fee.feePerUnit * (unitType.totalUnits || 0);
            }
        });
        return total;
    };

    const calculatedTotal = calculateTotal();

    const handleFeeChange = (typeId: string, value: number) => {
        setFeeByType(prev =>
            prev.map(fee =>
                fee.typeId === typeId ? { ...fee, feePerUnit: value } : fee
            )
        );
    };

    const handleSave = () => {
        onSave(calculatedTotal, { feeByType });
        onOpenChange(false);
    };

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR").format(val);

    const formatCompact = (val: number) =>
        new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(val);

    // 카테고리별 그룹핑
    const groupedTypes = unitTypes.reduce((acc, ut) => {
        const cat = ut.category || 'OTHER';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ut);
        return acc;
    }, {} as Record<string, UnitType[]>);

    const categoryLabels: Record<string, string> = {
        'APARTMENT': '아파트',
        'RENTAL': '임대주택',
        'OFFICETEL': '오피스텔',
        'OTHER': '기타',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        업무대행료 계산기
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-slate-700">{itemName}</span>을/를 평형별로 설정합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                    {Object.entries(groupedTypes).map(([category, types]) => (
                        <div key={category} className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {categoryLabels[category] || category}
                            </h4>
                            <div className="space-y-2">
                                {types.map(ut => {
                                    const feeData = feeByType.find(f => f.typeId === ut.id);
                                    const feePerUnit = feeData?.feePerUnit || 0;
                                    const subtotal = feePerUnit * (ut.totalUnits || 0);

                                    return (
                                        <div
                                            key={ut.id}
                                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                                        >
                                            {/* 평형 정보 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-700">{ut.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {ut.supplyArea}평 · {ut.totalUnits || 0}세대
                                                </div>
                                            </div>

                                            {/* 세대당 금액 입력 */}
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-slate-400">세대당</span>
                                                <Input
                                                    type="text"
                                                    value={formatMoney(feePerUnit)}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                                        handleFeeChange(ut.id, raw === '' ? 0 : parseInt(raw, 10));
                                                    }}
                                                    className="w-28 h-9 text-right font-bold text-sm"
                                                />
                                                <span className="text-xs text-slate-400">원</span>
                                            </div>

                                            {/* 소계 */}
                                            <div className="text-right min-w-[80px]">
                                                <div className="text-sm font-bold text-slate-700">
                                                    {formatCompact(subtotal)}원
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 총액 미리보기 */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex items-baseline justify-between">
                        <div className="text-sm text-slate-600">계산된 총액</div>
                        <div className="text-2xl font-bold text-indigo-600">
                            {formatCompact(calculatedTotal)}원
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        = Σ(평형별 세대당 금액 × 세대수)
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                        적용하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
