import { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultChart } from "./result-chart";
import { PricingResultTable } from "./unit-mix/pricing-result-table";

interface SummaryDashboardProps {
    result: AnalysisResult;
}

export function SummaryDashboard({ result }: SummaryDashboardProps) {
    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            maximumFractionDigits: 0,
        }).format(val);

    return (
        <div className="space-y-4">
            {/* 1. Key Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium text-slate-500">
                            총 사업비
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <div className="text-base font-bold text-slate-800 truncate">
                            {formatMoney(result.totalProjectCost)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium text-slate-500">
                            예상 평당 원가
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        <div className="text-base font-bold text-slate-800 truncate">
                            {formatMoney(result.costPerPyung)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Unit Pricing Result (New) */}
            {result.unitPricing && result.unitPricing.length > 0 ? (
                <PricingResultTable pricing={result.unitPricing} />
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {/* Legacy Simple View */}
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm font-medium text-slate-500">
                                59 타입
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-lg font-bold text-[#1a365d]">
                                {formatMoney(result.estimatedPrices.type59)}
                            </div>
                            <p className="text-xs text-muted-foreground">예상 분담금</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-sm font-medium text-slate-500">
                                84 타입
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-1">
                            <div className="text-lg font-bold text-[#1a365d]">
                                {formatMoney(result.estimatedPrices.type84)}
                            </div>
                            <p className="text-xs text-muted-foreground">예상 분담금</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <ResultChart
                data={result.costBreakdown}
                totalCost={result.totalProjectCost}
            />
        </div>
    );
}
