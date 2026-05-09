"use client";

import { useMemo, useState } from "react";
import { BookmarkPlus, LockKeyhole, Trash2, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SearchHeader } from "@/components/search-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCalculator } from "@/hooks/useCalculator";
import { calculateAnalysisResult, calculateCostItemAmount } from "@/lib/analysis";
import { AnalysisInputs } from "@/types";
import { formatKoreanCurrency } from "@/utils/currency";

type SimulationDriverId =
  | "land-price"
  | "construction-price"
  | "pf-interest"
  | "reserve-fund"
  | "virtual-shortfall";

interface SimulationDriver {
  id: SimulationDriverId;
  label: string;
  description: string;
  unitLabel: string;
  scale: number;
  displayStep: number;
}

interface RangeState {
  min: number;
  max: number;
  step: number;
}

interface RangeDraftState {
  min: string;
  max: string;
  step: string;
}

interface MemberColumn {
  allocationId: string;
  label: string;
  tier: "1st" | "2nd";
}

interface ScenarioRow {
  value: number;
  result: ReturnType<typeof calculateAnalysisResult>;
  memberPrices: Record<string, number>;
}

interface SavedSimulationScenario {
  id: string;
  name: string;
  primaryDriverId: SimulationDriverId;
  activeDriverIds: SimulationDriverId[];
  ranges: Partial<Record<SimulationDriverId, RangeState>>;
}

const DRIVER_OPTIONS: SimulationDriver[] = [
  {
    id: "land-price",
    label: "토지매입비",
    description: "사유지 기준 평당 매입 단가를 바꿔 봅니다.",
    unitLabel: "만원/평",
    scale: 10000,
    displayStep: 250,
  },
  {
    id: "construction-price",
    label: "직접공사비",
    description: "연면적 기준 평당 공사비가 바뀔 때를 봅니다.",
    unitLabel: "만원/평",
    scale: 10000,
    displayStep: 50,
  },
  {
    id: "pf-interest",
    label: "PF 이자",
    description: "금융비용 총액 변동이 분담금에 주는 영향을 봅니다.",
    unitLabel: "억원",
    scale: 100000000,
    displayStep: 10,
  },
  {
    id: "reserve-fund",
    label: "예비비",
    description: "예비비 총액을 키우거나 줄였을 때를 봅니다.",
    unitLabel: "억원",
    scale: 100000000,
    displayStep: 10,
  },
  {
    id: "virtual-shortfall",
    label: "추가 결손금",
    description: "원본 지출표를 건드리지 않고 가상 결손금을 더합니다.",
    unitLabel: "억원",
    scale: 100000000,
    displayStep: 10,
  },
];

const LINE_COLORS = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed", "#475569"];

function formatWon(amount: number) {
  return `${formatKoreanCurrency(Math.max(0, Math.round(amount)))}원`;
}

