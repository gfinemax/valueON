"use client";

import { AnalysisResult } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingResultTableProps {
    pricing: AnalysisResult['unitPricing'];
}

export function PricingResultTable({ pricing }: PricingResultTableProps) {
    if (!pricing || pricing.length === 0) return null;

    // Sort by Unit Name then Tier for better readability
    const sortedPricing = [...pricing].sort((a, b) => {
        if (a.unitName !== b.unitName) return a.unitName.localeCompare(b.unitName);
        // Custom tier order: 1st < 2nd < General
        const tierOrder = { "1st": 1, "2nd": 2, "General": 3 };
        return (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
    });

    const formatMoney = (val: number) => {
        // e.g. 5.5억 or 5억 5천
        // Use simplified format for table
        const unit = 100000000;
        const eok = Math.floor(val / unit);
        const thousands = Math.round((val % unit) / 10000);

        if (eok > 0) return `${eok}억 ${thousands > 0 ? thousands.toLocaleString() : ""}만`;
        return `${thousands.toLocaleString()}만`;
    };

    return (
        <Card>
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold text-slate-700">📌 예상 분양가 산출 결과</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="text-xs">타입</TableHead>
                            <TableHead className="text-xs">구분</TableHead>
                            <TableHead className="text-right text-xs">예상 분양가</TableHead>
                            <TableHead className="text-right text-xs">평당가</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedPricing.map((item) => (
                            <TableRow key={item.allocationId}>
                                <TableCell className="font-medium text-xs">{item.unitName}</TableCell>
                                <TableCell className="text-xs">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.tier === '1st' ? 'bg-blue-100 text-blue-700' :
                                            item.tier === '2nd' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {item.tier === '1st' ? "1차" : item.tier === '2nd' ? "2차" : "일반"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-xs text-slate-800">
                                    {formatMoney(item.totalPrice)}
                                </TableCell>
                                <TableCell className="text-right text-[10px] text-slate-500">
                                    {(item.pricePerPyung / 10000).toLocaleString()}만
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
