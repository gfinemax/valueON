import { useState, useMemo, useEffect } from "react";
import { AnalysisInputs, CostCategory, CostItem, FundingCategory, FundingPlanItem, MemberTier, UnitAllocation, UnitType } from "@/types";
import { defaultValues } from "@/constants/defaultValues";
import { calculateAnalysisResult } from "@/lib/analysis";
import { recommendCalculationBasis } from "@/utils/calculation-basis";


const STORAGE_KEY = "valueon-calculator-data-v11";
const LEGACY_STORAGE_KEYS = ["valueon-calculator-data-v9", "valueon-calculator-data-v10"];
const PERSISTED_DATA_VERSION = 11;
const REMOTE_PROJECT_ID = process.env.NEXT_PUBLIC_VALUEON_PROJECT_ID || "default";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_TABLE = process.env.NEXT_PUBLIC_SUPABASE_PROJECTS_TABLE || "valueon_projects";

type PersistedCalculatorData = {
    version?: number;
    inputs?: Partial<AnalysisInputs>;
};

function parsePersistedInputs(raw: string | null): PersistedCalculatorData | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const savedInputs = parsed?.inputs && typeof parsed.inputs === 'object'
            ? parsed.inputs
            : parsed;

        return {
            version: parsed?.version,
            inputs: savedInputs,
        };
    } catch (e) {
        console.error("Failed to parse saved calculator data", e);
        return null;
    }
}

function normalizePersistedData(saved: PersistedCalculatorData) {
    return saved.version === PERSISTED_DATA_VERSION
        ? normalizeInputs(saved.inputs ?? {}, { preserveSavedDefaultItemBasis: true })
        : normalizeInputs(saved.inputs ?? {});
}

function getSupabaseConfig() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    if (!/^[a-zA-Z0-9_]+$/.test(SUPABASE_TABLE)) {
        console.error("NEXT_PUBLIC_SUPABASE_PROJECTS_TABLE must contain only letters, numbers, and underscores.");
        return null;
    }

    return {
        url: SUPABASE_URL.replace(/\/$/, ""),
        key: SUPABASE_ANON_KEY,
        table: SUPABASE_TABLE,
    };
}

function getSupabaseHeaders(contentType = false) {
    const config = getSupabaseConfig();
    if (!config) return null;

    return {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        ...(contentType ? { "Content-Type": "application/json" } : {}),
    };
}

async function loadRemoteData(): Promise<PersistedCalculatorData | null | "not-found"> {
    const config = getSupabaseConfig();
    const headers = getSupabaseHeaders();
    if (!config || !headers) return null;

    const idFilter = encodeURIComponent(`eq.${REMOTE_PROJECT_ID}`);
    const response = await fetch(
        `${config.url}/rest/v1/${config.table}?id=${idFilter}&select=id,data,version,updated_at&limit=1`,
        {
            headers,
            cache: "no-store",
        }
    );

    if (!response.ok) {
        console.error("Failed to load Supabase project data", await response.text());
        return null;
    }

    const rows = await response.json() as Array<{
        data: Partial<AnalysisInputs>;
        version?: number;
    }>;
    const row = rows[0];

    return row ? { inputs: row.data, version: row.version } : "not-found";
}

async function saveRemoteData(inputs: AnalysisInputs, signal: AbortSignal) {
    const config = getSupabaseConfig();
    const headers = getSupabaseHeaders(true);
    if (!config || !headers) return;

    const response = await fetch(
        `${config.url}/rest/v1/${config.table}?on_conflict=id`,
        {
            method: "POST",
            headers: {
                ...headers,
                Prefer: "resolution=merge-duplicates,return=minimal",
            },
            body: JSON.stringify({
                id: REMOTE_PROJECT_ID,
                data: inputs,
                version: PERSISTED_DATA_VERSION,
            }),
            signal,
        }
    );

    if (!response.ok) {
        console.error("Failed to save Supabase project data", await response.text());
    }
}