function formatCompactWon(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function clampPositive(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function roundToUnit(value: number, unit: number) {
  if (unit <= 0) {
    return Math.round(value);
  }

  return Math.round(value / unit) * unit;
}

function floorToUnit(value: number, unit: number) {
  if (unit <= 0) {
    return Math.floor(value);
  }

  return Math.floor(value / unit) * unit;
}

function ceilToUnit(value: number, unit: number) {
  if (unit <= 0) {
    return Math.ceil(value);
  }

  return Math.ceil(value / unit) * unit;
}

function findCostItem(inputs: AnalysisInputs, categoryId: string, itemId: string) {
  return inputs.advancedCategories
    .find((category) => category.id === categoryId)
    ?.items.find((item) => item.id === itemId);
}

function getItemTotal(inputs: AnalysisInputs, categoryId: string, itemId: string) {
  const item = findCostItem(inputs, categoryId, itemId);
  return item ? calculateCostItemAmount(item, inputs) : 0;
}

function createSimulationBaseInputs(inputs: AnalysisInputs) {
  const cloned = structuredClone(inputs);
  const firstTierPrices = new Map<string, number>();

  cloned.unitAllocations.forEach((allocation) => {
    if (allocation.tier === "1st" && allocation.fixedTotalPrice) {
      firstTierPrices.set(allocation.unitTypeId, allocation.fixedTotalPrice);
    }
  });

  cloned.unitAllocations = cloned.unitAllocations.map((allocation) => {
    if (allocation.tier === "1st") {
      return { ...allocation, fixedTotalPrice: undefined };
    }

    if (allocation.tier === "2nd") {
      const basePrice = firstTierPrices.get(allocation.unitTypeId) || 0;
      const inferredPremium =
        allocation.premium !== undefined
          ? allocation.premium
          : Math.max(0, (allocation.fixedTotalPrice || 0) - basePrice);

      return {
        ...allocation,
        premium: inferredPremium,
        fixedTotalPrice: undefined,
      };
    }

    return allocation;
  });

  return cloned;
}

function upsertFixedCostItem(
  inputs: AnalysisInputs,
  categoryId: string,
  categoryTitle: string,
  itemId: string,
  itemName: string,
  amount: number
) {
  const category = inputs.advancedCategories.find((current) => current.id === categoryId);

  if (!category) {
    inputs.advancedCategories.push({
      id: categoryId,
      title: categoryTitle,
      items: [
        {
          id: itemId,
          name: itemName,
          amount,
          calculationBasis: "fixed",
        },
      ],
    });
    return;
  }

  const item = category.items.find((current) => current.id === itemId);
  if (!item) {
    category.items.push({
      id: itemId,
      name: itemName,
      amount,
      calculationBasis: "fixed",
    });
    return;
  }

  item.amount = amount;
  item.calculationBasis = "fixed";
}

function getCurrentDriverValue(inputs: AnalysisInputs, driverId: SimulationDriverId) {
  switch (driverId) {
    case "land-price":
      return inputs.variableCosts.landPricePerPyung;
    case "construction-price":
      return inputs.variableCosts.constCostPerPyung;
    case "pf-interest":
      return getItemTotal(inputs, "finance", "f2");
    case "reserve-fund":
      return getItemTotal(inputs, "general", "g4");
    case "virtual-shortfall":
      return 0;
    default:
      return 0;
  }
}

function getRecommendedRange(
  driverId: SimulationDriverId,
  currentValue: number
): RangeState {
  switch (driverId) {
    case "land-price": {
      const base = currentValue || 30000000;
      return {
        min: Math.max(10000000, floorToUnit(base, 5000000)),
        max: Math.max(50000000, ceilToUnit(base * 1.67, 5000000)),
        step: 2500000,
      };
    }
    case "construction-price": {
      const base = currentValue || 6000000;
      return {
        min: Math.max(3000000, floorToUnit(base * 0.75, 1000000)),
        max: Math.max(10000000, ceilToUnit(base * 1.4, 1000000)),
        step: 500000,
      };
    }
    case "pf-interest":
    case "reserve-fund": {
      const base = currentValue || 1000000000;
      return {
        min: Math.max(0, floorToUnit(base * 0.5, 1000000000)),
        max: Math.max(3000000000, ceilToUnit(base * 1.5, 1000000000)),
        step: 1000000000,
      };
    }
    case "virtual-shortfall":
      return {
        min: 0,
        max: 50000000000,
        step: 5000000000,
      };
    default:
      return {
        min: 0,
        max: currentValue,
        step: Math.max(1, currentValue / 10),
      };
  }
}

function createScenarioValues(minValue: number, maxValue: number, stepValue: number) {
  const min = clampPositive(Math.min(minValue, maxValue));
  const max = clampPositive(Math.max(minValue, maxValue));
  const step = Math.max(1, stepValue);

  if (min === max) {
    return [roundToUnit(min, step)];
  }

  const rawCount = Math.floor((max - min) / step) + 1;

  if (rawCount <= 12) {
    const values: number[] = [];
    for (let value = min; value <= max + step / 10; value += step) {
      values.push(Math.min(value, max));
    }

    return Array.from(
      new Set(values.map((value) => roundToUnit(value, step)))
    ).sort((a, b) => a - b);
  }

  const samples = 9;
  const sampled = Array.from({ length: samples }, (_, index) => {
    const ratio = index / (samples - 1);
    const rawValue = min + (max - min) * ratio;
    return roundToUnit(rawValue, step);
  });

  return Array.from(
    new Set([min, ...sampled, max].map((value) => roundToUnit(value, step)))
  ).sort((a, b) => a - b);
}

function applySimulationDriver(
  cloned: AnalysisInputs,
  driverId: SimulationDriverId,
  value: number
) {
  switch (driverId) {
    case "land-price": {
      const area =
        cloned.projectTarget.privateLandArea || cloned.projectTarget.totalLandArea || 0;
      upsertFixedCostItem(cloned, "land", "토지비", "l1", "토지매입비", value * area);
      break;
    }
    case "construction-price": {
      const area = cloned.projectTarget.totalFloorArea || 0;
      upsertFixedCostItem(
        cloned,
        "construction",
        "공사비",
        "c1",
        "직접공사비",
        value * area
      );
      break;
    }
    case "pf-interest":
      upsertFixedCostItem(cloned, "finance", "금융비용", "f2", "PF 이자", value);
      break;
    case "reserve-fund":
      upsertFixedCostItem(cloned, "general", "기타개발비", "g4", "예비비", value);
      break;
    case "virtual-shortfall":
      upsertFixedCostItem(
        cloned,
        "simulation_adjustment",
        "시뮬레이션 전용 조정",
        "__shortfall",
        "가상 결손금",
        value
      );
      break;
  }
}

function buildScenarioInputs(
  inputs: AnalysisInputs,
  overrides: Partial<Record<SimulationDriverId, number>>
) {
  const cloned = createSimulationBaseInputs(inputs);
  Object.entries(overrides).forEach(([driverId, value]) => {
    if (value === undefined) {
      return;
    }
    applySimulationDriver(cloned, driverId as SimulationDriverId, value);
  });

  return cloned;
}

function getMemberColumns(result: ReturnType<typeof calculateAnalysisResult>) {
  return (result.unitPricing || [])
    .filter((pricing) => pricing.tier === "1st" || pricing.tier === "2nd")
    .sort((a, b) => {
      if (a.supplyArea !== b.supplyArea) {
        return a.supplyArea - b.supplyArea;
      }

      if (a.tier === b.tier) {
        return 0;
      }

      return a.tier === "1st" ? -1 : 1;
    })
    .map<MemberColumn>((pricing) => ({
      allocationId: pricing.allocationId,
      label: `${pricing.unitName} ${pricing.tier === "1st" ? "1차" : "2차"}`,
      tier: pricing.tier === "1st" ? "1st" : "2nd",
    }));
}

function getPreviewMembers(columns: MemberColumn[]) {
  return columns.filter((column) => column.tier === "1st").slice(0, 3);
}

function getAnchoredBasePrices(inputs: AnalysisInputs, columns: MemberColumn[]) {
  return Object.fromEntries(
    columns.map((column) => {
      const allocation = inputs.unitAllocations.find(
        (item) => item.id === column.allocationId
      );
      return [column.allocationId, allocation?.fixedTotalPrice || 0];
    })
  );
}

function getDisplayValue(rawValue: number, scale: number) {
  return rawValue / scale;
}

function getRawValue(displayValue: string, scale: number) {
  const numeric = Number(displayValue);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return clampPositive(numeric * scale);
}

function getDeltaPercent(currentValue: number, nextValue: number) {
  if (currentValue === 0) {
    return nextValue === 0 ? 0 : 100;
  }

  return ((nextValue - currentValue) / currentValue) * 100;
}

function getDriverById(driverId: SimulationDriverId) {
  return DRIVER_OPTIONS.find((option) => option.id === driverId) || DRIVER_OPTIONS[0];
}

function formatDriverValue(driver: SimulationDriver, value: number) {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: driver.scale === 10000 ? 0 : 1,
  }).format(getDisplayValue(value, driver.scale))}${driver.unitLabel}`;
}

function getCellColor(currentValue: number, maxValue: number) {
  if (maxValue <= 0) {
    return "rgba(15, 118, 110, 0.06)";
  }

  const ratio = Math.min(Math.max(currentValue / maxValue, 0), 1);
  return `rgba(15, 118, 110, ${0.08 + ratio * 0.26})`;
}

export default function SimulationPage() {
  const { inputs } = useCalculator();
  const [activeDriverIds, setActiveDriverIds] = useState<SimulationDriverId[]>([
    "land-price",
  ]);
  const [primaryDriverId, setPrimaryDriverId] =
    useState<SimulationDriverId>("land-price");
  const [rangeOverrides, setRangeOverrides] = useState<
    Partial<Record<SimulationDriverId, RangeState>>
  >({});
  const [rangeDrafts, setRangeDrafts] = useState<
    Partial<Record<SimulationDriverId, RangeDraftState>>
  >({});
  const [selectedScenarioOverrides, setSelectedScenarioOverrides] = useState<
    Partial<Record<SimulationDriverId, number>>
  >({});
  const [savedScenarios, setSavedScenarios] = useState<SavedSimulationScenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");

  const currentDriverValues = useMemo(
    () =>
      Object.fromEntries(
        DRIVER_OPTIONS.map((driver) => [
          driver.id,
          getCurrentDriverValue(inputs, driver.id),
        ])
      ) as Record<SimulationDriverId, number>,
    [inputs]
  );
  const selectedDriver = getDriverById(primaryDriverId);
  const currentDriverValue = currentDriverValues[primaryDriverId];
  const recommendedRange = useMemo(
    () => getRecommendedRange(primaryDriverId, currentDriverValue),
    [primaryDriverId, currentDriverValue]
  );
  const getEffectiveRange = (driverId: SimulationDriverId) =>
    rangeOverrides[driverId] ??
    getRecommendedRange(driverId, currentDriverValues[driverId]);
  const range = rangeOverrides[primaryDriverId] ?? recommendedRange;
  const simulationBaseValue = Math.min(range.min, range.max);
  const baselineOverrides = useMemo(
    () =>
      Object.fromEntries(
        activeDriverIds.map((driverId) => {
          const driverRange =
            rangeOverrides[driverId] ??
            getRecommendedRange(driverId, currentDriverValues[driverId]);
          return [driverId, Math.min(driverRange.min, driverRange.max)];
        })
      ) as Partial<Record<SimulationDriverId, number>>,
    [activeDriverIds, currentDriverValues, rangeOverrides]
  );
  const additionalActiveDriverIds = activeDriverIds.filter(
    (driverId) => driverId !== primaryDriverId
  );

  const baselineResult = useMemo(() => {
    const baseInputs = buildScenarioInputs(inputs, baselineOverrides);
    return calculateAnalysisResult(baseInputs);
  }, [baselineOverrides, inputs]);

  const memberColumns = useMemo(() => getMemberColumns(baselineResult), [baselineResult]);
  const previewMembers = useMemo(() => getPreviewMembers(memberColumns), [memberColumns]);
  const anchoredBasePrices = useMemo(
    () => getAnchoredBasePrices(inputs, memberColumns),
    [inputs, memberColumns]
  );

  const scenarioValues = useMemo(
    () => createScenarioValues(range.min, range.max, range.step),
    [range.max, range.min, range.step]
  );

  const scenarioRows = useMemo<ScenarioRow[]>(() => {
    return scenarioValues.map((value) => {
      const simulatedInputs = buildScenarioInputs(inputs, {
        ...baselineOverrides,
        [primaryDriverId]: value,
      });
      const result = calculateAnalysisResult(simulatedInputs);
      const memberPrices = Object.fromEntries(
        memberColumns.map((column) => {
          const scenarioPricing = result.unitPricing?.find(
            (unitPricing) => unitPricing.allocationId === column.allocationId
          );
          const baselinePricing = baselineResult.unitPricing?.find(
            (unitPricing) => unitPricing.allocationId === column.allocationId
          );
          const anchoredBasePrice = anchoredBasePrices[column.allocationId] || baselinePricing?.totalPrice || 0;
          const delta =
            (scenarioPricing?.totalPrice || 0) - (baselinePricing?.totalPrice || 0);

          return [column.allocationId, Math.max(0, anchoredBasePrice + delta)];
        })
      );

      return {
        value,
        result,
        memberPrices,
      };
    });
  }, [anchoredBasePrices, baselineOverrides, baselineResult.unitPricing, inputs, memberColumns, primaryDriverId, scenarioValues]);
  const savedValueIncluded = scenarioRows.some(
    (row) => row.value === currentDriverValue
  );
  const savedValueReferenceRow = useMemo<ScenarioRow | null>(() => {
    if (savedValueIncluded) {
      return null;
    }

    const simulatedInputs = buildScenarioInputs(inputs, {
      ...baselineOverrides,
      [primaryDriverId]: currentDriverValue,
    });
    const result = calculateAnalysisResult(simulatedInputs);
    const memberPrices = Object.fromEntries(
      memberColumns.map((column) => {
        const scenarioPricing = result.unitPricing?.find(
          (unitPricing) => unitPricing.allocationId === column.allocationId
        );
        const baselinePricing = baselineResult.unitPricing?.find(
          (unitPricing) => unitPricing.allocationId === column.allocationId
        );
        const anchoredBasePrice =
          anchoredBasePrices[column.allocationId] || baselinePricing?.totalPrice || 0;
        const delta =
          (scenarioPricing?.totalPrice || 0) - (baselinePricing?.totalPrice || 0);

        return [column.allocationId, Math.max(0, anchoredBasePrice + delta)];
      })
    );

    return {
      value: currentDriverValue,
      result,
      memberPrices,
    };
  }, [
    anchoredBasePrices,
    baselineOverrides,
    baselineResult.unitPricing,
    currentDriverValue,
    inputs,
    memberColumns,
    primaryDriverId,
    savedValueIncluded,
  ]);
  const selectedScenarioValue = selectedScenarioOverrides[primaryDriverId];
  const selectedScenario = useMemo(() => {
    return (
      scenarioRows.find((row) => row.value === selectedScenarioValue) ||
      scenarioRows[scenarioRows.length - 1] ||
      null
    );
  }, [scenarioRows, selectedScenarioValue]);

  const chartData = scenarioRows.map((row) => ({
    scenario: getDisplayValue(row.value, selectedDriver.scale),
    ...Object.fromEntries(
      memberColumns.map((column) => [
        column.allocationId,
        row.memberPrices[column.allocationId] || 0,
      ])
    ),
  }));

  const memberPriceMax = scenarioRows.reduce((max, row) => {
    const rowMax = Math.max(0, ...Object.values(row.memberPrices));
    return Math.max(max, rowMax);
  }, 0);

  const baseFirstTierPrices = Object.fromEntries(
    previewMembers.map((column) => [
      column.allocationId,
      anchoredBasePrices[column.allocationId] || 0,
    ])
  );
  const getDriverRangeDraft = (driverId: SimulationDriverId): RangeDraftState => {
    const driver = getDriverById(driverId);
    const driverRange = getEffectiveRange(driverId);
    return (
      rangeDrafts[driverId] ?? {
        min: String(getDisplayValue(driverRange.min, driver.scale)),
        max: String(getDisplayValue(driverRange.max, driver.scale)),
        step: String(getDisplayValue(driverRange.step, driver.scale)),
      }
    );
  };
  const activeRangeDraft = getDriverRangeDraft(primaryDriverId);

  const updateDriverRange = (
    driverId: SimulationDriverId,
    patch: Partial<RangeState>
  ) => {
    const driverCurrentValue = currentDriverValues[driverId];
    const driverRecommendedRange = getRecommendedRange(driverId, driverCurrentValue);
    setRangeOverrides((prev) => ({
      ...prev,
      [driverId]: {
        ...(prev[driverId] ?? driverRecommendedRange),
        ...patch,
      },
    }));
  };
  const updateSelectedScenario = (value: number) => {
    setSelectedScenarioOverrides((prev) => ({
      ...prev,
      [primaryDriverId]: value,
    }));
  };

  const updateDriverRangeDraft = (
    driverId: SimulationDriverId,
    field: keyof RangeDraftState,
    value: string
  ) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const draft = getDriverRangeDraft(driverId);
    setRangeDrafts((prev) => ({
      ...prev,
      [driverId]: {
        ...(prev[driverId] ?? draft),
        [field]: sanitized,
      },
    }));
  };
  const updateRangeDraft = (field: keyof RangeDraftState, value: string) =>
    updateDriverRangeDraft(primaryDriverId, field, value);

  const commitDriverRangeDraft = (
    driverId: SimulationDriverId,
    field: keyof RangeDraftState
  ) => {
    const driver = getDriverById(driverId);
    const driverRange = getEffectiveRange(driverId);
    const draft = getDriverRangeDraft(driverId);
    const rawValue = draft[field];
    if (rawValue === "") {
      setRangeDrafts((prev) => ({
        ...prev,
        [driverId]: {
          ...(prev[driverId] ?? draft),
          [field]: String(getDisplayValue(driverRange[field], driver.scale)),
        },
      }));
      return;
    }

    const nextValue = getRawValue(rawValue, driver.scale);
    const normalizedValue =
      field === "step"
        ? Math.max(nextValue, driver.scale)
        : nextValue;

    updateDriverRange(driverId, { [field]: normalizedValue });
    setRangeDrafts((prev) => ({
      ...prev,
      [driverId]: {
        ...(prev[driverId] ?? draft),
        [field]: String(getDisplayValue(normalizedValue, driver.scale)),
      },
    }));
  };
  const commitRangeDraft = (field: keyof RangeDraftState) =>
    commitDriverRangeDraft(primaryDriverId, field);

  const toggleDriverSelection = (driverId: SimulationDriverId) => {
    setActiveDriverIds((prev) => {
      const isActive = prev.includes(driverId);
      if (!isActive) {
        setPrimaryDriverId(driverId);
        return [...prev, driverId];
      }

      if (prev.length === 1) {
        setPrimaryDriverId(driverId);
        return prev;
      }

      const next = prev.filter((current) => current !== driverId);
      if (primaryDriverId === driverId) {
        setPrimaryDriverId(next[0]);
      }
      return next;
    });
  };

  const saveCurrentScenario = () => {
    const trimmedName = scenarioName.trim();
    const nextScenario: SavedSimulationScenario = {
      id: `${Date.now()}-${primaryDriverId}`,
      name:
        trimmedName || `시나리오 ${savedScenarios.length + 1}`,
      primaryDriverId,
      activeDriverIds,
      ranges: Object.fromEntries(
        activeDriverIds.map((driverId) => [driverId, getEffectiveRange(driverId)])
      ) as Partial<Record<SimulationDriverId, RangeState>>,
    };

    setSavedScenarios((prev) => [nextScenario, ...prev].slice(0, 6));
    setScenarioName("");
  };

  const applySavedScenario = (scenario: SavedSimulationScenario) => {
    setActiveDriverIds(scenario.activeDriverIds);
    setPrimaryDriverId(scenario.primaryDriverId);
    setRangeOverrides((prev) => ({
      ...prev,
      ...scenario.ranges,
    }));
    setRangeDrafts((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(scenario.ranges).map(([driverId, driverRange]) => {
          const driver = getDriverById(driverId as SimulationDriverId);
          return [
            driverId,
            {
              min: String(getDisplayValue(driverRange.min, driver.scale)),
              max: String(getDisplayValue(driverRange.max, driver.scale)),
              step: String(getDisplayValue(driverRange.step, driver.scale)),
            },
          ];
        })
      ),
    }));
    setSelectedScenarioOverrides((prev) => ({
      ...prev,
      [scenario.primaryDriverId]: scenario.ranges[scenario.primaryDriverId]?.max,
    }));
  };

  const removeSavedScenario = (scenarioId: string) => {
    setSavedScenarios((prev) => prev.filter((scenario) => scenario.id !== scenarioId));
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6f3_100%)] pt-14">
      <SearchHeader title="분담금 시뮬레이션" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6">
        <Card className="border-emerald-200 bg-white/90 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">
                  <LockKeyhole className="h-3 w-3" />
                  임시 시뮬레이션
                </Badge>
                <Badge variant="outline">원본 수입/지출 값 미변경</Badge>
              </div>
              <p className="text-xl font-semibold tracking-tight text-slate-900">
                사업비 변화에 따라 평형별 조합원 분담금이 어떻게 달라지는지 보여줍니다.
              </p>
              <p className="max-w-4xl text-sm leading-6 text-slate-600">
                선택한 비용 항목의 시작값과 종료값을 기준으로 분담금 변화를 시뮬레이션합니다.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="font-semibold">시뮬레이션 기준값</div>
              <div className="mt-1 text-2xl font-bold">
                {formatDriverValue(selectedDriver, simulationBaseValue)}
              </div>
              <div className="mt-1 text-xs text-emerald-800/80">
                저장값 {formatDriverValue(selectedDriver, currentDriverValue)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg text-slate-900">시뮬레이션 조건</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{activeDriverIds.length}개 조건 선택</Badge>
                <Badge className="bg-emerald-600 text-white">
                  주 조건: {selectedDriver.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-5">
              {DRIVER_OPTIONS.map((driver) => (
                <button
                  key={driver.id}
                  type="button"
                  onClick={() => toggleDriverSelection(driver.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    activeDriverIds.includes(driver.id)
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{driver.label}</div>
                    {primaryDriverId === driver.id && (
                      <Badge className="bg-emerald-600 text-white">주 조건</Badge>
                    )}
                    {primaryDriverId !== driver.id && activeDriverIds.includes(driver.id) && (
                      <Badge variant="outline">동시 적용</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {driver.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  기준 값
                </div>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  {formatDriverValue(selectedDriver, simulationBaseValue)}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  입력 페이지에서 설정한 분담금을 이 시작값 기준 기본 분담금으로 사용합니다.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  저장값: {formatDriverValue(selectedDriver, currentDriverValue)}
                </p>
              </div>

              <label className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  시작
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={activeRangeDraft.min}
                  onChange={(event) => updateRangeDraft("min", event.target.value)}
                  onBlur={() => commitRangeDraft("min")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  className="mt-2 h-11 border-slate-200 bg-slate-50 text-lg font-semibold"
                />
                <div className="mt-2 text-xs text-slate-500">{selectedDriver.unitLabel}</div>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  종료
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={activeRangeDraft.max}
                  onChange={(event) => updateRangeDraft("max", event.target.value)}
                  onBlur={() => commitRangeDraft("max")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  className="mt-2 h-11 border-slate-200 bg-slate-50 text-lg font-semibold"
                />
                <div className="mt-2 text-xs text-slate-500">{selectedDriver.unitLabel}</div>
              </label>

              <label className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  간격
                </div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={activeRangeDraft.step}
                  onChange={(event) => updateRangeDraft("step", event.target.value)}
                  onBlur={() => commitRangeDraft("step")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  className="mt-2 h-11 border-slate-200 bg-slate-50 text-lg font-semibold"
                />
                <div className="mt-2 text-xs text-slate-500">{selectedDriver.unitLabel}</div>
              </label>
            </div>

            {additionalActiveDriverIds.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-700">
                  동시 적용 조건
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {additionalActiveDriverIds.map((driverId) => {
                    const driver = getDriverById(driverId);
                    const driverRange = getEffectiveRange(driverId);
                    const driverDraft = getDriverRangeDraft(driverId);
                    const driverCurrentValue = currentDriverValues[driverId];

                    return (
                      <div
                        key={driverId}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {driver.label}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              시작값과 종료값을 저장해 둘 수 있습니다.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setPrimaryDriverId(driverId)}
                          >
                            주 조건으로 사용
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-semibold text-slate-500">
                              저장값
                            </div>
                            <div className="mt-1 text-lg font-bold text-slate-900">
                              {formatDriverValue(driver, driverCurrentValue)}
                            </div>
                          </div>
                          <label className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-xs font-semibold text-slate-500">
                              적용값
                            </div>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={driverDraft.min}
                              onChange={(event) =>
                                updateDriverRangeDraft(
                                  driverId,
                                  "min",
                                  event.target.value
                                )
                              }
                              onBlur={() => commitDriverRangeDraft(driverId, "min")}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              className="mt-2 h-10 border-slate-200 bg-slate-50 text-base font-semibold"
                            />
                            <div className="mt-2 text-xs text-slate-500">
                              {driver.unitLabel}
                            </div>
                          </label>
                          <label className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="text-xs font-semibold text-slate-500">
                              종료값
                            </div>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={driverDraft.max}
                              onChange={(event) =>
                                updateDriverRangeDraft(
                                  driverId,
                                  "max",
                                  event.target.value
                                )
                              }
                              onBlur={() => commitDriverRangeDraft(driverId, "max")}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              className="mt-2 h-10 border-slate-200 bg-slate-50 text-base font-semibold"
                            />
                            <div className="mt-2 text-xs text-slate-500">
                              {driver.unitLabel}
                            </div>
                          </label>
                        </div>
                        <div className="mt-3 text-xs text-slate-400">
                          현재 적용값 {formatDriverValue(driver, Math.min(driverRange.min, driverRange.max))} / 저장 종료값 {formatDriverValue(driver, Math.max(driverRange.min, driverRange.max))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  const nextRange = getRecommendedRange(
                    primaryDriverId,
                    currentDriverValue
                  );
                  setRangeOverrides((prev) => ({
                    ...prev,
                    [primaryDriverId]: nextRange,
                  }));
                  setRangeDrafts((prev) => ({
                    ...prev,
                    [primaryDriverId]: {
                      min: String(getDisplayValue(nextRange.min, selectedDriver.scale)),
                      max: String(getDisplayValue(nextRange.max, selectedDriver.scale)),
                      step: String(getDisplayValue(nextRange.step, selectedDriver.scale)),
                    },
                  }));
                  updateSelectedScenario(nextRange.max);
                }}
              >
                저장값 기준 추천 범위
              </Button>
              {primaryDriverId === "land-price" && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setRangeOverrides((prev) => ({
                      ...prev,
                      [primaryDriverId]: {
                        min: 30000000,
                        max: 50000000,
                        step: 2500000,
                      },
                    }));
                    setRangeDrafts((prev) => ({
                      ...prev,
                      [primaryDriverId]: {
                        min: "3000",
                        max: "5000",
                        step: "250",
                      },
                    }));
                    updateSelectedScenario(50000000);
                  }}
                >
                  예시 3,000만 → 5,000만
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">시나리오 저장</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                type="text"
                value={scenarioName}
                onChange={(event) => setScenarioName(event.target.value)}
                placeholder="예: 토지 4,000 + PF 120억"
                className="h-11 border-slate-200 bg-slate-50"
              />
              <Button type="button" className="h-11 md:px-6" onClick={saveCurrentScenario}>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                현재 조건 저장
              </Button>
            </div>

            {savedScenarios.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savedScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {scenario.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          주 조건: {getDriverById(scenario.primaryDriverId).label}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSavedScenario(scenario.id)}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      {scenario.activeDriverIds.map((driverId) => {
                        const driver = getDriverById(driverId);
                        const driverRange = scenario.ranges[driverId];
                        if (!driverRange) {
                          return null;
                        }
                        return (
                          <div key={driverId} className="flex items-center justify-between gap-3">
                            <span>{driver.label}</span>
                            <span className="font-medium text-slate-800">
                              {formatDriverValue(driver, driverRange.min)} {"->"} {formatDriverValue(driver, driverRange.max)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => applySavedScenario(scenario)}
                    >
                      적용
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                현재 선택한 복수 조건을 저장해 두고 비교할 수 있습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {selectedScenario && (
          <div className="grid gap-4 md:grid-cols-4">
            {previewMembers.map((column) => {
              const basePrice = baseFirstTierPrices[column.allocationId] || 0;
              const simulatedPrice =
                selectedScenario.memberPrices[column.allocationId] || 0;
              const additionalContribution = Math.max(
                0,
                simulatedPrice - inputs.initialPayment
              );
              const deltaPrice = simulatedPrice - basePrice;

              return (
                <Card
                  key={column.allocationId}
                  className="border-slate-200 bg-white/90 shadow-sm"
                >
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        {column.label}
                      </div>
                      <Badge variant="outline">1차 기준</Badge>
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-slate-900">
                      {formatWon(simulatedPrice)}
                    </div>
                    <div className="text-sm text-slate-600">
                      초기 분양가 {formatWon(inputs.initialPayment)} 제외 추가 분담금{" "}
                      {formatWon(additionalContribution)}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        deltaPrice >= 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      기준 대비 {deltaPrice >= 0 ? "+" : ""}
                      {formatWon(Math.abs(deltaPrice))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Card className="border-slate-200 bg-slate-900 text-white shadow-sm">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <TrendingUp className="h-4 w-4" />
                  총사업비 변화
                </div>
                <div className="text-3xl font-bold tracking-tight">
                  {formatWon(selectedScenario.result.totalProjectCost)}
                </div>
                <div className="text-sm text-slate-300">
                  기준 대비{" "}
                  {selectedScenario.result.totalProjectCost >=
                  baselineResult.totalProjectCost
                    ? "+"
                    : "-"}
                  {formatWon(
                    Math.abs(
                      selectedScenario.result.totalProjectCost -
                        baselineResult.totalProjectCost
                    )
                  )}
                </div>
                <div className="text-sm text-slate-300">
                  평당 원가 {formatWon(selectedScenario.result.costPerPyung)} /{" "}
                  {formatPercent(
                    getDeltaPercent(
                      baselineResult.costPerPyung,
                      selectedScenario.result.costPerPyung
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">
              평형별 필요 분담금 추이
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="scenario"
                    stroke="#64748b"
                    tickFormatter={(value) =>
                      `${new Intl.NumberFormat("ko-KR", {
                        maximumFractionDigits: 0,
                      }).format(value)}${selectedDriver.unitLabel}`
                    }
                  />
                  <YAxis
                    stroke="#64748b"
                    tickFormatter={(value) =>
                      `${formatCompactWon(Number(value))}원`
                    }
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => {
                      const seriesName = name ?? "";
                      const member = memberColumns.find(
                        (column) => column.allocationId === seriesName
                      );
                      return [formatWon(value ?? 0), member?.label || seriesName];
                    }}
                    labelFormatter={(label) => `${label}${selectedDriver.unitLabel}`}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #dbe4ee",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  {memberColumns.map((column, index) => (
                    <Line
                      key={column.allocationId}
                      type="monotone"
                      dataKey={column.allocationId}
                      name={column.label}
                      stroke={LINE_COLORS[index % LINE_COLORS.length]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2">
              {memberColumns.map((column, index) => (
                <div
                  key={column.allocationId}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: LINE_COLORS[index % LINE_COLORS.length],
                    }}
                  />
                  {column.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-900">범위별 결과표</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold">
                      {selectedDriver.label}
                    </th>
                    {memberColumns.map((column) => (
                      <th
                        key={column.allocationId}
                        className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right font-semibold"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right font-semibold">
                      총사업비
                    </th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right font-semibold">
                      기준 대비
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {savedValueReferenceRow && (
                    <tr className="bg-amber-50/70">
                      <td className="sticky left-0 z-10 border-b border-slate-200 bg-amber-50 px-4 py-3 font-semibold text-amber-900">
                        저장값 {formatDriverValue(selectedDriver, currentDriverValue)}
                      </td>
                      {memberColumns.map((column) => {
                        const price =
                          savedValueReferenceRow.memberPrices[column.allocationId] || 0;

                        return (
                          <td
                            key={column.allocationId}
                            className="border-b border-slate-200 px-4 py-3 text-right text-slate-700"
                          >
                            {formatWon(price)}
                          </td>
                        );
                      })}
                      <td className="border-b border-slate-200 px-4 py-3 text-right text-slate-700">
                        {formatWon(savedValueReferenceRow.result.totalProjectCost)}
                      </td>
                      <td className="border-b border-slate-200 px-4 py-3 text-right text-slate-700">
                        {savedValueReferenceRow.result.totalProjectCost >=
                        baselineResult.totalProjectCost
                          ? "+"
                          : "-"}
                        {formatWon(
                          Math.abs(
                            savedValueReferenceRow.result.totalProjectCost -
                              baselineResult.totalProjectCost
                          )
                        )}
                      </td>
                    </tr>
                  )}

                  {scenarioRows.map((row) => {
                    const isSelected = row.value === selectedScenario?.value;

                    return (
                      <tr
                        key={row.value}
                        className={`cursor-pointer transition ${
                          isSelected ? "bg-emerald-50/80" : "hover:bg-slate-50"
                        }`}
                        onClick={() => updateSelectedScenario(row.value)}
                      >
                        <td
                          className={`sticky left-0 z-10 border-b border-slate-200 px-4 py-3 font-semibold ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-900"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          <div>{formatDriverValue(selectedDriver, row.value)}</div>
                          {row.value === simulationBaseValue && (
                            <div className="text-xs text-slate-500">기본 분담금 기준값</div>
                          )}
                          {row.value === currentDriverValue &&
                            row.value !== simulationBaseValue && (
                              <div className="text-xs text-slate-500">저장값</div>
                            )}
                          {row.value === range.max && row.value !== simulationBaseValue && (
                            <div className="text-xs text-slate-400">범위 끝값</div>
                          )}
                        </td>
                        {memberColumns.map((column) => (
                          <td
                            key={column.allocationId}
                            className="border-b border-slate-200 px-4 py-3 text-right font-medium text-slate-900"
                            style={{
                              backgroundColor: getCellColor(
                                row.memberPrices[column.allocationId] || 0,
                                memberPriceMax
                              ),
                            }}
                          >
                            {formatWon(row.memberPrices[column.allocationId] || 0)}
                          </td>
                        ))}
                        <td className="border-b border-slate-200 px-4 py-3 text-right text-slate-700">
                          {formatWon(row.result.totalProjectCost)}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3 text-right">
                          <span
                            className={`font-semibold ${
                              row.result.totalProjectCost >=
                              baselineResult.totalProjectCost
                                ? "text-rose-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {row.result.totalProjectCost >=
                            baselineResult.totalProjectCost
                              ? "+"
                              : "-"}
                            {formatWon(
                              Math.abs(
                                row.result.totalProjectCost -
                                  baselineResult.totalProjectCost
                              )
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs leading-5 text-slate-500">
              표의 각 값은 이 페이지 안에서만 만든 임시 복제본 기준입니다. 현재 저장된 수입 관리와 지출 관리 화면의 값은 바뀌지 않습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
