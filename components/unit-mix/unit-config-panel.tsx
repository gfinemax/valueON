"use client";

import { UnitType, UnitAllocation, MemberTier } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface UnitConfigPanelProps {
    unitTypes: UnitType[];
    allocations: UnitAllocation[];
    onApplyPreset: () => void;
    onUpdateCount: (unitTypeId: string, tier: MemberTier, count: number) => void;
    onUpdateSupplyArea: (unitTypeId: string, area: number) => void;
}

export function UnitConfigPanel({ unitTypes, allocations, onApplyPreset, onUpdateCount, onUpdateSupplyArea }: UnitConfigPanelProps) {
    const count = (id: string, tier?: MemberTier) => allocations.filter((allocation) => allocation.unitTypeId === id && (!tier || allocation.tier === tier)).reduce((sum, allocation) => sum + allocation.count, 0);
    const apartments = unitTypes.filter((type) => type.category === "APARTMENT");
    const rentals = unitTypes.filter((type) => type.category === "RENTAL");
    const rows = apartments.map((type) => {
        const rental = rentals.find((item) => item.id === type.id.replace("unit-", "rental-"));
        return { type, rental, first: count(type.id, "1st"), second: count(type.id, "2nd"), general: count(type.id, "General"), rentalCount: rental ? count(rental.id) : 0 };
    });
    const unmatchedRentals = rentals.filter((type) => !rows.some((row) => row.rental?.id === type.id));
    const totals = rows.reduce((sum, row) => ({ first: sum.first + row.first, second: sum.second + row.second, general: sum.general + row.general, rental: sum.rental + row.rentalCount }), { first: 0, second: 0, general: 0, rental: unmatchedRentals.reduce((sum, type) => sum + count(type.id), 0) });
    const showGeneral = totals.general > 0;
    const renderCount = (type: UnitType, tier: MemberTier, value: number, label: string) => (
        <Input type="number" min={0} step={1} aria-label={`${type.name} ${label} 세대수`} className="h-8 w-20 text-center" value={value} onChange={(event) => onUpdateCount(type.id, tier, Number(event.target.value))} />
    );
    return (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">세대 배분 설정 · 총 {totals.first + totals.second + totals.general + totals.rental}세대</h2>
                <Button type="button" variant="outline" onClick={onApplyPreset}>제공 배분표 적용</Button>
            </div>
            <p className="mb-3 text-xs text-slate-500">배분표 적용 시 아파트·공공임대 세대수와 평당가를 교체합니다. 1차 4,500만원 · 2차 5,500만원 · 공공임대 건축비 1,300만원/평 (토지비 제외)</p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <caption className="sr-only">평형별 공공임대 및 조합원 세대 배분</caption>
                    <thead><tr className="border-b text-left">{["구분", "공급면적(평)", "전체 세대수", "공공임대", "조합원분", "1차 조합원", "2차 조합원", ...(showGeneral ? ["일반분양"] : [])].map((label) => <th key={label} scope="col" className="whitespace-nowrap p-2">{label}</th>)}</tr></thead>
                    <tbody>
                        {rows.map(({ type, rental, first, second, general, rentalCount }) => (
                            <tr key={type.id} className="border-b">
                                <th scope="row" className="whitespace-nowrap p-2 text-left">{type.name}</th>
                                <td className="p-2"><Input type="number" min={0.01} step={0.01} aria-label={`${type.name} 공급면적 평`} className="h-8 w-20" value={type.supplyArea} onChange={(event) => onUpdateSupplyArea(type.id, Number(event.target.value))} /></td>
                                <td className="p-2">{first + second + general + rentalCount}</td>
                                <td className="p-2">{rental ? renderCount(rental, "General", rentalCount, "공공임대") : "—"}</td>
                                <td className="p-2">{first + second}</td>
                                <td className="p-2">{renderCount(type, "1st", first, "1차 조합원")}</td>
                                <td className="p-2">{renderCount(type, "2nd", second, "2차 조합원")}</td>
                                {showGeneral && <td className="p-2">{renderCount(type, "General", general, "일반분양")}</td>}
                            </tr>
                        ))}
                        {unmatchedRentals.map((type) => <tr key={type.id} className="border-b"><th scope="row" className="p-2 text-left">{type.name}</th><td className="p-2">{type.supplyArea}</td><td className="p-2">{count(type.id)}</td><td className="p-2">{renderCount(type, "General", count(type.id), "공공임대")}</td><td colSpan={showGeneral ? 4 : 3} /></tr>)}
                    </tbody>
                    <tfoot><tr className="font-bold"><th scope="row" className="p-2 text-left">합계</th><td /><td className="p-2">{totals.first + totals.second + totals.general + totals.rental}</td><td className="p-2">{totals.rental}</td><td className="p-2">{totals.first + totals.second}</td><td className="p-2">{totals.first}</td><td className="p-2">{totals.second}</td>{showGeneral && <td className="p-2">{totals.general}</td>}</tr></tfoot>
                </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">세대수를 직접 입력하면 전체와 합계가 자동 계산됩니다. 공급면적은 49A형 18평, 59형 25평, 84형 34평이며 실제 공급면적으로 수정할 수 있습니다. 평당가는 아래 수입 상세에서 수정할 수 있습니다.</p>
        </section>
    );
}
