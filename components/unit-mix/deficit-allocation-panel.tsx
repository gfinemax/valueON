"use client";

import { AnalysisResult } from "@/types";
import { Switch } from "@/components/ui/switch";
import { formatKoreanCurrency, formatKrwEok, formatKrwMan } from "@/utils/currency";

interface DeficitAllocationPanelProps {
    result: AnalysisResult;
    isEditMode: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

export function DeficitAllocationPanel({ result, isEditMode, onEnabledChange }: DeficitAllocationPanelProps) {
    const allocation = result.deficitAllocation;
    if (!allocation) return null;
    return (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-bold text-slate-900">적자 분담금 배분</h2>
                    <p className="mt-1 text-xs text-slate-600">1·2차 조합원 {allocation.memberCount}세대 · 공급면적 {allocation.memberArea.toLocaleString("ko-KR")}평 기준으로 배분합니다. 공공임대 건축비는 유지합니다.</p>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="allocate-member-deficit" className="text-sm font-medium">{allocation.enabled ? "배분 적용" : "배분 미적용"}</label>
                    <Switch id="allocate-member-deficit" checked={allocation.enabled} disabled={!isEditMode} onCheckedChange={onEnabledChange} />
                </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                    ["배분 전 적자", formatKrwEok(allocation.deficit)],
                    ["추가분담금 / 평", formatKrwMan(allocation.additionalPerPyung)],
                    ["추가분담금 총액", formatKrwEok(allocation.allocatedTotal)],
                    ["배분 후 잔여 적자", formatKrwEok(allocation.remainingDeficit)],
                ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-base font-bold" title={value}>{value}</dd></div>)}
            </dl>
            {allocation.enabled && allocation.deficit > 0 && allocation.memberArea === 0 && <p role="status" className="mt-3 text-sm text-red-700">배분할 조합원 세대수와 공급면적을 입력해주세요.</p>}
            <p className="mt-3 text-xs text-slate-500">실제 적자 {formatKoreanCurrency(allocation.deficit)}원{allocation.enabled ? "을 기본 분담금에 추가합니다." : "은 배분하지 않은 상태입니다."} 사업비·세대수·면적 변경 시 재계산되며, 편집 모드에서 배분을 끌 수 있습니다.</p>
        </section>
    );
}
