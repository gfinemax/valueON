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
import { Label } from "@/components/ui/label";

interface PFInterestTemplateProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    currentAmount: number;
    onSave: (amount: number, params: PFInterestParams) => void;
}

export interface PFInterestParams {
    principal: number;       // 대출원금
    interestRate: number;    // 연이자율 (%)
    durationMonths: number;  // 기간 (개월)
}

const RATE_PRESETS = [
    { label: '4%', rate: 4.0 },
    { label: '5%', rate: 5.0 },
    { label: '6%', rate: 6.0 },
    { label: '7%', rate: 7.0 },
    { label: '8%', rate: 8.0 },
];

const DURATION_PRESETS = [
    { label: '12개월', months: 12 },
    { label: '18개월', months: 18 },
    { label: '24개월', months: 24 },
    { label: '30개월', months: 30 },
    { label: '36개월', months: 36 },
];

export function PFInterestTemplate({
    open,
    onOpenChange,
    itemName,
    currentAmount,
    onSave,
}: PFInterestTemplateProps) {
    const [principal, setPrincipal] = useState<number>(0);
    const [interestRate, setInterestRate] = useState<number>(6.0);
    const [durationMonths, setDurationMonths] = useState<number>(24);

    // 계산된 이자 금액 (단순 이자 방식)
    const calculatedInterest = Math.round(principal * (interestRate / 100) * (durationMonths / 12));

    // 현재 금액에서 역산 (첫 로드시)
    useEffect(() => {
        if (open && currentAmount > 0) {
            // 기존 금액에서 역산: principal = interest / (rate * months/12)
            const estimatedPrincipal = Math.round(currentAmount / ((interestRate / 100) * (durationMonths / 12)));
            setPrincipal(estimatedPrincipal);
        }
    }, [open]);

    const handleSave = () => {
        onSave(calculatedInterest, {
            principal,
            interestRate,
            durationMonths,
        });
        onOpenChange(false);
    };

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR").format(val);

    const formatCompact = (val: number) =>
        new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(val);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        PF 이자 계산기
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-slate-700">{itemName}</span>의 이자 금액을 계산합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* 대출원금 입력 */}
                    <div className="space-y-2">
                        <Label htmlFor="principal" className="text-sm font-medium">대출원금</Label>
                        <div className="relative">
                            <Input
                                id="principal"
                                type="text"
                                value={formatMoney(principal)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setPrincipal(raw === '' ? 0 : parseInt(raw, 10));
                                }}
                                className="h-12 text-right text-lg font-bold pr-8"
                                placeholder="대출원금 입력"
                            />
                            <span className="absolute right-3 top-4 text-sm text-slate-400">원</span>
                        </div>
                        <p className="text-xs text-slate-400">= {formatCompact(principal)}원</p>
                    </div>

                    {/* 이자율 선택 */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">연이자율</Label>
                        <div className="flex gap-2">
                            {RATE_PRESETS.map((preset) => (
                                <button
                                    key={preset.rate}
                                    onClick={() => setInterestRate(preset.rate)}
                                    className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-all ${interestRate === preset.rate
                                            ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Input
                                type="number"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                                className="w-24 h-9 text-right font-mono"
                            />
                            <span className="text-sm text-slate-500">% (직접 입력)</span>
                        </div>
                    </div>

                    {/* 기간 선택 */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">대출 기간</Label>
                        <div className="flex gap-2">
                            {DURATION_PRESETS.map((preset) => (
                                <button
                                    key={preset.months}
                                    onClick={() => setDurationMonths(preset.months)}
                                    className={`flex-1 px-2 py-2 text-sm rounded-lg border transition-all ${durationMonths === preset.months
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Input
                                type="number"
                                value={durationMonths}
                                onChange={(e) => setDurationMonths(parseInt(e.target.value) || 0)}
                                className="w-24 h-9 text-right font-mono"
                            />
                            <span className="text-sm text-slate-500">개월 (직접 입력)</span>
                        </div>
                    </div>

                    {/* 계산 결과 미리보기 */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                        <p className="text-xs text-slate-500 mb-2">계산 결과 (단순이자)</p>
                        <div className="text-sm text-slate-600 mb-1">
                            {formatCompact(principal)}원 × {interestRate}% × ({durationMonths}개월 ÷ 12)
                        </div>
                        <div className="flex items-baseline justify-between">
                            <div className="text-sm text-slate-500">
                                예상 이자 금액
                            </div>
                            <div className="text-2xl font-bold text-amber-600">
                                {formatCompact(calculatedInterest)}원
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
                        적용하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
