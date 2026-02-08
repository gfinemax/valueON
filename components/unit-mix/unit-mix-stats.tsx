"use client";

import { UnitType, UnitAllocation, AnalysisResult } from "@/types";
import { formatKoreanCurrency } from "@/utils/currency";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface UnitMixStatsProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    unitPricing?: AnalysisResult['unitPricing'];
}

// 아파트 tier colors
const TIER_COLORS: Record<string, string> = {
    '1st': '#10b981',   // emerald
    '2nd': '#f59e0b',   // amber
    'General': '#3b82f6', // blue
    'Rental': '#8b5cf6', // purple for rental
};

const TIER_LABELS: Record<string, string> = {
    '1st': '1차 조합원',
    '2nd': '2차 조합원',
    'General': '일반분양',
    'Rental': '임대주택',
};

export function UnitMixStats({ unitTypes, allocations, unitPricing }: UnitMixStatsProps) {
    // Separate apartment and rental types
    const apartmentTypeIds = unitTypes.filter(u => u.category === 'APARTMENT').map(u => u.id);
    const rentalTypeIds = unitTypes.filter(u => u.category === 'RENTAL').map(u => u.id);

    // Calculate stats by tier (apartments only for tiers, rental as separate)
    const tierStats = (['1st', '2nd', 'General'] as const).map(tier => {
        const tierAllocations = allocations.filter(a =>
            a.tier === tier && apartmentTypeIds.includes(a.unitTypeId)
        );
        const totalCount = tierAllocations.reduce((sum, a) => sum + a.count, 0);

        let totalRevenue = 0;
        tierAllocations.forEach(alloc => {
            // fixedTotalPrice 우선 사용 (모든 tier)
            if (alloc.fixedTotalPrice) {
                totalRevenue += alloc.fixedTotalPrice * alloc.count;
            } else {
                const pricing = unitPricing?.find(p => p.allocationId === alloc.id);
                if (pricing) {
                    totalRevenue += pricing.totalPrice * alloc.count;
                }
            }
        });

        return {
            tier,
            name: TIER_LABELS[tier],
            count: totalCount,
            revenue: totalRevenue,
            color: TIER_COLORS[tier],
        };
    });

    // Add rental stats
    const rentalAllocations = allocations.filter(a => rentalTypeIds.includes(a.unitTypeId));
    const rentalCount = rentalAllocations.reduce((sum, a) => sum + a.count, 0);
    let rentalRevenue = 0;
    rentalAllocations.forEach(alloc => {
        const ut = unitTypes.find(u => u.id === alloc.unitTypeId);
        if (ut && alloc.targetPricePerPyung) {
            rentalRevenue += alloc.targetPricePerPyung * ut.supplyArea * alloc.count;
        }
    });

    const allStats = [
        ...tierStats,
        { tier: 'Rental', name: '임대주택', count: rentalCount, revenue: rentalRevenue, color: TIER_COLORS['Rental'] }
    ];

    const totalUnits = allStats.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = allStats.reduce((sum, s) => sum + s.revenue, 0);

    const countData = allStats.map(s => ({
        name: s.name,
        value: s.count,
        color: s.color,
    }));

    const revenueData = allStats.map(s => ({
        name: s.name,
        value: s.revenue,
        color: s.color,
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* 세대 구성 차트 */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">세대 구성</h4>
                    <span className="text-xs text-slate-300">총 {totalUnits}세대</span>
                </div>
                <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={countData}
                                cx="50%"
                                cy="50%"
                                innerRadius={20}
                                outerRadius={45}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {countData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [`${value}세대`, '']}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                    {allStats.map(s => (
                        <div key={s.tier} className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-slate-300">{s.name}</span>
                            <span className="font-bold text-white">{s.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 분양가 총액 차트 */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">분양가 총액</h4>
                    <span className="text-xs text-slate-300">총 {formatKoreanCurrency(totalRevenue)}원</span>
                </div>
                <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueData}
                                cx="50%"
                                cy="50%"
                                innerRadius={20}
                                outerRadius={45}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {revenueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [formatKoreanCurrency(Number(value)) + '원', '']}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2">
                    {allStats.map(s => (
                        <div key={s.tier} className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-slate-300">{s.name}</span>
                            <span className="font-bold text-white">{formatKoreanCurrency(s.revenue)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
