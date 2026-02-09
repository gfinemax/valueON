"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface ResultChartProps {
    data: {
        name: string;
        value: number;
        fill: string;
    }[];
    totalCost: number;
    hideTitle?: boolean;
}

export function ResultChart({ data, totalCost, hideTitle }: ResultChartProps) {
    const [hoveredData, setHoveredData] = useState<{ name: string; value: number } | null>(null);

    const formattedTotal = new Intl.NumberFormat("ko-KR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(totalCost);

    // Muted/Earthy tones for editorial look
    const COLORS = ['#d97757', '#8c9c8a', '#e3c086', '#6b7280', '#c2b280'];

    return (
        <div className="w-full h-full">
            {!hideTitle && <h3 className="text-base md:text-lg font-serif mb-4 text-stone-800 whitespace-nowrap">Cost Structure Analysis</h3>}
            <div className="h-[250px] md:h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="55%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            onMouseEnter={(_, index) => setHoveredData(data[index])}
                            onMouseLeave={() => setHoveredData(null)}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            wrapperStyle={{ fontSize: "12px", paddingTop: "20px", paddingBottom: "20px", color: "#57534e" }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-[32%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-300">
                    <div className="text-[10px] md:text-xs text-stone-500 font-serif mb-1">
                        {hoveredData ? hoveredData.name : 'Total Cost'}
                    </div>
                    <div className="text-lg md:text-xl font-serif text-stone-900">
                        {hoveredData
                            ? new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(hoveredData.value) + "원"
                            : formattedTotal + "원"
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
