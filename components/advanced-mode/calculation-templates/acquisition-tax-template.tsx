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

interface AcquisitionTaxTemplateProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string;
    currentAmount: number;
    onSave: (amount: number, params: AcquisitionTaxParams) => void;
}

export interface AcquisitionTaxParams {
    purchasePrice: number;    // 매입가액
    taxRate: number;          // 세율 (%)
    registrationRate: number; // 등록세율 (%)
}

const TAX_PRESETS = [
    { label: '일반 (4.6%)', taxRate: 4.0, registrationRate: 0.6 },
    { label: '중과세 (12.4%)', taxRate: 10.0, registrationRate: 2.4 },
    { label: '농지 (3.4%)', taxRate: 3.0, registrationRate: 0.4 },
];

export function AcquisitionTaxTemplate({
    open,
    onOpenChange,
    itemName,
    currentAmount,
    onSave,
}: AcquisitionTaxTemplateProps) {
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(4.0);
    const [registrationRate, setRegistrationRate] = useState<number>(0.6);
    const [selectedPreset, setSelectedPreset] = useState<number>(0);

    // 계산된 금액
    const totalRate = taxRate + registrationRate;
    const calculatedAmount = Math.round(purchasePrice * (totalRate / 100));

    // 현재 금액에서 역산 (첫 로드시)
    useEffect(() => {
        if (open && currentAmount > 0) {
            // 기존 금액에서 역산: purchasePrice = amount / rate
            const estimatedPrice = Math.round(currentAmount / (totalRate / 100));
            setPurchasePrice(estimatedPrice);
        }
    }, [open]);

    const handlePresetSelect = (index: number) => {
        setSelectedPreset(index);
        setTaxRate(TAX_PRESETS[index].taxRate);
        setRegistrationRate(TAX_PRESETS[index].registrationRate);
    };

    const handleSave = () => {
        onSave(calculatedAmount, {
            purchasePrice,
            taxRate,
            registrationRate,
        });
        onOpenChange(false);
    };

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR").format(val);

    const formatCompact = (val: number) =>
        new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(val);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-xl">📋</span>
                        취득세/등록세 계산기
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-slate-700">{itemName}</span>의 금액을 계산합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* 세율 프리셋 */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">세율 프리셋</Label>
                        <div className="flex gap-2">
                            {TAX_PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handlePresetSelect(idx)}
                                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${selectedPreset === idx
                                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 매입가액 입력 */}
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice" className="text-sm font-medium">매입가액</Label>
                        <div className="relative">
                            <Input
                                id="purchasePrice"
                                type="text"
                                value={formatMoney(purchasePrice)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    setPurchasePrice(raw === '' ? 0 : parseInt(raw, 10));
                                }}
                                className="h-12 text-right text-lg font-bold pr-8"
                                placeholder="매입가액 입력"
                            />
                            <span className="absolute right-3 top-4 text-sm text-slate-400">원</span>
                        </div>
                        <p className="text-xs text-slate-400">= {formatCompact(purchasePrice)}원</p>
                    </div>

                    {/* 세율 직접 입력 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxRate" className="text-sm font-medium">취득세율 (%)</Label>
                            <Input
                                id="taxRate"
                                type="number"
                                step="0.1"
                                value={taxRate}
                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                className="h-10 text-right font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registrationRate" className="text-sm font-medium">등록세율 (%)</Label>
                            <Input
                                id="registrationRate"
                                type="number"
                                step="0.1"
                                value={registrationRate}
                                onChange={(e) => setRegistrationRate(parseFloat(e.target.value) || 0)}
                                className="h-10 text-right font-mono"
                            />
                        </div>
                    </div>

                    {/* 계산 결과 미리보기 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-slate-500 mb-2">계산 결과</p>
                        <div className="flex items-baseline justify-between">
                            <div className="text-sm text-slate-600">
                                {formatCompact(purchasePrice)}원 × {totalRate.toFixed(1)}%
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCompact(calculatedAmount)}원
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        취소
                    </Button>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        적용하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
