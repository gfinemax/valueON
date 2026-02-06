"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AnalysisInputs } from "@/types";

interface InputSectionProps {
    inputs: AnalysisInputs;
    updateInput: (section: keyof AnalysisInputs, key: string, value: number) => void;
}

export function InputSection({ inputs, updateInput }: InputSectionProps) {

    const handleNumberChange = (
        section: keyof AnalysisInputs,
        key: string,
        value: string
    ) => {
        // Remove commas and convert to number
        const num = Number(value.replace(/,/g, ""));
        if (!isNaN(num)) {
            updateInput(section, key, num);
        }
    };

    const formatNumber = (num: number) => num.toLocaleString("ko-KR");

    return (
        <Accordion type="single" collapsible defaultValue="variable-costs" className="w-full">

            {/* 2. Variable Costs (Most Frequently Changed) */}
            <AccordionItem value="variable-costs">
                <AccordionTrigger className="font-semibold text-[#1a365d]">
                    주요 변동 비용 (평당가/금리)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>토지 평당 매입가 (원)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.variableCosts.landPricePerPyung)}
                            onChange={(e) => handleNumberChange("variableCosts", "landPricePerPyung", e.target.value)}
                            className="text-right font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>평당 건축비 (원)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.variableCosts.constCostPerPyung)}
                            onChange={(e) => handleNumberChange("variableCosts", "constCostPerPyung", e.target.value)}
                            className="text-right font-medium"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>브릿지 금리 (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={inputs.variableCosts.interestRateBridge}
                                    onChange={(e) => updateInput("variableCosts", "interestRateBridge", Number(e.target.value))}
                                    className="text-right"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>PF 금리 (%)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={inputs.variableCosts.interestRatePF}
                                    onChange={(e) => updateInput("variableCosts", "interestRatePF", Number(e.target.value))}
                                    className="text-right"
                                />
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* 1. Project Basics */}
            <AccordionItem value="project-basics">
                <AccordionTrigger className="font-semibold text-slate-600">
                    기본 사업 개요 (면적/세대)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>전체 사업부지 면적 (평)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.projectTarget.totalLandArea)}
                            onChange={(e) => handleNumberChange("projectTarget", "totalLandArea", e.target.value)}
                            className="text-right bg-slate-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>연면적 (평)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.projectTarget.totalFloorArea)}
                            onChange={(e) => handleNumberChange("projectTarget", "totalFloorArea", e.target.value)}
                            className="text-right bg-slate-50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>전체 세대수 (세대)</Label>
                        <Input
                            type="number"
                            value={inputs.projectTarget.totalHouseholds}
                            onChange={(e) => handleNumberChange("projectTarget", "totalHouseholds", e.target.value)}
                            className="text-right bg-slate-50"
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* 3. Added Costs */}
            <AccordionItem value="added-costs">
                <AccordionTrigger className="font-semibold text-slate-600">
                    기타 사업비 (업무비/예비비)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-1">
                    <div className="space-y-2">
                        <Label>세대당 업무추진비 (원)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.addedCosts.operationFeePerUnit)}
                            onChange={(e) => handleNumberChange("addedCosts", "operationFeePerUnit", e.target.value)}
                            className="text-right"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>PM 용역비 총액 (원)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.addedCosts.pmServiceFeeTotal)}
                            onChange={(e) => handleNumberChange("addedCosts", "pmServiceFeeTotal", e.target.value)}
                            className="text-right"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>기 투입 매몰비용 (원)</Label>
                        <Input
                            type="text"
                            value={formatNumber(inputs.addedCosts.sunkCost)}
                            onChange={(e) => handleNumberChange("addedCosts", "sunkCost", e.target.value)}
                            className="text-right"
                        />
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between">
                            <Label>예비비 비율 (%)</Label>
                            <span className="text-sm font-bold text-[#48bb78]">{inputs.addedCosts.contingencyRate}%</span>
                        </div>
                        <Slider
                            defaultValue={[inputs.addedCosts.contingencyRate]}
                            max={10}
                            step={0.1}
                            onValueChange={(val) => updateInput("addedCosts", "contingencyRate", val[0])}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>

        </Accordion>
    );
}
