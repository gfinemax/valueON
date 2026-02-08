"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultChartProps {
    data: {
        name: string;
        value: number;
        fill: string;
    }[];
    totalCost: number;
}

export function ResultChart({ data, totalCost }: ResultChartProps) {
    const formattedTotal = new Intl.NumberFormat("ko-KR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(totalCost);

    // Muted/Earthy tones for editorial look
    const COLORS = ['#d97757', '#8c9c8a', '#e3c086', '#6b7280', '#c2b280'];

    return (
        <div className="w-full">
            <h3 className="text-lg font-serif mb-4 text-stone-800">비용 구조 분석</h3>
            <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            formatter={(value: number | undefined) =>
                                new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value || 0)
                            }
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: "12px", paddingTop: "20px", color: "#57534e" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-xs text-stone-500 font-serif mb-1">Total Cost</div>
                    <div className="text-xl font-serif text-stone-900">{formattedTotal}원</div>
                </div>
            </div>
        </div>
    );
}
