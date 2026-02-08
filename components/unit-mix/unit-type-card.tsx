"use client";

import { UnitType, UnitAllocation, AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatKoreanCurrency, parseKoreanMoney } from "@/utils/currency";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface UnitTypeCardProps {
    unitType: UnitType;
    allocations: UnitAllocation[];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number | string) => void;
    unitPricing?: AnalysisResult['unitPricing'];
    initialPayment?: number;
    totalRevenue?: number; // 전체 수입 (비율 계산용)
}

export function UnitTypeCard({
    unitType,
    allocations,
    onUpdateAllocation,
    unitPricing,
    initialPayment = 450000000,
    totalRevenue = 0
}: UnitTypeCardProps) {
    const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

    const toggleTier = (tier: string) => {
        setExpandedTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
    };

    const renderRow = (tier: '1st' | '2nd' | 'General', label: string, barColor: string, bgColor: string, textColor: string) => {
        const alloc = allocations.find(a => a.tier === tier);
        if (!alloc) return null;

        const pricing = unitPricing?.find(p => p.allocationId === alloc.id);

        // fixedTotalPrice 우선 사용 (모든 tier), 없으면 계산된 가격 사용
        const salesPrice = alloc.fixedTotalPrice
            ? alloc.fixedTotalPrice
            : (pricing ? pricing.totalPrice : 0);

        const tierRevenue = salesPrice * alloc.count;
        const isExpanded = expandedTiers[tier] || false;

        // 비율 계산
        const percentage = totalRevenue > 0 ? (tierRevenue / totalRevenue) * 100 : 0;

        // 추가분담금 계산 (1차 조합원만)
        const additionalContribution = tier === '1st' ? salesPrice - initialPayment : 0;

        return (
            <div className={`relative rounded-lg overflow-hidden ${bgColor} shadow-sm border border-slate-100`}>
                {/* Summary Row - 2 Line Layout */}
                <button
                    onClick={() => toggleTier(tier)}
                    className="w-full p-3 pl-5 hover:bg-black/5 transition-colors text-left"
                >
                    {/* Line 1: Tier + Count */}
                    <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-bold ${textColor}`}>
                            {label} <span className="text-slate-600 font-normal ml-1">{alloc.count}세대</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                    {/* Line 2: Percentage + Price */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 bg-white/50 px-1.5 py-0.5 rounded border border-slate-200">
                            {percentage.toFixed(1)}%
                        </span>
                        <span className="text-base font-bold text-slate-900">
                            {salesPrice > 0 ? formatKoreanCurrency(salesPrice) + '원' : '—'}
                        </span>
                    </div>
                </button>

                {/* Expandable Details */}
                {isExpanded && (
                    <div className="px-3 pb-3 pt-1 pl-5 border-t border-black/5 bg-white">
                        {/* 1차 조합원 - 초기분양가/추가분담금 표시 */}
                        {tier === '1st' && alloc.fixedTotalPrice && (
                            <div className="mb-3 p-2 bg-slate-50 rounded-md border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">초기 분양가</span>
                                    <span className="font-medium">{formatKoreanCurrency(initialPayment)}원</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-slate-600">추가 분담금</span>
                                    <span className="font-bold text-red-600">+{formatKoreanCurrency(additionalContribution)}원</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* Count */}
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">세대수</label>
                                <div className="flex items-center gap-1">
                                    <Input
                                        type="number"
                                        className="h-8 text-center text-sm font-medium bg-white"
                                        value={alloc.count}
                                        onChange={(e) => onUpdateAllocation(alloc.id, 'count', Number(e.target.value))}
                                    />
                                    <span className="text-xs text-slate-400">세대</span>
                                </div>
                            </div>

                            {/* Price Setting */}
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">고정 분양가</label>
                                <MoneyInput
                                    value={alloc.fixedTotalPrice || 0}
                                    onChange={(val) => onUpdateAllocation(alloc.id, 'fixedTotalPrice', val)}
                                />
                            </div>
                        </div>

                        {/* Memo - Full Width Below */}
                        <div className="mt-3">
                            <label className="text-xs text-slate-500 block mb-1">메모</label>
                            <Input
                                type="text"
                                placeholder="—"
                                className="h-8 text-sm bg-white"
                                value={alloc.note || ''}
                                onChange={(e) => onUpdateAllocation(alloc.id, 'note', e.target.value)}
                            />
                        </div>

                        {/* Total Revenue - Stacked Vertically */}
                        {tierRevenue > 0 && (
                            <div className="mt-3 pt-2 border-t border-black/10">
                                <div className="text-xs text-slate-500 mb-1">
                                    합계 ({alloc.count}세대 × {formatKoreanCurrency(salesPrice)})
                                </div>
                                <div className="text-lg font-bold text-blue-600 text-right">
                                    {formatKoreanCurrency(tierRevenue)}원
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    const getAccentColor = (name: string) => {
        if (name.includes('59')) return 'bg-emerald-500';
        if (name.includes('73') || name.includes('74')) return 'bg-blue-500';
        if (name.includes('84')) return 'bg-orange-500';
        if (name.includes('임대')) return 'bg-slate-400';
        return 'bg-violet-500';
    };

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm relative">
            {/* Card Header */}
            <CardHeader className="bg-white px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">{unitType.name}</h3>

                        <p className="text-xs text-slate-500 mt-0.5">
                            공급 {unitType.supplyArea}평 · 전용 {unitType.exclusiveAreaM2}m²
                        </p>
                    </div>
                </div>
            </CardHeader>

            {/* Accent Bar - Sleek Floating Pill */}
            <div className={`mx-4 mt-2 mb-4 h-3 rounded-full shadow-sm ${getAccentColor(unitType.name)}`} />

            {/* Card Body - Order: 1st → 2nd → General */}
            <CardContent className="p-3 space-y-2 bg-slate-50/50">
                {renderRow('1st', '1차 조합원', 'bg-emerald-500', 'bg-white', 'text-emerald-700')}
                {renderRow('2nd', '2차 조합원', 'bg-amber-500', 'bg-white', 'text-amber-700')}
                {renderRow('General', '일반분양', 'bg-blue-500', 'bg-white', 'text-blue-700')}
            </CardContent>
        </Card>
    );
}

function MoneyInput({ value, onChange }: { value: number, onChange: (val: number) => void }) {
    const [strVal, setStrVal] = useState(formatKoreanCurrency(value));

    const handleBlur = () => {
        const parsed = parseKoreanMoney(strVal);
        if (!isNaN(parsed)) {
            onChange(parsed);
            setStrVal(formatKoreanCurrency(parsed));
        } else {
            setStrVal(formatKoreanCurrency(value));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <Input
            className="h-8 text-right text-sm bg-white"
            value={strVal}
            onChange={(e) => setStrVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => setStrVal(value > 0 ? value.toString() : '')}
        />
    );
}
