"use client";

import { AnalysisResult } from "@/types";
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface PricingResultTableProps {
    pricing: AnalysisResult['unitPricing'];
}

type SortKey = 'unitName' | 'tier' | 'supplyArea' | 'totalPrice' | 'pricePerPyung';
type SortOrder = 'asc' | 'desc';

export function PricingResultTable({ pricing }: PricingResultTableProps) {
    // Multi-column sort state: Array of sort criteria, where index 0 is the primary sort.
    const [sorts, setSorts] = useState<{ key: SortKey; order: SortOrder }[]>([
        { key: 'unitName', order: 'asc' }
    ]);

    if (!pricing || pricing.length === 0) return null;

    const handleSort = (key: SortKey) => {
        setSorts(prev => {
            const existingIndex = prev.findIndex(s => s.key === key);
            let newSorts = [...prev];

            if (existingIndex === 0) {
                // If clicking the primary sort column, toggle its order
                newSorts[0] = { ...newSorts[0], order: newSorts[0].order === 'asc' ? 'desc' : 'asc' };
            } else {
                // If clicking a new column or a secondary column, move it to the front (make it primary)
                // Remove it from its old position if it exists
                if (existingIndex > -1) {
                    newSorts.splice(existingIndex, 1);
                }
                // Add to the front as 'asc'
                newSorts.unshift({ key, order: 'asc' });
            }
            return newSorts;
        });
    };

    const tierOrder = { "1st": 1, "2nd": 2, "General": 3 };

    const sortedPricing = [...pricing].sort((a, b) => {
        // Iterate through sort criteria in order of priority
        for (const sort of sorts) {
            let comparison = 0;
            switch (sort.key) {
                case 'unitName':
                    comparison = a.unitName.localeCompare(b.unitName);
                    break;
                case 'tier':
                    comparison = (tierOrder[a.tier] || 4) - (tierOrder[b.tier] || 4);
                    break;
                case 'supplyArea':
                    comparison = (a.supplyArea || 0) - (b.supplyArea || 0);
                    break;
                case 'totalPrice':
                    comparison = a.totalPrice - b.totalPrice;
                    break;
                case 'pricePerPyung':
                    comparison = a.pricePerPyung - b.pricePerPyung;
                    break;
            }

            if (comparison !== 0) {
                return sort.order === 'asc' ? comparison : -comparison;
            }
        }
        return 0;
    });

    const formatMoney = (val: number) => {
        const unit = 100000000;
        const eok = Math.floor(val / unit);
        const thousands = Math.round((val % unit) / 10000);

        if (eok > 0) return `${eok}억 ${thousands > 0 ? thousands.toLocaleString() : ""}만`;
        return `${thousands.toLocaleString()}만`;
    };

    const SortButton = ({ column, label }: { column: SortKey; label: string }) => {
        const sortIndex = sorts.findIndex(s => s.key === column);
        const currentSort = sorts[sortIndex];
        const isSorted = sortIndex !== -1;

        return (
            <button
                onClick={() => handleSort(column)}
                className="flex items-center justify-center gap-1 hover:text-stone-700 transition-colors group w-full relative"
            >
                {label}
                <div className="flex items-center">
                    {isSorted ? (
                        <>
                            {currentSort.order === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            <span className="text-[10px] font-bold ml-0.5 text-stone-600 leading-none">{sortIndex + 1}</span>
                        </>
                    ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className="w-full">
            {/* <h3 className="text-lg font-serif mb-4 text-stone-800 border-b border-stone-200 pb-2">
                예상 분양가 산출 결과
            </h3> */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-stone-200 text-stone-500 text-xs">
                            <th className="py-2 md:py-3 text-center font-medium whitespace-nowrap px-1 md:px-2">
                                <SortButton column="unitName" label="Type" />
                            </th>
                            {/* <th className="py-2 md:py-3 text-center font-medium whitespace-nowrap px-1 md:px-2">
                                <SortButton column="supplyArea" label="평형" />
                            </th> */}
                            <th className="py-2 md:py-3 text-center font-medium whitespace-nowrap px-1 md:px-2">
                                <SortButton column="tier" label="Category" />
                            </th>
                            <th className="py-2 md:py-3 text-center font-medium whitespace-nowrap px-1 md:px-2">
                                <SortButton column="totalPrice" label="Price" />
                            </th>
                            <th className="py-2 md:py-3 text-center font-medium whitespace-nowrap px-1 md:px-2">
                                <SortButton column="pricePerPyung" label="Per Pyung" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {sortedPricing.map((item) => (
                            <tr key={item.allocationId} className="group hover:bg-stone-50 transition-colors">
                                <td className="py-2 md:py-3 text-center text-sm text-stone-800 whitespace-nowrap px-1 md:px-2">
                                    <span className="font-semibold">{item.unitName}</span>
                                    <span className="text-xs text-stone-500 ml-1">({item.supplyArea}평)</span>
                                </td>
                                {/* <td className="py-2 md:py-3 text-center text-sm text-stone-800 whitespace-nowrap px-1 md:px-2">
                                    {item.supplyArea ? `${item.supplyArea}평` : '-'}
                                </td> */}
                                <td className="py-2 md:py-3 text-center whitespace-nowrap px-1 md:px-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${item.tier === '1st' ? 'bg-[#e8f0fe] text-[#1967d2]' :
                                        item.tier === '2nd' ? 'bg-[#f3e8fd] text-[#7627bb]' :
                                            'bg-stone-100 text-stone-600'
                                        }`}>
                                        {item.tier === '1st' ? "1차" : item.tier === '2nd' ? "2차" : "일반"}
                                    </span>
                                </td>
                                <td className="py-2 md:py-3 text-center text-sm text-stone-800 whitespace-nowrap px-1 md:px-2 tracking-tighter">
                                    {formatMoney(item.totalPrice)}
                                </td>
                                <td className="py-2 md:py-3 text-center text-sm text-stone-800 whitespace-nowrap px-1 md:px-2 tracking-tighter">
                                    {(item.pricePerPyung / 10000).toLocaleString()}만
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


