import { useState, useMemo, useEffect } from "react";
import { AnalysisInputs, AnalysisResult, CostCategory, CostItem, UnitAllocation } from "@/types";
import { defaultValues } from "@/constants/defaultValues";

const STORAGE_KEY = "valueon-calculator-data-v7"; // Bump version to reset data

export function useCalculator() {
    const [inputs, setInputs] = useState<AnalysisInputs>(defaultValues);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Merge with default values to ensure structure integrity
                // For unitTypes and allocations, merge by ID to include new defaults
                const mergedUnitTypes = defaultValues.unitTypes.map(dt => {
                    const savedType = parsed.unitTypes?.find((st: { id: string }) => st.id === dt.id);
                    return savedType ? { ...dt, ...savedType } : dt;
                });
                const mergedAllocations = defaultValues.unitAllocations.map(da => {
                    const savedAlloc = parsed.unitAllocations?.find((sa: { id: string }) => sa.id === da.id);
                    return savedAlloc ? { ...da, ...savedAlloc } : da;
                });
                // eslint-disable-next-line react-hooks/exhaustive-deps
                setInputs({
                    ...defaultValues,
                    ...parsed,
                    unitTypes: mergedUnitTypes,
                    unitAllocations: mergedAllocations,
                });
            } catch (e) {
                console.error("Failed to load saved data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever inputs change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
        }
    }, [inputs, isLoaded]);

    const resetData = () => {
        if (confirm("모든 데이터를 초기값으로 되돌리시겠습니까? 입력한 내용이 모두 사라집니다.")) {
            setInputs(defaultValues);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Helper to update basic nested inputs
    const updateInput = (
        section: keyof AnalysisInputs,
        field: string,
        value: number | boolean | CostCategory[] | UnitAllocation[]
    ) => {
        setInputs((prev) => ({
            ...prev,
            [section]: {
                ...(prev[section] as object),
                [field]: value,
            },
        }));
    };

    const toggleAdvancedMode = (isAdvanced: boolean) => {
        setInputs((prev) => ({
            ...prev,
            isAdvancedMode: isAdvanced,
        }));
    };

    const updateCategoryItem = (categoryId: string, itemId: string, newValue: number) => {
        setInputs((prev) => {
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

    const addCategoryItem = (categoryId: string, name: string, amount: number) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                const newItem: CostItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    name,
                    amount,
                };
                return { ...cat, items: [...cat.items, newItem] };
            });
            return { ...prev, advancedCategories: newCategories };
        });
    };

    const removeCategoryItem = (categoryId: string, itemId: string) => {
        setInputs((prev) => {
            const newCategories = prev.advancedCategories.map((cat) => {
                if (cat.id !== categoryId) return cat;
                return { ...cat, items: cat.items.filter((item) => item.id !== itemId) };
            });
            return { ...prev, advancedCategories: newCategories };
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
        setInputs((prev) => ({
            ...prev,
            advancedCategories: prev.advancedCategories.filter(cat => cat.id !== id)
        }));
    };

    // Sub-Item Handlers
    const addSubItem = (categoryId: string, itemId: string, name: string, amount: number) => {
        setInputs((prev) => {
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

            // Linked adjustment for apartment count changes
            const newCount = typeof value === 'number' ? value : parseInt(value as string, 10) || 0;
            const oldCount = targetAlloc.count;
            const diff = newCount - oldCount;

            if (diff === 0) return prev;

            // Get all allocations for this unit type (same apartment type)
            const sameTypeAllocs = prev.unitAllocations.filter(
                a => a.unitTypeId === targetAlloc.unitTypeId && a.tier !== targetAlloc.tier
            );

            // Sort by priority: 2nd first, then General
            const sortedOthers = sameTypeAllocs.sort((a, b) => {
                if (a.tier === '2nd') return -1;
                if (b.tier === '2nd') return 1;
                return 0;
            });

            // Distribute the difference
            let remaining = -diff; // negative because we take from others
            const adjustments: Record<string, number> = {};

            for (const other of sortedOthers) {
                if (remaining === 0) break;
                const available = other.count;
                const take = Math.min(available, Math.max(0, remaining));
                const give = Math.max(-available, Math.min(0, remaining));
                adjustments[other.id] = remaining > 0 ? -take : -give;
                remaining -= remaining > 0 ? take : give;
            }

            // Apply changes
            return {
                ...prev,
                unitAllocations: prev.unitAllocations.map((alloc) => {
                    if (alloc.id === allocId) {
                        return { ...alloc, count: newCount };
                    }
                    if (adjustments[alloc.id] !== undefined) {
                        return { ...alloc, count: Math.max(0, alloc.count + adjustments[alloc.id]) };
                    }
                    return alloc;
                }),
            };
        });
    };

    const result: AnalysisResult = useMemo(() => {
        // 1. Calculate Total Project Cost
        let totalProjectCost = 0;
        let costPerPyung = 0;
        let dynamicBreakdown: { name: string; value: number; fill: string; }[] = [];
        const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57"];

        // Helper function to calculate sum for a single category item
        const calculateItemAmount = (item: CostItem) => {
            let itemAmount = item.amount;
            if (item.calculationBasis === 'per_unit') {
                itemAmount = item.amount * inputs.projectTarget.totalHouseholds;
            } else if (item.calculationBasis === 'per_floor_pyung') {
                itemAmount = item.amount * inputs.projectTarget.totalFloorArea;
            } else if (item.calculationBasis === 'per_site_pyung') {
                itemAmount = item.amount * inputs.projectTarget.totalLandArea;
            } else if (item.calculationBasis === 'mix_linked' && item.mixConditions) {
                itemAmount = inputs.unitAllocations.reduce((subAcc, alloc) => {
                    const specificAmount = item.mixConditions?.[alloc.id] || 0;
                    return subAcc + (alloc.count * specificAmount);
                }, 0);
            }

            // Apply Application Rate (Default 100%)
            const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
            return itemAmount * (rate / 100);
        };

        // ALWAYS calculate using Advanced Categories for consistency with Expense Page
        dynamicBreakdown = inputs.advancedCategories.map((cat, index) => {
            const catSum = cat.items.reduce((acc, item) => acc + calculateItemAmount(item), 0);
            totalProjectCost += catSum;
            return {
                name: cat.title,
                value: catSum,
                fill: colors[index % colors.length]
            };
        });

        costPerPyung = inputs.projectTarget.totalFloorArea > 0
            ? totalProjectCost / inputs.projectTarget.totalFloorArea
            : 0;


        // 2. Unit Mix Pricing Solver
        // Initialize results array
        const calculatedUnitPricing: NonNullable<AnalysisResult['unitPricing']> = [];

        // Helper to get unit area
        const getUnitArea = (typeId: string) => inputs.unitTypes.find(u => u.id === typeId)?.supplyArea || 0;
        const getUnitName = (typeId: string) => inputs.unitTypes.find(u => u.id === typeId)?.name || "?";

        // a. Calculate General Sales Revenue
        let generalRevenue = 0;
        inputs.unitAllocations.filter(a => a.tier === 'General').forEach(alloc => {
            const area = getUnitArea(alloc.unitTypeId);
            // Prioritize fixedTotalPrice if set
            const calculatedPrice = area * (alloc.targetPricePerPyung || 0);
            const finalPrice = alloc.fixedTotalPrice || calculatedPrice;
            const revenue = alloc.count * finalPrice;
            generalRevenue += revenue;

            calculatedUnitPricing.push({
                allocationId: alloc.id,
                unitName: getUnitName(alloc.unitTypeId),
                tier: 'General',
                supplyArea: area,
                totalPrice: finalPrice,
                pricePerPyung: area > 0 ? finalPrice / area : 0,
                revenueContribution: revenue
            });
        });

        // b. Calculate Required Contribution from Members
        const requiredMemberContribution = totalProjectCost - generalRevenue;

        // c. Solve for Base Price (X)
        // Required = (TotalMemberArea * X) + TotalPremiums
        let totalMemberArea = 0;
        let totalPremiums = 0;

        const memberAllocations = inputs.unitAllocations.filter(a => a.tier === '1st' || a.tier === '2nd');

        memberAllocations.forEach(alloc => {
            const area = getUnitArea(alloc.unitTypeId);
            totalMemberArea += alloc.count * area;

            if (alloc.tier === '2nd') {
                const premium = alloc.premium || 0;
                totalPremiums += alloc.count * premium;
            }
        });

        // Avoid division by zero
        let basePricePerPyung = 0;
        if (totalMemberArea > 0) {
            // Required - TotalPremiums = X * TotalMemberArea
            // X = (Required - TotalPremiums) / TotalMemberArea
            basePricePerPyung = (requiredMemberContribution - totalPremiums) / totalMemberArea;
        }

        // d. Populate Pricing Results
        memberAllocations.forEach(alloc => {
            const area = getUnitArea(alloc.unitTypeId);
            let calculatedPrice = area * basePricePerPyung;

            if (alloc.tier === '2nd') {
                calculatedPrice += (alloc.premium || 0);
            }

            // Prioritize fixedTotalPrice if set by user
            const finalPrice = alloc.fixedTotalPrice || calculatedPrice;

            calculatedUnitPricing.push({
                allocationId: alloc.id,
                unitName: getUnitName(alloc.unitTypeId),
                tier: alloc.tier,
                supplyArea: area,
                totalPrice: finalPrice,
                pricePerPyung: area > 0 ? finalPrice / area : 0,
                revenueContribution: finalPrice * alloc.count
            });
        });

        // Sort pricing for display consistency? (Optional)
        // Map back to estimatedPrices for dashboard basic view (using 1st member 59/84 as reference)
        const type59Alloc = calculatedUnitPricing?.find(p => p.unitName.includes("59") && p.tier === '1st');
        const type84Alloc = calculatedUnitPricing?.find(p => p.unitName.includes("84") && p.tier === '1st');

        const estType59 = type59Alloc ? type59Alloc.totalPrice : costPerPyung * 25;
        const estType84 = type84Alloc ? type84Alloc.totalPrice : costPerPyung * 34;

        // e. Calculate Total Revenue (Apartment + Rental)
        // Matching UnitMixStats logic: Check Fixed Price -> Calculated Price -> Rental
        let totalRevenue = 0;

        inputs.unitAllocations.forEach(alloc => {
            const ut = inputs.unitTypes.find(u => u.id === alloc.unitTypeId);
            if (!ut) return;

            // 1. Rental Logic (Always separate)
            if (ut.category === 'RENTAL') {
                if (alloc.targetPricePerPyung) {
                    totalRevenue += alloc.targetPricePerPyung * ut.supplyArea * alloc.count;
                }
                return;
            }

            // 2. Fixed Price Logic (Overrides calculated pricing)
            if (alloc.fixedTotalPrice) {
                totalRevenue += alloc.fixedTotalPrice * alloc.count;
                return;
            }

            // 3. Calculated Price Logic
            const pricing = calculatedUnitPricing.find(p => p.allocationId === alloc.id);
            if (pricing) {
                totalRevenue += pricing.totalPrice * alloc.count;
            }
        });


        return {
            totalProjectCost,
            costPerPyung,
            estimatedPrices: {
                type59: estType59,
                type84: estType84,
            },
            costBreakdown: dynamicBreakdown,
            unitPricing: calculatedUnitPricing,
            totalRevenue // Return calculated revenue
        };
    }, [inputs]);

    const updateCategoryItemCondition = (categoryId: string, itemId: string, allocationId: string, amount: number) => {
        setInputs((prev) => {
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
        updateUnitAllocation,
        updateUnitTypeTotalUnits,
        resetData,
        result,
        reorderCostCategory,
    };

}
