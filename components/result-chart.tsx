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

    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">비용 구조 분석</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) =>
                                    new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(value as number)
                                }
                            />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <div className="text-xs text-muted-foreground">총 사업비</div>
                        <div className="text-sm font-bold">{formattedTotal}원</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
