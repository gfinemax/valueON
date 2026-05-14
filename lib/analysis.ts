import { AnalysisInputs, AnalysisResult, CostItem } from "@/types";
import { getCategoryHexColor } from "@/lib/colors";

type CostCalculationContext = {
  projectTarget: AnalysisInputs["projectTarget"];
  unitAllocations?: AnalysisInputs["unitAllocations"];
};

export function calculateCostItemAmount(item: CostItem, inputs: CostCalculationContext) {
  let itemAmount = item.amount;

  if (item.calculationBasis === "per_unit") {
    itemAmount = item.amount * inputs.projectTarget.totalHouseholds;
  } else if (item.calculationBasis === "per_floor_pyung") {
    itemAmount = item.amount * inputs.projectTarget.totalFloorArea;
  } else if (item.calculationBasis === "per_site_pyung") {
    itemAmount = item.amount * inputs.projectTarget.totalLandArea;
  } else if (item.calculationBasis === "per_site_private") {
    itemAmount = item.amount * (inputs.projectTarget.privateLandArea || 0);
  } else if (item.calculationBasis === "per_site_public") {
    itemAmount = item.amount * (inputs.projectTarget.publicLandArea || 0);
  } else if (item.calculationBasis === "mix_linked" && item.mixConditions) {
    itemAmount = (inputs.unitAllocations ?? []).reduce((subAcc, alloc) => {
      const specificAmount = item.mixConditions?.[alloc.id] || 0;
      return subAcc + alloc.count * specificAmount;
    }, 0);
  } else if (item.calculationBasis === "manual_pyeong") {
    itemAmount = item.amount * (item.manualArea || 0);
  }

  const rate = item.applicationRate !== undefined ? item.applicationRate : 100;
  return itemAmount * (rate / 100);
}

export function calculateAnalysisResult(inputs: AnalysisInputs): AnalysisResult {
  const breakdownItems = inputs.advancedCategories.map((category) => {
    const categoryTotal = category.items.reduce(
      (acc, item) => acc + calculateCostItemAmount(item, inputs),
      0
    );

    return {
      name: category.title,
      value: categoryTotal,
    };
  });

  const totalProjectCost = breakdownItems.reduce((sum, item) => sum + item.value, 0);
  const costBreakdown = breakdownItems
    .filter((item) => item.value > 0 || item.name === "보존등기비")
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      fill: getCategoryHexColor(item.name, index),
    }));

  const costPerPyung =
    inputs.projectTarget.totalFloorArea > 0
      ? totalProjectCost / inputs.projectTarget.totalFloorArea
      : 0;

  const calculatedUnitPricing: NonNullable<AnalysisResult["unitPricing"]> = [];

  const getUnitArea = (typeId: string) =>
    inputs.unitTypes.find((unitType) => unitType.id === typeId)?.supplyArea || 0;

  const getUnitName = (typeId: string) =>
    inputs.unitTypes.find((unitType) => unitType.id === typeId)?.name || "?";

  let generalRevenue = 0;

  inputs.unitAllocations
    .filter((allocation) => allocation.tier === "General")
    .forEach((allocation) => {
      const area = getUnitArea(allocation.unitTypeId);
      const pricePerPyung =
        allocation.targetPricePerPyung
        ?? (area > 0 && allocation.fixedTotalPrice ? allocation.fixedTotalPrice / area : 0);
      const finalPrice = area * pricePerPyung;
      const revenue = allocation.count * finalPrice;

      generalRevenue += revenue;

      calculatedUnitPricing.push({
        allocationId: allocation.id,
        unitName: getUnitName(allocation.unitTypeId),
        tier: "General",
        supplyArea: area,
        totalPrice: finalPrice,
        pricePerPyung,
        revenueContribution: revenue,
      });
    });

  const requiredMemberContribution = totalProjectCost - generalRevenue;
  const memberAllocations = inputs.unitAllocations.filter(
    (allocation) => allocation.tier === "1st" || allocation.tier === "2nd"
  );

  let totalMemberArea = 0;
  let totalPremiums = 0;

  memberAllocations.forEach((allocation) => {
    const area = getUnitArea(allocation.unitTypeId);
    totalMemberArea += allocation.count * area;

    if (allocation.tier === "2nd") {
      totalPremiums += allocation.count * (allocation.premium || 0);
    }
  });

  let basePricePerPyung = 0;
  if (totalMemberArea > 0) {
    basePricePerPyung = (requiredMemberContribution - totalPremiums) / totalMemberArea;
  }

  memberAllocations.forEach((allocation) => {
    const area = getUnitArea(allocation.unitTypeId);
    let pricePerPyung =
      allocation.targetPricePerPyung
      ?? (area > 0 && allocation.fixedTotalPrice ? allocation.fixedTotalPrice / area : basePricePerPyung);
    let finalPrice = area * pricePerPyung;

    if (allocation.tier === "2nd" && allocation.targetPricePerPyung === undefined && !allocation.fixedTotalPrice) {
      finalPrice += allocation.premium || 0;
      pricePerPyung = area > 0 ? finalPrice / area : pricePerPyung;
    }

    calculatedUnitPricing.push({
      allocationId: allocation.id,
      unitName: getUnitName(allocation.unitTypeId),
      tier: allocation.tier,
      supplyArea: area,
      totalPrice: finalPrice,
      pricePerPyung: area > 0 ? finalPrice / area : 0,
      revenueContribution: finalPrice * allocation.count,
    });
  });

  const type59Alloc = calculatedUnitPricing.find(
    (pricing) => pricing.unitName.includes("59") && pricing.tier === "1st"
  );
  const type84Alloc = calculatedUnitPricing.find(
    (pricing) => pricing.unitName.includes("84") && pricing.tier === "1st"
  );

  let totalRevenue = 0;

  inputs.unitAllocations.forEach((allocation) => {
    const unitType = inputs.unitTypes.find((unit) => unit.id === allocation.unitTypeId);
    if (!unitType) {
      return;
    }

    if (allocation.targetPricePerPyung) {
      // For MISC items, targetPricePerPyung is the absolute amount, supplyArea is 1
      totalRevenue += allocation.targetPricePerPyung * unitType.supplyArea * allocation.count;
      return;
    }

    if (allocation.fixedTotalPrice) {
      totalRevenue += allocation.fixedTotalPrice * allocation.count;
      return;
    }

    const pricing = calculatedUnitPricing.find(
      (unitPricing) => unitPricing.allocationId === allocation.id
    );
    if (pricing) {
      totalRevenue += pricing.totalPrice * allocation.count;
    }
  });

  return {
    totalProjectCost,
    costPerPyung,
    estimatedPrices: {
      type59: type59Alloc ? type59Alloc.totalPrice : costPerPyung * 25,
      type84: type84Alloc ? type84Alloc.totalPrice : costPerPyung * 34,
    },
    costBreakdown,
    unitPricing: calculatedUnitPricing,
    totalRevenue,
  };
}
