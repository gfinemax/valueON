"use client";

import { useMemo, useState } from "react";
import { Landmark, Plus, Trash2, WalletCards } from "lucide-react";
import { useCalculator } from "@/hooks/useCalculator";
import { useSearchIndex } from "@/hooks/useSearchIndex";
import { useSettings } from "@/components/settings-context";
import { SearchHeader } from "@/components/search-header";
import { ManagementHeaderActions } from "@/components/management-header-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatKrwThousands } from "@/utils/currency";
import type { FundingCategory, FundingPlanItem } from "@/types";

const EOK = 100000000;

const categoryMeta: Record<FundingCategory, { label: string; badge: string; dot: string }> = {
    bridge: {
        label: "브릿지 자금",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
    },
    pf: {
        label: "본 PF",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        dot: "bg-blue-500",
    },
    member: {
        label: "조합원 차입",
        badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
    },
    other: {
        label: "기타 조달",
        badge: "border-slate-200 bg-slate-50 text-slate-700",
        dot: "bg-slate-500",
    },
};

const categoryOrder: FundingCategory[] = ["bridge", "pf", "member", "other"];

type FundingSummary = {
    principal: number;
    interest: number;
    fee: number;
    totalCost: number;
};

function getFundingCost(item: FundingPlanItem) {
    const interest = item.amount * (item.interestRate / 100) * (item.termMonths / 12);
    const fee = item.amount * (item.feeRate / 100);

    return {
        interest,
        fee,
        totalCost: interest + fee,
    };
}

function formatWon(amount: number) {
    const sign = amount < 0 ? "-" : "";
    return `${sign}${formatKrwThousands(Math.abs(amount))}`;
}

function formatPercent(value: number) {
    if (!Number.isFinite(value)) return "0.0%";
    return `${value.toFixed(1)}%`;
}

