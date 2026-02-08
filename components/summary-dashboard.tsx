import { AnalysisResult } from "@/types";
import { ResultChart } from "./result-chart";
import { PricingResultTable } from "./unit-mix/pricing-result-table";
import { RevenueChart } from "./revenue-chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface SummaryDashboardProps {
    result: AnalysisResult;
}

// CountUp Component for animated numbers
function CountUp({ end, duration = 2000, suffix = "" }: { end: number, duration?: number, suffix?: string }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - percentage, 4);

            setCount(Math.floor(end * ease));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return (
        <span>
            {new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(count)}
            {suffix}
        </span>
    );
}

// Helper function for profit calculation
function calculateNetProfit(result: AnalysisResult) {
    const profit = (result.totalRevenue || 0) - result.totalProjectCost;
    const profitMargin = (result.totalRevenue || 0) > 0
        ? (profit / (result.totalRevenue || 0)) * 100
        : 0;
    return { profit, profitMargin };
}

export function SummaryDashboard({ result }: SummaryDashboardProps) {
    const { profit, profitMargin } = calculateNetProfit(result);
    const [isCostDetailOpen, setIsCostDetailOpen] = useState(false);
    const [isRevenueDetailOpen, setIsRevenueDetailOpen] = useState(false);
    const costDetailRef = useRef<HTMLDivElement>(null);
    const detailsSectionRef = useRef<HTMLDivElement>(null);
    const revenueDetailRef = useRef<HTMLDivElement>(null);

    const [hoveredBar, setHoveredBar] = useState<{
        value: number;
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    const formatMoney = (val: number) => {
        if (Math.abs(val) >= 100000000) {
            return new Intl.NumberFormat("ko-KR", {
                maximumFractionDigits: 1,
            }).format(val / 100000000) + "억원";
        }
        return new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            maximumFractionDigits: 0,
        }).format(val);
    };

    useEffect(() => {
        if (isCostDetailOpen && detailsSectionRef.current) {
            setTimeout(() => {
                detailsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 400);
        }
    }, [isCostDetailOpen]);

    useEffect(() => {
        if (isRevenueDetailOpen && revenueDetailRef.current) {
            setTimeout(() => {
                revenueDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 400);
        }
    }, [isRevenueDetailOpen]);

    const sortedUnits = [...(result.unitPricing || [])].sort((a, b) => (b.revenueContribution || 0) - (a.revenueContribution || 0));
    const topUnit = sortedUnits[0];
    const topUnitShare = (result.totalRevenue && topUnit?.revenueContribution) ? (topUnit.revenueContribution / result.totalRevenue) * 100 : 0;

    const landCost = result.costBreakdown.find(c => c.name.includes("토지"))?.value || 0;
    const constCost = result.costBreakdown.find(c => c.name.includes("공사"))?.value || 0;
    const majorCostName = landCost > constCost ? "Land Acquisition" : "Construction";
    const majorCostValue = Math.max(landCost, constCost);
    const majorCostShare = result.totalProjectCost ? (majorCostValue / result.totalProjectCost) * 100 : 0;

    const overviewData = [
        { name: "Total Revenue", value: result.totalRevenue || 0, fill: "#8c9c8a" },
        { name: "Total Cost", value: result.totalProjectCost, fill: "#d97757" },
    ];

    return (
        <div className="space-y-6 md:space-y-24 py-4 md:py-12">
            {/* Mobile Metrics */}
            <div className="grid grid-cols-2 gap-3 md:hidden mb-6">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Net Profit</div>
                    <div className={`text-xl font-serif font-bold ${profit >= 0 ? 'text-[#8c9c8a]' : 'text-[#d97757]'}`}>
                        {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                    </div>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Safe Margin</div>
                    <div className="text-xl font-serif font-bold text-stone-700">
                        {profitMargin.toFixed(1)}%
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Revenue</div>
                    <div className="text-lg font-serif text-stone-800">{formatMoney(result.totalRevenue || 0)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Cost</div>
                    <div className="text-lg font-serif text-stone-800">{formatMoney(result.totalProjectCost)}</div>
                </div>
            </div>

            {/* Section 1: Profit Overview */}
            <ScrollReveal>
                <section>
                    <div className="flex flex-col gap-6 md:gap-8">
                        <div className="hidden md:block">
                            <h2 className="text-4xl font-serif text-stone-900 mb-4 tracking-tight leading-tight">Safe Margin Secured</h2>
                            <p className="text-stone-600 text-lg leading-relaxed max-w-3xl mb-2">
                                This project is projected to generate a net profit of <strong className="text-emerald-700 font-semibold">{formatMoney(profit)}</strong>,
                                representing a <strong className="text-emerald-700 font-semibold">{profitMargin.toFixed(1)}% safe margin</strong>.
                                &nbsp;This establishes a solid foundation for business stability.
                            </p>
                        </div>

                        <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm md:shadow-xl shadow-stone-200/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                                <div className="space-y-10">
                                    <div>
                                        <div className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-3">Net Profit Forecast</div>
                                        <div className={`text-6xl font-serif tracking-tighter ${profit >= 0 ? 'text-[#8c9c8a]' : 'text-[#d97757]'}`}>
                                            {profit >= 0 ? '+' : ''}
                                            <CountUp end={profit} suffix="원" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 border-t border-stone-100 pt-8">
                                        <div>
                                            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Revenue</div>
                                            <div className="text-2xl font-serif text-stone-800">{new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(result.totalRevenue || 0)}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Total Cost</div>
                                            <div className="text-2xl font-serif text-stone-800">{new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 }).format(result.totalProjectCost)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[200px] md:h-[240px] w-full relative flex items-center justify-center border-l border-stone-100 md:pl-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Cost', value: result.totalProjectCost },
                                                    { name: 'Profit', value: Math.max(0, profit) },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="65%"
                                                outerRadius="90%"
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill="#f5f5f4" /> {/* Stone 100-ish for Cost */}
                                                <Cell fill="#8c9c8a" /> {/* Brand Emerald for Profit */}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">Margin</span>
                                        <span className="text-3xl font-serif font-bold text-stone-800">{profitMargin.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* Section 2: Revenue Driver */}
            <ScrollReveal delay={200}>
                <section>
                    <div className="flex flex-col gap-6 md:gap-8">
                        <div className="hidden md:block">
                            <h2 className="text-3xl font-serif text-stone-900 mb-4 tracking-tight">Core Revenue Drivers</h2>
                            <p className="text-stone-600 text-lg leading-relaxed max-w-3xl">
                                Analyzing where the value comes from. The <strong className="text-stone-900 font-bold border-b-2 border-[#e3c086]">{topUnit?.unitName || 'Main Type'}</strong> plays a pivotal role,
                                contributing <strong className="text-stone-900 font-bold">{topUnitShare.toFixed(1)}%</strong> to the total revenue.
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3 md:hidden">
                                <h3 className="text-lg font-serif text-stone-900">Revenue Mix</h3>
                                <span className="text-xs text-stone-400">Tap for details</span>
                            </div>

                            <div
                                className="bg-white p-4 md:p-10 rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm md:shadow-xl shadow-stone-200/50 cursor-pointer group relative overflow-hidden"
                                onClick={() => setIsRevenueDetailOpen(!isRevenueDetailOpen)}
                            >
                                <div className="md:hidden absolute top-4 right-4">
                                    <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isRevenueDetailOpen ? 'rotate-180' : ''}`} />
                                </div>
                                <div className="hidden md:flex absolute top-6 right-6 items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                    <span className="text-xs font-bold uppercase tracking-widest">{isRevenueDetailOpen ? 'Close Details' : 'View Pricing'}</span>
                                    <div className={`p-2 rounded-full border border-stone-200 bg-white shadow-sm transition-transform duration-500 ${isRevenueDetailOpen ? 'rotate-180' : 'group-hover:translate-y-1'}`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="p-4 md:p-6 bg-stone-50 rounded-xl md:rounded-2xl border border-stone-100">
                                            <div className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest mb-1 md:mb-2">Total Projected Revenue</div>
                                            <div className="text-2xl md:text-5xl font-serif text-[#8c9c8a] tracking-tight">{formatMoney(result.totalRevenue || 0)}</div>
                                        </div>
                                    </div>
                                    <div className="pointer-events-none">
                                        {result.unitPricing && result.unitPricing.length > 0 && (
                                            <RevenueChart data={result.unitPricing} />
                                        )}
                                    </div>
                                </div>

                                <div
                                    ref={revenueDetailRef}
                                    className={`grid transition-all duration-500 ease-in-out ${isRevenueDetailOpen
                                        ? 'grid-rows-[1fr] opacity-100 mt-6 pt-6 border-t border-stone-100'
                                        : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-none'
                                        }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="overflow-hidden">
                                        <PricingResultTable pricing={result.unitPricing} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* Section 3: Cost structure */}
            <ScrollReveal delay={200}>
                <section>
                    <div className="flex flex-col gap-6 md:gap-8">
                        <div className="hidden md:block">
                            <h2 className="text-3xl font-serif text-stone-900 mb-4 tracking-tight">Strategic Investment</h2>
                            <p className="text-stone-600 text-lg leading-relaxed max-w-3xl">
                                Efficient capital allocation is key. <strong className="text-stone-900 font-bold border-b-2 border-[#d97757]">{majorCostName}</strong> is the primary investment area,
                                comprising <strong className="text-stone-900 font-bold">{majorCostShare.toFixed(1)}%</strong> of the total budget.
                            </p>
                        </div>

                        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl border border-stone-200 shadow-sm md:shadow-xl shadow-stone-200/50">
                            <div className="hidden md:flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
                                <h3 className="text-xl font-serif text-stone-800">비용 구조 분석</h3>
                                <button
                                    onClick={() => setIsCostDetailOpen(!isCostDetailOpen)}
                                    className="flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-xs font-bold uppercase tracking-widest"
                                >
                                    {isCostDetailOpen ? 'Close Details' : 'View Details'}
                                    <div className={`p-1.5 rounded-full border border-stone-200 bg-white transition-transform duration-300 ${isCostDetailOpen ? '' : 'rotate-180'}`}>
                                        <ChevronDown className="w-3 h-3" />
                                    </div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between mb-4 md:hidden cursor-pointer" onClick={() => setIsCostDetailOpen(!isCostDetailOpen)}>
                                <h3 className="text-lg font-serif text-stone-900">Cost Structure</h3>
                                <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${isCostDetailOpen ? 'rotate-180' : ''}`} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-8 items-center">
                                <div className="bg-stone-50 rounded-2xl p-6 md:p-10 flex flex-col justify-center h-full min-h-[160px] md:min-h-[240px]">
                                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 md:mb-4">Total Project Cost</div>
                                    <div className="text-3xl md:text-5xl font-serif text-[#d97757] tracking-tight leading-tight">{formatMoney(result.totalProjectCost)}</div>
                                </div>
                                <div className="h-[250px] md:h-[300px] w-full flex justify-center items-center">
                                    <ResultChart data={result.costBreakdown} totalCost={result.totalProjectCost} hideTitle />
                                </div>
                            </div>

                            <div
                                ref={detailsSectionRef}
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isCostDetailOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                            >
                                <div className="pt-6 border-t border-stone-100">
                                    <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Cost Breakdown Details</div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                        {result.costBreakdown.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 md:p-4 bg-stone-50 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: item.fill }}></div>
                                                    <span className="text-sm md:text-base text-stone-600 font-bold">{item.name}</span>
                                                </div>
                                                <div className="text-stone-800 font-serif flex items-baseline gap-2">
                                                    <span className="text-sm md:text-base font-bold">{formatMoney(item.value)}</span>
                                                    <span className="text-xs text-stone-400 font-sans font-medium">({((item.value / result.totalProjectCost) * 100).toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </ScrollReveal>
        </div>
    );
}
