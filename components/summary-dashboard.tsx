import { AnalysisResult } from "@/types";
import { ResultChart } from "./result-chart";
import { PricingResultTable } from "./unit-mix/pricing-result-table";
import { RevenueChart } from "./revenue-chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
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

export function SummaryDashboard({ result }: SummaryDashboardProps) {
    const [isCostDetailOpen, setIsCostDetailOpen] = useState(false);
    const [isRevenueDetailOpen, setIsRevenueDetailOpen] = useState(false);
    const costDetailRef = useRef<HTMLDivElement>(null); // Ref for the card
    const detailsSectionRef = useRef<HTMLDivElement>(null); // Ref for the details section
    const revenueDetailRef = useRef<HTMLDivElement>(null); // Ref for revenue details

    const formatMoney = (val: number) =>
        new Intl.NumberFormat("ko-KR", {
            style: "currency",
            currency: "KRW",
            maximumFractionDigits: 0,
        }).format(val);

    // Effect to handle scroll when cost details open
    useEffect(() => {
        if (isCostDetailOpen && detailsSectionRef.current) {
            setTimeout(() => {
                detailsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 400);
        }
    }, [isCostDetailOpen]);

    // Effect to handle scroll when revenue details open
    useEffect(() => {
        if (isRevenueDetailOpen && revenueDetailRef.current) {
            setTimeout(() => {
                revenueDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 400);
        }
    }, [isRevenueDetailOpen]);

    // --- Storytelling Data Preparation ---

    // 1. Profit
    const profit = (result.totalRevenue || 0) - result.totalProjectCost;
    const profitMargin = (result.totalRevenue || 0) > 0
        ? (profit / (result.totalRevenue || 0)) * 100
        : 0;

    // 2. Revenue Driver (Best Unit)
    const sortedUnits = [...(result.unitPricing || [])].sort((a, b) => (b.revenueContribution || 0) - (a.revenueContribution || 0));
    const topUnit = sortedUnits[0];
    const topUnitShare = (result.totalRevenue && topUnit?.revenueContribution) ? (topUnit.revenueContribution / result.totalRevenue) * 100 : 0;

    // 3. Cost Driver (Land vs Construction)
    const landCost = result.costBreakdown.find(c => c.name.includes("토지"))?.value || 0;
    const constCost = result.costBreakdown.find(c => c.name.includes("공사"))?.value || 0;
    const majorCostName = landCost > constCost ? "Land Acquisition" : "Construction";
    const majorCostValue = Math.max(landCost, constCost);
    const majorCostShare = result.totalProjectCost ? (majorCostValue / result.totalProjectCost) * 100 : 0;


    // Overview Chart Data
    const overviewData = [
        { name: "Total Revenue", value: result.totalRevenue || 0, fill: "#8c9c8a" },
        { name: "Total Cost", value: result.totalProjectCost, fill: "#d97757" },
    ];


    return (
        <div className="space-y-24 py-12">

            {/* Story 1: The Bottom Line (Profit) */}
            <ScrollReveal>
                <section>
                    <div className="mb-8">
                        <h2 className="text-4xl font-serif text-stone-900 mb-3 tracking-tight">Safe Margin Secured</h2>
                        <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">
                            This project is projected to generate a net profit of <strong className="text-emerald-700 font-semibold">{formatMoney(profit)}</strong>,
                            representing a <strong className="text-emerald-700 font-semibold">{profitMargin.toFixed(1)}% safe margin</strong>.
                            This establishes a solid foundation for business stability.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-10 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500">
                        {/* Metrics */}
                        <div className="space-y-10">
                            <div>
                                <div className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">Net Profit Forecast</div>
                                <div className={`text-5xl md:text-6xl font-serif tracking-tighter ${profit >= 0 ? 'text-[#8c9c8a]' : 'text-[#d97757]'}`}>
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

                        {/* Simple Bar Chart */}
                        <div className="h-[240px] w-full pl-6 border-l border-stone-100">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={overviewData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 13, fill: '#78716c', fontWeight: 500 }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={48} animationDuration={1500}>
                                        {overviewData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            </ScrollReveal>

            {/* Story 2: The Revenue Engine */}
            <ScrollReveal delay={200}>
                {(isVisible) => (
                    <section>
                        <div className="mb-8">
                            <h2 className="text-3xl font-serif text-stone-900 mb-3 tracking-tight">Core Revenue Drivers</h2>
                            <p className="text-stone-600 text-lg leading-relaxed max-w-2xl">
                                Analyzing where the value comes from. The
                                <strong className="text-stone-900 font-semibold mx-1.5 border-b-2 border-[#8c9c8a]">{topUnit?.unitName || "Main Type"}</strong>
                                plays a pivotal role, contributing
                                <strong className="text-stone-900 font-semibold ml-1.5">{topUnitShare.toFixed(1)}%</strong> to the total revenue.
                            </p>
                        </div>

                        <div
                            className="bg-white p-10 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                            onClick={() => setIsRevenueDetailOpen(!isRevenueDetailOpen)}
                        >
                            {/* Click Hint */}
                            <div className="absolute top-6 right-6 flex items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                <span className="text-xs font-bold uppercase tracking-widest">{isRevenueDetailOpen ? 'Close Details' : 'View Pricing'}</span>
                                <div className={`p-2 rounded-full border border-stone-200 bg-white shadow-sm transition-transform duration-500 ${isRevenueDetailOpen ? 'rotate-180' : 'group-hover:translate-y-1'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Total Projected Revenue</div>
                                        <div className="text-4xl font-serif text-[#8c9c8a] tracking-tight">{formatMoney(result.totalRevenue || 0)}</div>
                                    </div>
                                    <p className="text-stone-500 text-sm leading-relaxed px-1">
                                        * Click this card to explore detailed pricing by unit type.
                                    </p>
                                </div>
                                <div className="pointer-events-none">
                                    {/* Revenue Chart */}
                                    {isVisible && result.unitPricing && result.unitPricing.length > 0 && (
                                        <RevenueChart data={result.unitPricing} />
                                    )}
                                </div>
                            </div>

                            {/* Expandable Detail Section */}
                            <div
                                ref={revenueDetailRef}
                                className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isRevenueDetailOpen
                                    ? 'grid-rows-[1fr] opacity-100 mt-10 pt-10 border-t border-stone-100'
                                    : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-none'
                                    }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Detailed Pricing Mix</h4>
                                    </div>

                                    {result.unitPricing && result.unitPricing.length > 0 ? (
                                        <PricingResultTable pricing={result.unitPricing} />
                                    ) : (
                                        <div className="h-48 flex items-center justify-center text-stone-400 italic">No pricing data</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </ScrollReveal>

            {/* Story 3: Strategic Investment (Cost) */}
            <ScrollReveal delay={200}>
                {(isVisible) => (
                    <section>
                        <div className="mb-8">
                            <h2 className="text-3xl font-serif text-stone-900 mb-3 tracking-tight">Strategic Investment</h2>
                            <p className="text-stone-600 text-lg leading-relaxed max-w-3xl">
                                Efficient capital allocation is key.
                                <strong className="text-stone-900 font-semibold mx-1.5 border-b-2 border-[#d97757]">{majorCostName}</strong>
                                is the primary investment area, comprising
                                <strong className="text-stone-900 font-semibold ml-1.5">{majorCostShare.toFixed(1)}%</strong> of the total budget.
                            </p>
                        </div>

                        <div
                            ref={costDetailRef}
                            className="bg-white p-10 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50 hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                            onClick={() => setIsCostDetailOpen(!isCostDetailOpen)}
                        >
                            {/* Click Hint */}
                            <div className="absolute top-6 right-6 flex items-center gap-2 text-stone-400 group-hover:text-stone-600 transition-colors">
                                <span className="text-xs font-bold uppercase tracking-widest">{isCostDetailOpen ? 'Close Details' : 'View Breakdown'}</span>
                                <div className={`p-2 rounded-full border border-stone-200 bg-white shadow-sm transition-transform duration-500 ${isCostDetailOpen ? 'rotate-180' : 'group-hover:translate-y-1'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                                        <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Total Project Cost</div>
                                        <div className="text-4xl font-serif text-[#d97757] tracking-tight">{formatMoney(result.totalProjectCost)}</div>
                                    </div>
                                    <p className="text-stone-500 text-sm leading-relaxed px-1">
                                        * Click this card to explore the detailed cost breakdown structure.
                                    </p>
                                </div>
                                <div className="pointer-events-none transform scale-110">
                                    {/* Scale up chart slightly for visual impact */}
                                    {isVisible && (
                                        <ResultChart
                                            data={result.costBreakdown}
                                            totalCost={result.totalProjectCost}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Expandable Detail Section */}
                            <div
                                ref={detailsSectionRef}
                                className={`grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCostDetailOpen
                                    ? 'grid-rows-[1fr] opacity-100 mt-10 pt-10 border-t border-stone-100'
                                    : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-none'
                                    }`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-bold text-stone-400 uppercase tracking-widest">Cost Breakdown Details</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.costBreakdown.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-stone-300 hover:bg-white transition-all duration-300">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: item.fill }}></div>
                                                    <span className="text-stone-700 font-medium">{item.name}</span>
                                                </div>
                                                <div className="text-stone-800 font-serif flex items-baseline gap-2">
                                                    <span>{formatMoney(item.value)}</span>
                                                    <span className="text-xs text-stone-400 font-sans font-medium">
                                                        ({((item.value / result.totalProjectCost) * 100).toFixed(1)}%)
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </ScrollReveal>
        </div>
    );
}

