"use client";

import { SearchResult, SearchResultType } from "@/hooks/useSearchIndex";
import { useRouter } from "next/navigation";
import { Folder, DollarSign, Home, Tag } from "lucide-react";

interface SearchResultDropdownProps {
    results: {
        categories: SearchResult[];
        costItems: SearchResult[];
        unitTypes: SearchResult[];
        pricing: SearchResult[];
        total: number;
    };
    onSelect: () => void;
    selectedIndex: number;
    query: string;
}

export function SearchResultDropdown({
    results,
    onSelect,
    selectedIndex,
    query,
}: SearchResultDropdownProps) {
    const router = useRouter();

    if (results.total === 0 || !query) {
        return null;
    }

    const formatMoney = (value?: number) => {
        if (!value) return '';
        const eok = Math.floor(value / 100000000);
        const man = Math.floor((value % 100000000) / 10000);
        if (eok > 0) return `₩${eok}억${man > 0 ? ` ${man.toLocaleString()}만` : ''}`;
        return `₩${man.toLocaleString()}만`;
    };

    const handleClick = (result: SearchResult) => {
        // Build URL with query params for auto-expand and highlight
        let url = result.route;

        if (result.type === 'category' && result.categoryId) {
            // Expand category
            url = `${result.route}?expand=${result.categoryId}`;
        } else if (result.type === 'costItem' && result.categoryId && result.itemId) {
            // Expand category + highlight item
            url = `${result.route}?expand=${result.categoryId}&highlight=${result.itemId}`;
        } else if (result.anchor) {
            // Other types use anchor
            url = `${result.route}#${result.anchor}`;
        }

        router.push(url);
        onSelect();
    };

    const getIcon = (type: SearchResultType) => {
        switch (type) {
            case 'category':
                return <Folder className="w-4 h-4 text-blue-500" />;
            case 'costItem':
                return <DollarSign className="w-4 h-4 text-orange-500" />;
            case 'unitType':
                return <Home className="w-4 h-4 text-green-500" />;
            case 'pricing':
                return <Tag className="w-4 h-4 text-purple-500" />;
        }
    };

    const getTypeLabel = (type: SearchResultType) => {
        switch (type) {
            case 'category':
                return '카테고리';
            case 'costItem':
                return '비용 항목';
            case 'unitType':
                return '분양 타입';
            case 'pricing':
                return '분양가';
        }
    };

    // Flatten all results for keyboard navigation index
    const allResults = [
        ...results.categories,
        ...results.costItems,
        ...results.unitTypes,
        ...results.pricing,
    ];

    const renderSection = (
        title: string,
        items: SearchResult[],
        startIndex: number
    ) => {
        if (items.length === 0) return null;

        return (
            <div key={title}>
                <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    {title}
                </div>
                {items.map((item, idx) => {
                    const globalIndex = startIndex + idx;
                    const isSelected = globalIndex === selectedIndex;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item)}
                            className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${isSelected ? 'bg-blue-50' : ''
                                }`}
                        >
                            {getIcon(item.type)}
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-800 truncate">
                                    {highlightMatch(item.label, query)}
                                </div>
                                {item.sublabel && (
                                    <div className="text-xs text-slate-400 truncate">
                                        {item.sublabel}
                                    </div>
                                )}
                            </div>
                            {item.value !== undefined && (
                                <div className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                    {formatMoney(item.value)}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    let currentIndex = 0;

    return (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50">
            {renderSection('📁 카테고리', results.categories, currentIndex)}
            {(currentIndex += results.categories.length, null)}

            {renderSection('💰 비용 항목', results.costItems, currentIndex)}
            {(currentIndex += results.costItems.length, null)}

            {renderSection('🏠 분양 타입', results.unitTypes, currentIndex)}
            {(currentIndex += results.unitTypes.length, null)}

            {renderSection('🏷️ 분양가', results.pricing, currentIndex)}

            <div className="px-3 py-2 text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                {results.total}개 결과 · Enter로 이동 · Esc로 닫기
            </div>
        </div>
    );
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
        <>
            {text.slice(0, index)}
            <span className="bg-yellow-200 font-semibold">
                {text.slice(index, index + query.length)}
            </span>
            {text.slice(index + query.length)}
        </>
    );
}
