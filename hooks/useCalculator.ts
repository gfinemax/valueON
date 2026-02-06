import { useState, useMemo, useEffect } from "react";
import { AnalysisInputs, AnalysisResult, CostCategory, CostItem, UnitAllocation, ProjectTarget } from "@/types";
import { defaultValues } from "@/constants/defaultValues";

const STORAGE_KEY = "valueon-calculator-data-v1";

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
                setInputs({ ...defaultValues, ...parsed });
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

    // Unit Mix Updater
    const updateUnitAllocation = (allocId: string, field: keyof UnitAllocation, value: number) => {
        setInputs((prev) => ({
            ...prev,
            unitAllocations: prev.unitAllocations.map((alloc) =>
                alloc.id === allocId ? { ...alloc, [field]: value } : alloc
            ),
        }));
    };

    const result: AnalysisResult = useMemo(() => {
        // 1. Calculate Total Project Cost
        let totalProjectCost = 0;
        let costPerPyung = 0;

        // Cost Breakdown Logic
        let landCost = 0, constCost = 0, licenseCost = 0, contributionCost = 0,
            salesCost = 0, generalCost = 0, financeCost = 0, etcCost = 0;

        if (inputs.isAdvancedMode) {
            const sumCategory = (id: string) => {
                const cat = inputs.advancedCategories.find((c) => c.id === id);
                if (!cat) return 0;

                return cat.items.reduce((acc, item) => {
                    let itemAmount = item.amount;
                    if (item.calculationBasis === 'per_unit') {
                        itemAmount = item.amount * inputs.projectTarget.totalHouseholds;
                    } else if (item.calculationBasis === 'per_floor_pyung') {
                        itemAmount = item.amount * inputs.projectTarget.totalFloorArea;
                    } else if (item.calculationBasis === 'per_site_pyung') {
                        itemAmount = item.amount * inputs.projectTarget.totalLandArea;
                    } else if (item.calculationBasis === 'mix_linked' && item.mixConditions) {
                        // Sum of (count * specific_amount) for each allocation
                        itemAmount = inputs.unitAllocations.reduce((subAcc, alloc) => {
                            const specificAmount = item.mixConditions?.[alloc.id] || 0;
                            return subAcc + (alloc.count * specificAmount);
                        }, 0);
                    }
                    return acc + itemAmount;
                }, 0);
            };

            // Dynamic Calculation for all categories
            inputs.advancedCategories.forEach(cat => {
                const amount = sumCategory(cat.id);
                // Assign to specific vars if needed for specific logic, otherwise just sum
                if (cat.id === 'land') landCost = amount;
                else if (cat.id === 'construction') constCost = amount;
                else if (cat.id === 'license') licenseCost = amount;
                else if (cat.id === 'contribution') contributionCost = amount;
                else if (cat.id === 'sales') salesCost = amount;
                else if (cat.id === 'general') generalCost = amount;
                else if (cat.id === 'finance') financeCost = amount;
                else if (cat.id === 'etc') etcCost = amount;

                totalProjectCost += amount;
            });

        } else {
            // Basic Mode Logic
            const { projectTarget, variableCosts, addedCosts } = inputs;
            landCost = projectTarget.totalLandArea * variableCosts.landPricePerPyung;
            constCost = projectTarget.totalFloorArea * variableCosts.constCostPerPyung;
            const bridgeInterest = landCost * (variableCosts.interestRateBridge / 100);
            const pfInterest = constCost * (variableCosts.interestRatePF / 100);
            financeCost = bridgeInterest + pfInterest;

            const operationFee = addedCosts.operationFeePerUnit * projectTarget.totalHouseholds + addedCosts.pmServiceFeeTotal;
            const contingency = (landCost + constCost) * (addedCosts.contingencyRate / 100);

            generalCost = operationFee; // roughly mapping
            etcCost = contingency + addedCosts.sunkCost;

            totalProjectCost = landCost + constCost + financeCost + generalCost + etcCost;
        }

        costPerPyung = inputs.projectTarget.totalFloorArea > 0
            ? totalProjectCost / inputs.projectTarget.totalFloorArea
            : 0;

        // Unified Breakdown Logic for Chart (runs for both modes now)
        // If in Advanced Mode, use the dynamic categories.
        // If in Basic Mode, map the standard variables to a compatible structure.
        let dynamicBreakdown: { name: string; value: number; fill: string; }[] = [];
        const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#a4de6c", "#d0ed57"];

        if (inputs.isAdvancedMode) {
            dynamicBreakdown = inputs.advancedCategories.map((cat, index) => {
                // Re-calculate or reuse? We need sumCategory but it is defined inside the IF block above.
                // Better to move sumCategory definition UP or re-implement simple sum here.
                // Simple sum is safer since we already calculated total once? No, we need individual values.
                // Let's reuse the logic since we are refactoring.
                // Wait, sumCategory is scoped to the IF block above. 

                // Simpler: Just map the result values we tracked? No, advanced mode has dynamic categories so we can't map 'landCost' variable back easily if user added custom categories.

                // Solution: Move sumCategory definition out of the IF block, OR just recalculate here.
                // Let's recalculate inline to be safe and simple.

                const catSum = cat.items.reduce((acc, item) => {
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
                    return acc + itemAmount;
                }, 0);

                return {
                    name: cat.title,
                    value: catSum,
                    fill: colors[index % colors.length]
                };
            });
        } else {
            // Basic Mode mapping
            dynamicBreakdown = [
                { name: "토지비", value: landCost, fill: "#0088FE" },
                { name: "공사비", value: constCost, fill: "#00C49F" },
                { name: "인허가비", value: licenseCost, fill: "#FFBB28" },
                { name: "부담금", value: contributionCost, fill: "#FF8042" },
                { name: "판매비", value: salesCost, fill: "#8884d8" },
                { name: "금융비", value: financeCost, fill: "#82ca9d" },
                { name: "기타", value: generalCost + etcCost, fill: "#ffc658" },
            ];
        }

        costPerPyung = inputs.projectTarget.totalFloorArea > 0
            ? totalProjectCost / inputs.projectTarget.totalFloorArea
            : 0;


        // 2. Unit Mix Pricing Solver
        // Initialize results array
        let unitPricing: AnalysisResult['unitPricing'] = [];

        // Helper to get unit area
        const getUnitArea = (typeId: string) => inputs.unitTypes.find(u => u.id === typeId)?.supplyArea || 0;
        const getUnitName = (typeId: string) => inputs.unitTypes.find(u => u.id === typeId)?.name || "?";

        // a. Calculate General Sales Revenue
        let generalRevenue = 0;
        inputs.unitAllocations.filter(a => a.tier === 'General').forEach(alloc => {
            const area = getUnitArea(alloc.unitTypeId);
            const revenue = alloc.count * area * (alloc.targetPricePerPyung || 0);
            generalRevenue += revenue;

            unitPricing.push({
                allocationId: alloc.id,
                unitName: getUnitName(alloc.unitTypeId),
                tier: 'General',
                totalPrice: area * (alloc.targetPricePerPyung || 0),
                pricePerPyung: alloc.targetPricePerPyung || 0
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
            let totalPrice = area * basePricePerPyung;

            if (alloc.tier === '2nd') {
                totalPrice += (alloc.premium || 0);
            }

            unitPricing.push({
                allocationId: alloc.id,
                unitName: getUnitName(alloc.unitTypeId),
                tier: alloc.tier,
                totalPrice: totalPrice,
                pricePerPyung: totalPrice / area
            });
        });

        // Sort pricing for display consistency? (Optional)
        // Map back to estimatedPrices for dashboard basic view (using 1st member 59/84 as reference)
        const type59Alloc = unitPricing.find(p => p.unitName.includes("59") && p.tier === '1st');
        const type84Alloc = unitPricing.find(p => p.unitName.includes("84") && p.tier === '1st');

        const estType59 = type59Alloc ? type59Alloc.totalPrice : costPerPyung * 25;
        const estType84 = type84Alloc ? type84Alloc.totalPrice : costPerPyung * 34;


        return {
            totalProjectCost,
            costPerPyung,
            estimatedPrices: {
                type59: estType59,
                type84: estType84,
            },
            costBreakdown: dynamicBreakdown,
            unitPricing
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

    return {
        inputs,
        updateInput,
        toggleAdvancedMode,
        updateCategoryItem,
        updateCategoryItemBasis,
        updateCategoryItemCondition,
        addCategoryItem,
        removeCategoryItem,
        addCostCategory,
        removeCostCategory,
        updateUnitAllocation,
        resetData,
        result,
    };

}
