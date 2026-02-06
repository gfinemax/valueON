"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { UnitType, UnitAllocation } from "@/types";
import { formatKoreanCurrency, parseKoreanMoney } from "@/utils/currency";
import { useState } from "react";

interface UnitMixTableProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    onUpdateAllocation: (id: string, field: keyof UnitAllocation, value: number) => void;
}

export function UnitMixTable({ unitTypes, allocations, onUpdateAllocation }: UnitMixTableProps) {

    const handleMoneyChange = (id: string, field: keyof UnitAllocation, valueStr: string) => {
        const val = parseKoreanMoney(valueStr);
        if (!isNaN(val)) {
            onUpdateAllocation(id, field, val);
        }
    };

    // Group allocations by Tier
    const renderTierRows = (tier: '1st' | '2nd' | 'General', label: string) => {
        const tierAllocations = allocations.filter(a => a.tier === tier);

        return tierAllocations.map((alloc) => {
            const unitType = unitTypes.find(u => u.id === alloc.unitTypeId);
            if (!unitType) return null;

            return (
                <TableRow key={alloc.id}>
                    <TableCell className="font-medium text-xs">
                        {label} - {unitType.name}
                        <div className="text-[10px] text-gray-400">{unitType.supplyArea}평</div>
                    </TableCell>

                    {/* Count Input */}
                    <TableCell>
                        <Input
                            type="number"
                            className="h-8 w-16 text-right text-xs"
                            value={alloc.count}
                            onChange={(e) => onUpdateAllocation(alloc.id, 'count', Number(e.target.value))}
                        />
                    </TableCell>

                    {/* Extra Input (Premium or Target Price) */}
                    <TableCell className="text-right">
                        {tier === '2nd' && (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 mb-1">프리미엄</span>
                                <MoneyInput
                                    value={alloc.premium || 0}
                                    onChange={(val) => onUpdateAllocation(alloc.id, 'premium', val)}
                                />
                            </div>
                        )}
                        {tier === 'General' && (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 mb-1">목표 평당가</span>
                                <MoneyInput
                                    value={alloc.targetPricePerPyung || 0}
                                    onChange={(val) => onUpdateAllocation(alloc.id, 'targetPricePerPyung', val)}
                                />
                            </div>
                        )}
                        {tier === '1st' && <span className="text-xs text-gray-400">-</span>}
                    </TableCell>
                </TableRow>
            );
        });
    };

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[40%] text-xs">구분</TableHead>
                        <TableHead className="w-[20%] text-xs text-center">세대수</TableHead>
                        <TableHead className="text-right text-xs">설정 (원)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {renderTierRows('General', '일반분양')}
                    {renderTierRows('1st', '1차 조합')}
                    {renderTierRows('2nd', '2차 조합')}
                </TableBody>
            </Table>
        </div>
    );
}

// Helper input for money with Korean format tooltip/placeholder logic could go here
// For simplicity reusing basic Input but could enhance later
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

    return (
        <div className="w-full">
            <Input
                className="h-8 text-right text-xs"
                value={strVal}
                onChange={(e) => setStrVal(e.target.value)}
                onBlur={handleBlur}
            />
            <div className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                {value.toLocaleString()} 원
            </div>
        </div>
    );
}