function normalizeInputs(
    inputs: Partial<AnalysisInputs>,
    options: { preserveSavedDefaultItemBasis?: boolean } = {}
): AnalysisInputs {
    const savedCategories = Array.isArray(inputs.advancedCategories) ? inputs.advancedCategories : [];
    const savedCategoryById = new Map(savedCategories.map((category) => [category.id, category]));
    const defaultCategoryIds = new Set(defaultValues.advancedCategories.map((category) => category.id));
    const deletedDefaultCategoryIds = new Set(inputs.deletedDefaultCategoryIds ?? []);
    const deletedDefaultItemIds = inputs.deletedDefaultItemIds ?? {};

    const mergedCategories = defaultValues.advancedCategories.filter((defaultCategory) => {
        return !deletedDefaultCategoryIds.has(defaultCategory.id);
    }).map((defaultCategory) => {
        const savedCategory = savedCategoryById.get(defaultCategory.id);
        if (!savedCategory) return defaultCategory;

        const savedItemById = new Map(savedCategory.items?.map((item) => [item.id, item]) ?? []);
        const deletedItemIds = new Set(deletedDefaultItemIds[defaultCategory.id] ?? []);
        const mergedItems = defaultCategory.items.filter((defaultItem) => {
            return !deletedItemIds.has(defaultItem.id);
        }).map((defaultItem) => {
            const savedItem = savedItemById.get(defaultItem.id);
            if (!savedItem) return defaultItem;

            return {
                ...defaultItem,
                ...savedItem,
                calculationBasis: options.preserveSavedDefaultItemBasis
                    ? (savedItem.calculationBasis ?? defaultItem.calculationBasis ?? 'fixed')
                    : (defaultItem.calculationBasis ?? 'fixed'),
            };
        });
        const customItems = (savedCategory.items ?? []).filter(
            (item) => !defaultCategory.items.some((defaultItem) => defaultItem.id === item.id)
        );

        return {
            ...defaultCategory,
            ...savedCategory,
            items: [...mergedItems, ...customItems],
        };
    });
    const customCategories = savedCategories.filter((category) => !defaultCategoryIds.has(category.id));

    const savedUnitTypes = Array.isArray(inputs.unitTypes) ? inputs.unitTypes : [];
    const defaultUnitTypeIds = new Set(defaultValues.unitTypes.map((unitType) => unitType.id));
    const mergedDefaultUnitTypes = defaultValues.unitTypes.map((defaultType) => {
        const savedType = savedUnitTypes.find((type) => type.id === defaultType.id);
        return savedType ? { ...defaultType, ...savedType } : defaultType;
    });
    const customUnitTypes = savedUnitTypes.filter((type) => !defaultUnitTypeIds.has(type.id));
    const mergedUnitTypes = [...mergedDefaultUnitTypes, ...customUnitTypes];
    const unitAreaById = new Map(mergedUnitTypes.map((unitType) => [unitType.id, unitType.supplyArea]));
    const mergedAllocations = defaultValues.unitAllocations.map((defaultAllocation) => {
        const savedAllocation = inputs.unitAllocations?.find((allocation) => allocation.id === defaultAllocation.id);
        const mergedAllocation = savedAllocation ? { ...defaultAllocation, ...savedAllocation } : defaultAllocation;
        const area = unitAreaById.get(mergedAllocation.unitTypeId) || 0;
        const savedPricePerPyung = savedAllocation?.targetPricePerPyung
            ?? (area > 0 && savedAllocation?.fixedTotalPrice ? Math.round(savedAllocation.fixedTotalPrice / area) : undefined);
        const defaultPricePerPyung = defaultAllocation.targetPricePerPyung
            ?? (area > 0 && defaultAllocation.fixedTotalPrice ? Math.round(defaultAllocation.fixedTotalPrice / area) : undefined);

        return {
            ...mergedAllocation,
            targetPricePerPyung: savedPricePerPyung ?? defaultPricePerPyung,
            fixedTotalPrice: undefined,
        };
    });
    const customAllocations = (inputs.unitAllocations ?? []).filter(
        (alloc) => !defaultValues.unitAllocations.some((da) => da.id === alloc.id)
    );

    return {
        ...defaultValues,
        ...inputs,
        advancedCategories: [...mergedCategories, ...customCategories],
        unitTypes: mergedUnitTypes,
        unitAllocations: [...mergedAllocations, ...customAllocations],
        fundingPlan: Array.isArray(inputs.fundingPlan) ? inputs.fundingPlan : defaultValues.fundingPlan,
        incomeCategoryMetadata: (inputs.incomeCategoryMetadata || defaultValues.incomeCategoryMetadata || []).map(defaultMeta => {
            const savedMeta = (inputs.incomeCategoryMetadata || []).find(m => m.id === defaultMeta.id);
            return savedMeta ? { ...defaultMeta, ...savedMeta } : defaultMeta;
        }),
    };
}

