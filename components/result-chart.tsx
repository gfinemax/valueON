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

    // Sort original data by value descending to ensure legend and slices are sorted by amount
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const formattedTotal = new Intl.NumberFormat("ko-KR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(totalCost);

    // Muted/Earthy tones for editorial look
    const COLORS = ['#d97757', '#8c9c8a', '#e3c086', '#6b7280', '#c2b280'];

    return (
        <div className="w-full h-full flex flex-col">
            {!hideTitle && <h3 className="text-sm md:text-base font-serif mb-4 text-stone-800 whitespace-nowrap">Cost Structure Analysis</h3>}
            <div className="h-[240px] md:h-[270px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sortedData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                            onMouseEnter={(_, index) => setHoveredData(sortedData[index])}
                            onMouseLeave={() => setHoveredData(null)}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        {/* Remove legacy Legend and use custom one below for guaranteed sorting */}
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute top-[50%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-all duration-300">
                    <div className="text-[9px] md:text-[10px] text-stone-400 font-serif mb-0.5">
                        {hoveredData ? hoveredData.name : 'Total Cost'}
                    </div>
                    <div className="text-base md:text-lg font-serif text-stone-800">
                        {hoveredData
                            ? new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(hoveredData.value) + "원"
                            : formattedTotal + "원"
                        }
                    </div>
                </div>
            </div>

            {/* Custom Sorted Legend */}
            <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1 px-2">
                {sortedData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 min-w-fit">
                        <div
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: entry.fill || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-[12px] md:text-[13px] text-stone-600 font-bold whitespace-nowrap">
                            {entry.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
