"use client";

import { UnitType, UnitAllocation, AnalysisResult } from "@/types";
import { formatKrwEok } from "@/utils/currency";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ClientOnlyChart } from "@/components/client-only-chart";
import { ManagementHeroSummary } from "@/components/management/management-hero-summary";

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
    'Misc': '#64748b',
};

const TIER_LABELS: Record<string, string> = {
    '1st': '1차 조합원',
    '2nd': '2차 조합원',
    'General': '일반분양',
    'Rental': '임대주택',
    'Misc': '기타수입',
};

function formatEok(amount: number) {
    return formatKrwEok(amount);
}

export function UnitMixStats({ unitTypes, allocations, unitPricing }: UnitMixStatsProps) {
    // Separate apartment and rental types
    const apartmentTypeIds = unitTypes.filter(u => u.category === 'APARTMENT').map(u => u.id);
    const rentalTypeIds = unitTypes.filter(u => u.category === 'RENTAL').map(u => u.id);
    const miscTypeIds = unitTypes.filter(u => u.category === 'MISC').map(u => u.id);

    // Calculate stats by tier (apartments only for tiers, rental as separate)
    const tierStats = (['1st', '2nd', 'General'] as const).map(tier => {
        const tierAllocations = allocations.filter(a =>
            a.tier === tier && apartmentTypeIds.includes(a.unitTypeId)
        );
        const totalCount = tierAllocations.reduce((sum, a) => sum + a.count, 0);

        let totalRevenue = 0;
        tierAllocations.forEach(alloc => {
            const pricing = unitPricing?.find(p => p.allocationId === alloc.id);
            if (pricing) {
                totalRevenue += pricing.totalPrice * alloc.count;
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
    const miscAllocations = allocations.filter(a => miscTypeIds.includes(a.unitTypeId));
    const miscCount = miscAllocations.reduce((sum, a) => sum + a.count, 0);
    let miscRevenue = 0;
    miscAllocations.forEach(alloc => {
        const ut = unitTypes.find(u => u.id === alloc.unitTypeId);
        if (ut && alloc.targetPricePerPyung) {
            miscRevenue += alloc.targetPricePerPyung * ut.supplyArea * alloc.count;
        }
    });
    const allStats = [
        ...tierStats,
        { tier: 'Rental', name: '임대주택', count: rentalCount, revenue: rentalRevenue, color: TIER_COLORS['Rental'] },
        { tier: 'Misc', name: '기타수입', count: miscCount, revenue: miscRevenue, color: TIER_COLORS['Misc'] },
    ];

    const totalUnits = tierStats.reduce((sum, s) => sum + s.count, 0) + rentalCount;
    const totalRevenue = allStats.reduce((sum, s) => sum + s.revenue, 0);
    const memberRevenue = tierStats
        .filter((stat) => stat.tier === "1st" || stat.tier === "2nd")
        .reduce((sum, stat) => sum + stat.revenue, 0);
    const marketRevenue = allStats
        .filter((stat) => stat.tier === "General" || stat.tier === "Rental" || stat.tier === "Misc")
        .reduce((sum, stat) => sum + stat.revenue, 0);
    const apartmentUnits = tierStats.reduce((sum, stat) => sum + stat.count, 0);

    const revenueData = allStats.map(s => ({
        name: s.name,
        value: s.revenue,
        color: s.color,
    }));

    return (
        <>
            <ManagementHeroSummary
                title="총 수입 예상"
                value={formatEok(totalRevenue)}
                description={`아파트 ${apartmentUnits}세대 / 임대 ${rentalCount}세대${miscCount > 0 ? ` / 기타 ${miscCount}건` : ""} 기준`}
                tone="positive"
                sticky
                items={[
                    {
                        label: "총 세대 구성",
                        value: `${totalUnits}세대`,
                        description: `전체 평형 ${unitTypes.filter((unitType) => unitType.category !== 'MISC').length}개 타입`,
                    },
                    {
                        label: "조합원 분담금",
                        value: formatEok(memberRevenue),
                        description: `${tierStats[0]?.count ?? 0}세대 + ${tierStats[1]?.count ?? 0}세대`,
                        tone: "accent",
                    },
                    {
                        label: "일반/임대 수입",
                        value: formatEok(marketRevenue),
                        description: `일반분양 ${tierStats[2]?.count ?? 0}세대 / 임대 ${rentalCount}세대${miscCount > 0 ? ` / 기타 ${miscCount}건` : ""}`,
                    },
                ]}
            />

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3">
                    <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                        <span className="h-6 w-1 rounded-full bg-emerald-500" />
                        수입 구성 분석
                    </h3>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="relative grid w-full min-w-0 flex-1 grid-cols-1 gap-x-8 gap-y-2 py-2 md:grid-cols-2">
                        {allStats.map((stat) => {
                            const percent = totalRevenue > 0 ? (stat.revenue / totalRevenue) * 100 : 0;

                            return (
                                <div key={stat.tier} className="border-b border-slate-100 pb-2">
                                    <div className="flex min-w-0 items-baseline gap-1.5">
                                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stat.color }} />
                                        <span className="truncate text-sm font-bold tracking-tight text-slate-700">{stat.name}</span>
                                        <span className="shrink-0 text-xs tracking-tight text-slate-500">{stat.count}{stat.tier === 'Misc' ? '건' : '세대'}</span>
                                        <span className="shrink-0 text-xs tracking-tight text-muted-foreground/50">{percent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative flex h-[170px] w-full shrink-0 justify-center px-6 lg:w-[240px]">
                        <ClientOnlyChart>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={revenueData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={72}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {revenueData.map((entry, index) => (
                                            <Cell key={`revenue-cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | string | (number | string)[] | undefined) => [
                                            formatEok(Number(value || 0)),
                                            "",
                                        ]}
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                        wrapperStyle={{ zIndex: 100 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </ClientOnlyChart>
                        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center">
                            <p className="text-[10px] font-bold tracking-tight text-muted-foreground">Total</p>
                            <p className="text-xs font-bold tracking-tight text-foreground">100%</p>
                        </div>
                    </div>
                </div>
            </section>
            <p className="-mt-2 text-xs text-slate-400">
                표시 금액은 억원 단위로 반올림되며, 정확값은 상세 항목 기준으로 계산됩니다.
            </p>
        </>
    );
}
