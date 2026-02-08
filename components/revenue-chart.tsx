"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { AnalysisResult } from "@/types";

interface RevenueChartProps {
    data: NonNullable<AnalysisResult['unitPricing']>;
}

export function RevenueChart({ data }: RevenueChartProps) {
    // Sort logic 
    const sortedData = [...data].sort((a, b) => (b.revenueContribution || 0) - (a.revenueContribution || 0));

    // Colors for bars (editorial palette)
    const COLORS = ['#d97757', '#8c9c8a', '#e3c086', '#6b7280', '#c2b280'];

    return (
        <div className="w-full h-[300px]">
            <h3 className="text-lg font-serif mb-4 text-stone-800">Revenue Contribution by Type</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="unitName"
                        width={80}
                        tick={{ fontSize: 12, fill: '#57534e' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: '#f5f5f4' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(value: number) => new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value)}
                    />
                    <Bar dataKey="revenueContribution" radius={[0, 4, 4, 0]} barSize={32} isAnimationActive={true}>
                        {sortedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
