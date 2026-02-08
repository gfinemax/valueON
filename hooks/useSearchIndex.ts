"use client";

import { useMemo } from "react";
import { AnalysisInputs, AnalysisResult, CostCategory, CostItem } from "@/types";

export type SearchResultType = 'category' | 'costItem' | 'unitType' | 'pricing';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    label: string;
    sublabel?: string;
    value?: number;
    route: string;
    anchor?: string;
    categoryId?: string;
    itemId?: string;
}

interface UseSearchIndexProps {
    inputs: AnalysisInputs;
    result: AnalysisResult;
}

export function useSearchIndex({ inputs, result }: UseSearchIndexProps) {
    const searchIndex = useMemo(() => {
        const index: SearchResult[] = [];

        // 1. Index Cost Categories
        inputs.advancedCategories.forEach((category: CostCategory) => {
            index.push({
                id: `cat-${category.id}`,
                type: 'category',
                label: category.title,
                sublabel: '비용 카테고리',
                value: category.items.reduce((sum: number, item: CostItem) => sum + item.amount, 0),
                route: '/expense',
                anchor: `category-${category.id}`,
                categoryId: category.id,
            });

            // 2. Index Cost Items within each category
            category.items.forEach((item: CostItem) => {
                index.push({
                    id: `item-${category.id}-${item.id}`,
                    type: 'costItem',
                    label: item.name,
                    sublabel: category.title,
                    value: item.amount,
                    route: '/expense',
                    anchor: `item-${category.id}-${item.id}`,
                    categoryId: category.id,
                    itemId: item.id,
                });
            });
        });

        // 3. Index Unit Types
        inputs.unitTypes.forEach((unitType) => {
            index.push({
                id: `unit-${unitType.id}`,
                type: 'unitType',
                label: unitType.name,
                sublabel: `${unitType.supplyArea}평`,
                route: '/income',
                anchor: `unit-${unitType.id}`,
            });
        });

        // 4. Index Pricing Results
        result.unitPricing?.forEach((pricing) => {
            const tierLabel = pricing.tier === '1st' ? '1차' : pricing.tier === '2nd' ? '2차' : '일반';
            index.push({
                id: `pricing-${pricing.allocationId}`,
                type: 'pricing',
                label: `${pricing.unitName} (${tierLabel})`,
                sublabel: `분양가`,
                value: pricing.totalPrice,
                route: '/',
                anchor: 'revenue-section',
            });
        });

        return index;
    }, [inputs, result]);

    const search = (query: string): SearchResult[] => {
        if (!query || query.trim() === '') return [];

        const normalizedQuery = query.toLowerCase().trim();

        return searchIndex.filter((item) => {
            const labelMatch = item.label.toLowerCase().includes(normalizedQuery);
            const sublabelMatch = item.sublabel?.toLowerCase().includes(normalizedQuery);
            // Also search by formatted value (e.g., "888억")
            const valueStr = item.value ? formatSearchValue(item.value) : '';
            const valueMatch = valueStr.toLowerCase().includes(normalizedQuery);

            return labelMatch || sublabelMatch || valueMatch;
        });
    };

    const groupedSearch = (query: string) => {
        const results = search(query);

        return {
            categories: results.filter(r => r.type === 'category'),
            costItems: results.filter(r => r.type === 'costItem'),
            unitTypes: results.filter(r => r.type === 'unitType'),
            pricing: results.filter(r => r.type === 'pricing'),
            total: results.length,
        };
    };

    return { search, groupedSearch, searchIndex };
}

function formatSearchValue(value: number): string {
    const eok = Math.floor(value / 100000000);
    const man = Math.floor((value % 100000000) / 10000);

    if (eok > 0) {
        return `${eok}억${man > 0 ? ` ${man.toLocaleString()}만` : ''}`;
    }
    return `${man.toLocaleString()}만`;
}