const defaultCategoryIds = new Set(defaultValues.advancedCategories.map((category) => category.id));
const defaultUnitTypeIds = new Set(defaultValues.unitTypes.map((unitType) => unitType.id));
const defaultItemIdsByCategory = new Map(
    defaultValues.advancedCategories.map((category) => [
        category.id,
        new Set(category.items.map((item) => item.id)),
    ])
);

function isDefaultCategory(categoryId: string) {
    return defaultCategoryIds.has(categoryId);
}

function isDefaultItem(categoryId: string, itemId: string) {
    return defaultItemIdsByCategory.get(categoryId)?.has(itemId) ?? false;
}

function addUniqueId(ids: string[] | undefined, id: string) {
    return ids?.includes(id) ? ids : [...(ids ?? []), id];
}

function isItemLocked(categories: CostCategory[], categoryId: string, itemId: string) {
    return categories
        .find((category) => category.id === categoryId)
        ?.items.find((item) => item.id === itemId)
        ?.isLocked === true;
}

export function useCalculator() {
    const [inputs, setInputs] = useState<AnalysisInputs>(defaultValues);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadSavedData = async () => {
            const localSaved = parsePersistedInputs(localStorage.getItem(STORAGE_KEY));

            try {
                const remoteSaved = await loadRemoteData();
                if (remoteSaved && remoteSaved !== "not-found") {
                    if (!cancelled) {
                        setInputs(normalizePersistedData(remoteSaved));
                        setIsLoaded(true);
                    }
                    return;
                }
            } catch (e) {
                console.error("Failed to load Supabase project data", e);
            }

            if (localSaved?.inputs) {
                if (!cancelled) {
                    setInputs(normalizePersistedData(localSaved));
                }
            } else {
                LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
            }

            if (!cancelled) {
                setIsLoaded(true);
            }
        };

        const timer = window.setTimeout(() => {
            void loadSavedData();
        }, 0);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, []);

    // Save to localStorage whenever inputs change
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: PERSISTED_DATA_VERSION,
            inputs,
        }));
    }, [inputs, isLoaded]);

    useEffect(() => {
        if (!isLoaded) return;

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            saveRemoteData(inputs, controller.signal).catch((e) => {
                if (e?.name !== "AbortError") {
                    console.error("Failed to save Supabase project data", e);
                }
            });
        }, 600);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [inputs, isLoaded]);

    const resetData = () => {
        if (confirm("모든 데이터를 초기값으로 되돌리시겠습니까? 입력한 내용이 모두 사라집니다.")) {
            setInputs(defaultValues);
            localStorage.removeItem(STORAGE_KEY);
            LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
        }
    };

    // Helper to update basic nested inputs
    const updateInput = (
        section: keyof AnalysisInputs,
        field: string,
        value: number | boolean | CostCategory[] | UnitAllocation[]
    ) => {
        setInputs((prev) => {
            const next = {
                ...prev,
                [section]: {
                    ...(prev[section] as object),
                    [field]: value,
                },
            };

            // Sync Simple Mode (variableCosts) to Advanced Mode (advancedCategories)
            if (section === 'variableCosts') {
                const newCategories = [...next.advancedCategories];

                if (field === 'landPricePerPyung') {
                    // Update 토지매입비 in land category
                    const landCat = newCategories.find(c => c.id === 'land');
                    if (landCat) {
                        landCat.items = landCat.items.map(item =>
                            item.id === 'l1' && !item.isLocked ? { ...item, amount: value as number, calculationBasis: 'per_site_private' } : item
                        );
                    }
                } else if (field === 'constCostPerPyung') {
                    // Update 직접공사비 in construction category
                    const constCat = newCategories.find(c => c.id === 'construction');
                    if (constCat) {
                        constCat.items = constCat.items.map(item =>
                            item.id === 'c1' && !item.isLocked ? { ...item, amount: value as number, calculationBasis: 'per_floor_pyung' } : item
                        );
                    }
                }
                next.advancedCategories = newCategories;
            }

            return next;
        });
    };

    const toggleAdvancedMode = (isAdvanced: boolean) => {
        setInputs((prev) => ({
            ...prev,
            isAdvancedMode: isAdvanced,
        }));
    };

    const updateCategoryItem = (categoryId: string, itemId: string, newValue: number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, amount: newValue };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const updateCategoryItemBasis = (categoryId: string, itemId: string, basis: CostItem['calculationBasis']) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, calculationBasis: basis };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const updateCategoryItemArea = (categoryId: string, itemId: string, area: number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, manualArea: area };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const addCategoryItem = (categoryId: string, name: string, amount: number) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                const newItem: CostItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    amount,
                    calculationBasis: recommendCalculationBasis(name, categoryId),
                };
                return { ...cat, items: [...cat.items, newItem] };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const removeCategoryItem = (categoryId: string, itemId: string) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return { ...cat, items: cat.items.filter((item) => item.id !== itemId) };
            });

            if (!isDefaultItem(categoryId, itemId)) {
                return { ...prev, advancedCategories: newCategories };
            }

            return {
                ...prev,
                advancedCategories: newCategories,
                deletedDefaultItemIds: {
                    ...(prev.deletedDefaultItemIds ?? {}),
                    [categoryId]: addUniqueId(prev.deletedDefaultItemIds?.[categoryId], itemId),
                },
            };
        });
    };

    const addCostCategory = (title: string) => {
        setInputs((prev) => ({
            ...prev,
            advancedCategories: [
                ...prev.advancedCategories,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    title,
                    items: []
                }
            ]
        }));
    };

    const removeCostCategory = (id: string) => {
        setInputs((prev) => {
            if (prev.advancedCategories.some((cat) => cat.id === id && cat.items.some((item) => item.isLocked))) {
                return prev;
            }

            return {
                ...prev,
                advancedCategories: prev.advancedCategories.filter(cat => cat.id !== id),
                deletedDefaultCategoryIds: isDefaultCategory(id)
                    ? addUniqueId(prev.deletedDefaultCategoryIds, id)
                    : prev.deletedDefaultCategoryIds,
            };
        });
    };

    // Sub-Item Handlers
    const addSubItem = (categoryId: string, itemId: string, name: string, amount: number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;

                        const newSubItems = [
                            ...(item.subItems || []),
                            { id: Math.random().toString(36).substr(2, 9), name, amount }
                        ];
                        const newTotal = newSubItems.reduce((sum, sub) => sum + sub.amount, 0);

                        return { ...item, subItems: newSubItems, amount: newTotal, calculationBasis: 'fixed' as const }; // Force fixed when using sub-items
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const updateSubItem = (categoryId: string, itemId: string, subItemId: string, field: 'name' | 'amount', value: string | number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;

                        const newSubItems = (item.subItems || []).map(sub => {
                            if (sub.id !== subItemId) return sub;
                            return { ...sub, [field]: value };
                        });

                        const newTotal = newSubItems.reduce((sum, sub) => sum + sub.amount, 0);

                        return { ...item, subItems: newSubItems, amount: newTotal, calculationBasis: 'fixed' as const };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const removeSubItem = (categoryId: string, itemId: string, subItemId: string) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;

                        const newSubItems = (item.subItems || []).filter(sub => sub.id !== subItemId);
                        const newTotal = newSubItems.reduce((sum, sub) => sum + sub.amount, 0);

                        return { ...item, subItems: newSubItems, amount: newTotal, calculationBasis: newSubItems.length > 0 ? 'fixed' as const : item.calculationBasis };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Update category memo
    const updateCategoryMemo = (categoryId: string, memo: string) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return { ...cat, note: memo };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Update sub-item memo
    const updateSubItemMemo = (categoryId: string, itemId: string, subItemId: string, memo: string) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        const newSubItems = (item.subItems || []).map(sub => {
                            if (sub.id !== subItemId) return sub;
                            return { ...sub, note: memo };
                        });
                        return { ...item, subItems: newSubItems };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Update unit type total units and redistribute allocations proportionally
    const updateUnitTypeTotalUnits = (unitTypeId: string, newTotal: number) => {
        setInputs((prev) => {
            const unitType = prev.unitTypes.find(u => u.id === unitTypeId);
            if (!unitType) return prev;

            const oldTotal = unitType.totalUnits || 0;
            if (oldTotal === 0 || newTotal === oldTotal) {
                // Just update the totalUnits without redistribution
                return {
                    ...prev,
                    unitTypes: prev.unitTypes.map(ut =>
                        ut.id === unitTypeId ? { ...ut, totalUnits: newTotal } : ut
                    ),
                };
            }

            const ratio = newTotal / oldTotal;

            // Redistribute allocations for this unit type proportionally
            const updatedAllocations = prev.unitAllocations.map(alloc => {
                if (alloc.unitTypeId !== unitTypeId) return alloc;
                const newCount = Math.round(alloc.count * ratio);
                return { ...alloc, count: Math.max(0, newCount) };
            });

            // Adjust rounding errors to match exact total
            const allocsForType = updatedAllocations.filter(a => a.unitTypeId === unitTypeId);
            const currentSum = allocsForType.reduce((sum, a) => sum + a.count, 0);
            const diff = newTotal - currentSum;

            if (diff !== 0 && allocsForType.length > 0) {
                // Add/subtract difference to the largest allocation
                const largestAlloc = allocsForType.reduce((a, b) => a.count > b.count ? a : b);
                const idx = updatedAllocations.findIndex(a => a.id === largestAlloc.id);
                if (idx >= 0) {
                    updatedAllocations[idx] = {
                        ...updatedAllocations[idx],
                        count: Math.max(0, updatedAllocations[idx].count + diff)
                    };
                }
            }

            return {
                ...prev,
                unitTypes: prev.unitTypes.map(ut =>
                    ut.id === unitTypeId ? { ...ut, totalUnits: newTotal } : ut
                ),
                unitAllocations: updatedAllocations,
            };
        });
    };

    // Unit Mix Updater - with linked count adjustment for apartments
    const updateUnitAllocation = (allocId: string, field: keyof UnitAllocation, value: number | string) => {
        setInputs((prev) => {
            const targetAlloc = prev.unitAllocations.find(a => a.id === allocId);
            if (!targetAlloc) return prev;

            const unitType = prev.unitTypes.find(u => u.id === targetAlloc.unitTypeId);

            // For non-count fields or rental units, just update directly
            if (field !== 'count' || !unitType || unitType.category === 'RENTAL' || !unitType.totalUnits) {
                return {
                    ...prev,
                    unitAllocations: prev.unitAllocations.map((alloc) =>
                        alloc.id === allocId ? { ...alloc, [field]: value } : alloc
                    ),
                };
            }

            // Keep the selected apartment type allocated exactly across tiers.
            const parsedCount = typeof value === 'number' ? value : parseInt(value as string, 10);
            const newCount = Math.max(0, Math.min(unitType.totalUnits, Number.isFinite(parsedCount) ? parsedCount : 0));
            const tierPriority: Record<UnitAllocation['tier'], number> = {
                '2nd': 0,
                General: 1,
                '1st': 2,
            };
            const balancingAllocs = prev.unitAllocations
                .filter(a => a.unitTypeId === targetAlloc.unitTypeId && a.id !== targetAlloc.id)
                .sort((a, b) => tierPriority[a.tier] - tierPriority[b.tier]);

            const adjustedCounts: Record<string, number> = { [allocId]: newCount };
            const currentTotal = newCount + balancingAllocs.reduce((sum, alloc) => sum + alloc.count, 0);
            let remaining = unitType.totalUnits - currentTotal;

            for (const other of balancingAllocs) {
                if (remaining === 0) break;

                const currentCount = adjustedCounts[other.id] ?? other.count;
                if (remaining > 0) {
                    adjustedCounts[other.id] = currentCount + remaining;
                    remaining = 0;
                } else {
                    const decrease = Math.min(currentCount, -remaining);
                    adjustedCounts[other.id] = currentCount - decrease;
                    remaining += decrease;
                }
            }

            return {
                ...prev,
                unitAllocations: prev.unitAllocations.map((alloc) => {
                    if (adjustedCounts[alloc.id] !== undefined) {
                        return { ...alloc, count: adjustedCounts[alloc.id] };
                    }
                    return alloc;
                }),
            };
        });
    };

    const addFundingPlanItem = (category: FundingCategory = "bridge") => {
        setInputs((prev) => ({
            ...prev,
            fundingPlan: [
                ...prev.fundingPlan,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    category,
                    name: "신규 조달",
                    amount: 0,
                    interestRate: category === "pf" ? prev.variableCosts.interestRatePF : prev.variableCosts.interestRateBridge,
                    termMonths: 12,
                    feeRate: 0,
                    repaymentSource: "",
                },
            ],
        }));
    };

    const updateFundingPlanItem = <K extends keyof FundingPlanItem>(
        itemId: string,
        field: K,
        value: FundingPlanItem[K]
    ) => {
        setInputs((prev) => ({
            ...prev,
            fundingPlan: prev.fundingPlan.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
            ),
        }));
    };

    const removeFundingPlanItem = (itemId: string) => {
        setInputs((prev) => ({
            ...prev,
            fundingPlan: prev.fundingPlan.filter((item) => item.id !== itemId),
        }));
    };

    const result = useMemo(() => calculateAnalysisResult(inputs), [inputs]);

    const updateCategoryItemCondition = (categoryId: string, itemId: string, allocationId: string, amount: number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return {
                            ...item,
                            mixConditions: {
                                ...(item.mixConditions || {}),
                                [allocationId]: amount
                            }
                        };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    }

    const updateCategoryItemRate = (categoryId: string, itemId: string, rate: number) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, applicationRate: rate };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const updateCategoryItemMemo = (categoryId: string, itemId: string, memo: string) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, note: memo };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Rename cost item
    const updateCategoryItemName = (categoryId: string, itemId: string, newName: string) => {
        setInputs((prev) => {
            if (isItemLocked(prev.advancedCategories, categoryId, itemId)) return prev;

            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, name: newName };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Rename category
    const updateCategoryTitle = (categoryId: string, newTitle: string) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return { ...cat, title: newTitle };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const updateIncomeCategoryTitle = (id: string, title: string) => {
        setInputs((prev) => ({
            ...prev,
            incomeCategoryMetadata: (prev.incomeCategoryMetadata || []).map(m =>
                m.id === id ? { ...m, title } : m
            )
        }));
    };

    const updateIncomeCategoryNote = (id: string, note: string) => {
        setInputs((prev) => ({
            ...prev,
            incomeCategoryMetadata: (prev.incomeCategoryMetadata || []).map(m =>
                m.id === id ? { ...m, note } : m
            )
        }));
    };

    const updateUnitTypeName = (unitTypeId: string, name: string) => {
        setInputs((prev) => ({
            ...prev,
            unitTypes: prev.unitTypes.map((unitType) =>
                unitType.id === unitTypeId ? { ...unitType, name } : unitType
            ),
        }));
    };

    const addUnitAllocation = (unitTypeId: string, tier: MemberTier) => {
        setInputs((prev) => {
            const id = `a-${Date.now()}`;
            const newAllocation: UnitAllocation = {
                id,
                unitTypeId,
                tier,
                count: 0,
                targetPricePerPyung: 0,
            };
            return {
                ...prev,
                unitAllocations: [...prev.unitAllocations, newAllocation],
            };
        });
    };

    const addMiscIncomeItem = ({
        name,
        amount,
        count = 1,
        note,
    }: {
        name: string;
        amount: number;
        count?: number;
        note?: string;
    }) => {
        setInputs((prev) => {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const miscItemCount = prev.unitTypes.filter((unitType) => unitType.category === "MISC" && unitType.id !== "u-misc").length;
            const itemName = name.trim() || `기타수입 ${miscItemCount + 1}`;
            const unitTypeId = `u-misc-${uniqueId}`;
            const allocationId = `a-misc-${uniqueId}`;
            const newUnitType: UnitType = {
                id: unitTypeId,
                name: itemName,
                supplyArea: 1,
                exclusiveAreaM2: 0,
                category: "MISC",
                totalUnits: count,
            };
            const newAllocation: UnitAllocation = {
                id: allocationId,
                unitTypeId,
                tier: "General",
                count,
                targetPricePerPyung: amount,
                note,
            };

            return {
                ...prev,
                unitTypes: [...prev.unitTypes, newUnitType],
                unitAllocations: [...prev.unitAllocations, newAllocation],
            };
        });
    };

    const deleteUnitAllocation = (id: string) => {
        setInputs((prev) => {
            const targetAllocation = prev.unitAllocations.find((allocation) => allocation.id === id);
            const unitAllocations = prev.unitAllocations.filter((allocation) => allocation.id !== id);
            const shouldRemoveUnitType = targetAllocation
                && !defaultUnitTypeIds.has(targetAllocation.unitTypeId)
                && !unitAllocations.some((allocation) => allocation.unitTypeId === targetAllocation.unitTypeId);

            return {
                ...prev,
                unitAllocations,
                unitTypes: shouldRemoveUnitType
                    ? prev.unitTypes.filter((unitType) => unitType.id !== targetAllocation.unitTypeId)
                    : prev.unitTypes,
            };
        });
    };

    // Reorder items
    const reorderCategoryItem = (categoryId: string, activeId: string, overId: string) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;

                const oldIndex = cat.items.findIndex((item) => item.id === activeId);
                const newIndex = cat.items.findIndex((item) => item.id === overId);

                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return cat;

                const newItems = [...cat.items];
                const [movedItem] = newItems.splice(oldIndex, 1);
                newItems.splice(newIndex, 0, movedItem);

                return { ...cat, items: newItems };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const toggleCategoryItemLock = (categoryId: string, itemId: string, locked: boolean) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) => {
                        if (item.id !== itemId) return item;
                        return { ...item, isLocked: locked };
                    }),
                };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    // Reorder categories
    const reorderCostCategory = (activeId: string, overId: string) => {
        setInputs((prev) => {
            const oldIndex = prev.advancedCategories.findIndex((cat) => cat.id === activeId);
            const newIndex = prev.advancedCategories.findIndex((cat) => cat.id === overId);

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;

            const newCategories = [...prev.advancedCategories];
            const [movedCategory] = newCategories.splice(oldIndex, 1);
            newCategories.splice(newIndex, 0, movedCategory);

            return { ...prev, advancedCategories: newCategories };
        });
    };

    return {
        inputs,
        updateInput,
        toggleAdvancedMode,
        updateCategoryItem,
        updateCategoryItemBasis,
        updateCategoryItemCondition,
        updateCategoryItemRate,
        updateCategoryItemMemo,
        toggleCategoryItemLock,
        addCategoryItem,
        removeCategoryItem,
        addCostCategory,
        removeCostCategory,
        addSubItem,
        updateSubItem,
        removeSubItem,
        updateCategoryMemo,
        updateSubItemMemo,
        updateCategoryItemName,
        updateCategoryTitle,
        reorderCategoryItem,
        updateIncomeCategoryTitle,
        updateIncomeCategoryNote,
        updateUnitTypeName,
        addUnitAllocation,
        addMiscIncomeItem,
        deleteUnitAllocation,
        updateUnitAllocation,
        updateUnitTypeTotalUnits,
        addFundingPlanItem,
        updateFundingPlanItem,
        removeFundingPlanItem,
        resetData,
        result,
        reorderCostCategory,
        updateCategoryItemArea,
    };

}