function parseNumericInput(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export default function FundingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const { isEditMode, setIsEditMode } = useSettings();
    const {
        inputs,
        result,
        addFundingPlanItem,
        updateFundingPlanItem,
        removeFundingPlanItem,
    } = useCalculator();

    const { groupedSearch } = useSearchIndex({ inputs, result });
    const searchResults = groupedSearch(searchQuery);

    const summary = useMemo(() => {
        return inputs.fundingPlan.reduce<FundingSummary>(
            (acc, item) => {
                const cost = getFundingCost(item);

                acc.principal += item.amount;
                acc.interest += cost.interest;
                acc.fee += cost.fee;
                acc.totalCost += cost.totalCost;

                return acc;
            },
            { principal: 0, interest: 0, fee: 0, totalCost: 0 }
        );
    }, [inputs.fundingPlan]);

    const categorySummaries = useMemo(() => {
        return categoryOrder.map((category) => {
            const items = inputs.fundingPlan.filter((item) => item.category === category);
            const total = items.reduce(
                (acc, item) => {
                    const cost = getFundingCost(item);
                    return {
                        principal: acc.principal + item.amount,
                        cost: acc.cost + cost.totalCost,
                    };
                },
                { principal: 0, cost: 0 }
            );

            return {
                category,
                count: items.length,
                principal: total.principal,
                cost: total.cost,
            };
        });
    }, [inputs.fundingPlan]);

    const netProfitBeforeFunding = (result.totalRevenue ?? 0) - result.totalProjectCost;
    const netProfitAfterFunding = netProfitBeforeFunding - summary.totalCost;
    const fundingCoverage =
        result.totalProjectCost > 0 ? (summary.principal / result.totalProjectCost) * 100 : 0;

    return (
        <main className="min-h-screen bg-slate-50 pt-14">
            <SearchHeader
                title="자금계획"
                searchResults={searchResults}
                onSearch={setSearchQuery}
                actions={
                    <ManagementHeaderActions
                        isEditMode={isEditMode}
                        onEditModeChange={setIsEditMode}
                        addLabel="조달 항목"
                        onAdd={() => addFundingPlanItem("bridge")}
                        addTitle="자금조달 항목 추가"
                        addDisabledTitle="편집 모드에서 조달 항목을 추가할 수 있습니다"
                        addIcon={<Plus className="h-4 w-4" />}
                    />
                }
            />

            <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FundingMetricCard
                        title="조달 원금"
                        value={formatWon(summary.principal)}
                        description={`사업비 대비 ${formatPercent(fundingCoverage)}`}
                    />
                    <FundingMetricCard
                        title="금융비용 추정"
                        value={formatWon(summary.totalCost)}
                        description={`이자 ${formatWon(summary.interest)} / 수수료 ${formatWon(summary.fee)}`}
                    />
                    <FundingMetricCard
                        title="사업손익"
                        value={formatWon(netProfitBeforeFunding)}
                        description="금융비용 반영 전"
                        tone={netProfitBeforeFunding >= 0 ? "positive" : "negative"}
                    />
                    <FundingMetricCard
                        title="자금계획 반영 후"
                        value={formatWon(netProfitAfterFunding)}
                        description="조달 원금은 상환 대상, 이자/수수료만 손익 차감"
                        tone={netProfitAfterFunding >= 0 ? "positive" : "negative"}
                    />
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    {categorySummaries.map((item) => (
                        <Card key={item.category} className="gap-4 rounded-lg py-4">
                            <CardContent className="space-y-3 px-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                        <span className={`h-2.5 w-2.5 rounded-full ${categoryMeta[item.category].dot}`} />
                                        {categoryMeta[item.category].label}
                                    </div>
                                    <span className="text-xs text-slate-500">{item.count}건</span>
                                </div>
                                <div>
                                    <div className="text-xl font-bold tracking-tight text-slate-950">
                                        {formatWon(item.principal)}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        예상 금융비용 {formatWon(item.cost)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>

                <Card className="gap-0 overflow-hidden rounded-lg py-0">
                    <CardHeader className="border-b bg-white px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                                    <Landmark className="h-5 w-5 text-blue-600" />
                                    조달 계획
                                </CardTitle>
                                <p className="mt-1 text-sm text-slate-500">
                                    브릿지 자금, 본 PF, 조합원 차입금, 기타 조달을 별도로 관리합니다.
                                </p>
                            </div>
                            <WalletCards className="hidden h-8 w-8 text-slate-300 sm:block" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-[130px] px-4">구분</TableHead>
                                    <TableHead className="min-w-[160px]">항목</TableHead>
                                    <TableHead className="min-w-[130px] text-right">조달금액(억원)</TableHead>
                                    <TableHead className="w-[100px] text-right">금리</TableHead>
                                    <TableHead className="w-[100px] text-right">기간</TableHead>
                                    <TableHead className="w-[100px] text-right">수수료</TableHead>
                                    <TableHead className="min-w-[130px] text-right">금융비용</TableHead>
                                    <TableHead className="min-w-[150px]">상환재원</TableHead>
                                    <TableHead className="min-w-[160px]">메모</TableHead>
                                    {isEditMode && <TableHead className="w-[60px]" />}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {inputs.fundingPlan.map((item) => {
                                    const cost = getFundingCost(item);
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="px-4">
                                                {isEditMode ? (
                                                    <select
                                                        value={item.category}
                                                        onChange={(event) =>
                                                            updateFundingPlanItem(
                                                                item.id,
                                                                "category",
                                                                event.target.value as FundingCategory
                                                            )
                                                        }
                                                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 shadow-xs focus:border-ring focus:outline-none focus:ring-ring/50 focus:ring-[3px]"
                                                    >
                                                        {categoryOrder.map((category) => (
                                                            <option key={category} value={category}>
                                                                {categoryMeta[category].label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${categoryMeta[item.category].badge}`}>
                                                        {categoryMeta[item.category].label}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <FundingTextField
                                                    value={item.name}
                                                    disabled={!isEditMode}
                                                    onChange={(value) => updateFundingPlanItem(item.id, "name", value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FundingNumberField
                                                    value={item.amount / EOK}
                                                    disabled={!isEditMode}
                                                    min={0}
                                                    step={1}
                                                    onChange={(value) => updateFundingPlanItem(item.id, "amount", Math.max(0, value) * EOK)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FundingNumberField
                                                    value={item.interestRate}
                                                    disabled={!isEditMode}
                                                    min={0}
                                                    step={0.1}
                                                    suffix="%"
                                                    onChange={(value) => updateFundingPlanItem(item.id, "interestRate", Math.max(0, value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FundingNumberField
                                                    value={item.termMonths}
                                                    disabled={!isEditMode}
                                                    min={0}
                                                    step={1}
                                                    suffix="개월"
                                                    onChange={(value) => updateFundingPlanItem(item.id, "termMonths", Math.max(0, Math.round(value)))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FundingNumberField
                                                    value={item.feeRate}
                                                    disabled={!isEditMode}
                                                    min={0}
                                                    step={0.1}
                                                    suffix="%"
                                                    onChange={(value) => updateFundingPlanItem(item.id, "feeRate", Math.max(0, value))}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-slate-900">
                                                {formatWon(cost.totalCost)}
                                            </TableCell>
                                            <TableCell>
                                                <FundingTextField
                                                    value={item.repaymentSource}
                                                    disabled={!isEditMode}
                                                    onChange={(value) => updateFundingPlanItem(item.id, "repaymentSource", value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FundingTextField
                                                    value={item.note ?? ""}
                                                    disabled={!isEditMode}
                                                    placeholder="-"
                                                    onChange={(value) => updateFundingPlanItem(item.id, "note", value)}
                                                />
                                            </TableCell>
                                            {isEditMode && (
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-slate-400 hover:text-red-600"
                                                        title="조달 항목 삭제"
                                                        onClick={() => removeFundingPlanItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                                {inputs.fundingPlan.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={isEditMode ? 10 : 9} className="h-24 text-center text-sm text-slate-500">
                                            등록된 자금조달 항목이 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

function FundingMetricCard({
    title,
    value,
    description,
    tone = "neutral",
}: {
    title: string;
    value: string;
    description: string;
    tone?: "neutral" | "positive" | "negative";
}) {
    const valueColor =
        tone === "positive" ? "text-emerald-700" : tone === "negative" ? "text-red-600" : "text-slate-950";

    return (
        <Card className="gap-4 rounded-lg py-5">
            <CardContent className="space-y-2 px-5">
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <div className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</div>
                <p className="min-h-8 text-xs leading-4 text-slate-500">{description}</p>
            </CardContent>
        </Card>
    );
}

function FundingTextField({
    value,
    disabled,
    placeholder,
    onChange,
}: {
    value: string;
    disabled: boolean;
    placeholder?: string;
    onChange: (value: string) => void;
}) {
    if (disabled) {
        return <span className="block min-w-0 truncate text-sm text-slate-700">{value || placeholder || "-"}</span>;
    }

    return (
        <Input
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className="h-8 min-w-[120px] bg-white text-sm"
        />
    );
}

function FundingNumberField({
    value,
    disabled,
    min,
    step,
    suffix,
    onChange,
}: {
    value: number;
    disabled: boolean;
    min?: number;
    step?: number;
    suffix?: string;
    onChange: (value: number) => void;
}) {
    if (disabled) {
        return (
            <span className="block text-right text-sm text-slate-700">
                {new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value)}
                {suffix ? ` ${suffix}` : ""}
            </span>
        );
    }

    return (
        <div className="flex min-w-[86px] items-center gap-1">
            <Input
                type="number"
                min={min}
                step={step}
                value={value === 0 ? "" : value}
                onChange={(event) => onChange(parseNumericInput(event.target.value))}
                className="h-8 bg-white text-right text-sm"
            />
            {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
        </div>
    );
}
