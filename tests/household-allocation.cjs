/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test harness loads TypeScript without a test framework. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
    const filename = path.join(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    let source = fs.readFileSync(filename, 'utf8');
    if (relative === 'hooks/useCalculator.ts') source += '\nexport { normalizeInputs };';
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const localRequire = (name) => name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name);
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename })(localRequire, loaded, loaded.exports);
    return loaded.exports;
}
const { defaultValues, householdPreset } = load('constants/defaultValues.ts');
const { calculateAnalysisResult } = load('lib/analysis.ts');
const { applyHouseholdPresetToInputs, updateHouseholdCountInInputs, updateHouseholdSupplyArea } = load('lib/household-allocation.ts');
const { normalizeInputs } = load('hooks/useCalculator.ts');
const inputs = structuredClone(defaultValues);
const result = calculateAnalysisResult(inputs);
assert.equal(inputs.projectTarget.totalHouseholds, 262);
assert.equal(inputs.unitAllocations.filter(a => a.tier === '1st').reduce((s,a) => s+a.count,0),150);
assert.equal(inputs.unitAllocations.filter(a => a.tier === '2nd').reduce((s,a) => s+a.count,0),94);
for (const row of householdPreset) {
    const apartment = inputs.unitTypes.find(t => t.id === `unit-${row.key}`);
    const rental = inputs.unitTypes.find(t => t.id === `rental-${row.key}`);
    assert.equal(apartment.totalUnits + rental.totalUnits, row.first + row.second + row.rental);
}
const rentalRevenue = inputs.unitAllocations.filter(a => a.unitTypeId.startsWith('rental-')).reduce((sum,a) => sum + a.count * inputs.unitTypes.find(t => t.id === a.unitTypeId).supplyArea * a.targetPricePerPyung,0);
assert.equal(rentalRevenue, 6552000000);
assert.equal(result.totalRevenue, 338262000000);
assert.deepEqual(JSON.parse(JSON.stringify(normalizeInputs(inputs).unitAllocations)), inputs.unitAllocations);
assert.equal(result.unitPricing.find(p => p.allocationId === 'alloc-49a-1st').totalPrice,810000000);
assert.equal(result.unitPricing.find(p => p.allocationId === 'alloc-49a-2nd').totalPrice,990000000);
const temporaryAreaSaved = { ...inputs, unitTypes: inputs.unitTypes.map(t => t.id.endsWith('49a') ? { ...t, supplyArea: 21 } : t) };
assert.equal(normalizeInputs(temporaryAreaSaved).unitTypes.find(t => t.id === 'unit-49a').supplyArea,18);
const changed = updateHouseholdCountInInputs(inputs,'unit-59c','1st',17);
assert.equal(changed.projectTarget.totalHouseholds,263);
assert.equal(changed.unitAllocations.find(a=>a.id==='alloc-59c-2nd').count,10);
assert.equal(changed.unitAllocations.find(a=>a.id==='alloc-59c-rental').count,12);
assert.equal(inputs.unitAllocations.find(a=>a.id==='alloc-59c-1st').count,16);
assert.equal(updateHouseholdCountInInputs(inputs,'unit-49a','1st',-3).unitTypes.find(t=>t.id==='unit-49a').totalUnits,7);
const areaChanged = updateHouseholdSupplyArea(inputs,'unit-59c',26);
assert.equal(areaChanged.unitTypes.find(t=>t.id==='rental-59c').supplyArea,26);
assert.equal(calculateAnalysisResult(areaChanged).totalRevenue - result.totalRevenue,1426000000);
const legacy = { ...inputs, unitTypes:[{id:'u1',name:'59 Type',category:'APARTMENT',supplyArea:25,totalUnits:125},{id:'custom',name:'Other',category:'MISC',supplyArea:1}],unitAllocations:[{id:'a1',unitTypeId:'u1',tier:'1st',count:125,targetPricePerPyung:30000000},{id:'custom-income',unitTypeId:'custom',tier:'General',count:1,targetPricePerPyung:1000000}] };
const normalizedLegacy = normalizeInputs(legacy);
assert.equal(normalizedLegacy.unitTypes.some(t=>t.id==='unit-49a'),true);
assert.equal(normalizedLegacy.projectTarget.totalHouseholds,262);
const applied = applyHouseholdPresetToInputs(normalizedLegacy);
assert.equal(applied.unitTypes.some(t=>t.id==='u1'),false);
assert.equal(applied.unitAllocations.find(a=>a.id==='custom-income').targetPricePerPyung,1000000);
assert.equal(applied.advancedCategories,normalizedLegacy.advancedCategories);
assert.deepEqual(applyHouseholdPresetToInputs(applied),applied);
assert.deepEqual(JSON.parse(JSON.stringify(normalizeInputs(JSON.parse(JSON.stringify(applied))).unitAllocations)),applied.unitAllocations);
const oldSavedProject = {
    ...legacy,
    projectTarget: { ...legacy.projectTarget, totalHouseholds: 254 },
    unitTypes: [
        { id: 'u2', name: '84 Type', category: 'APARTMENT', supplyArea: 34, totalUnits: 64 },
        { id: 'u3', name: '73 Type', category: 'APARTMENT', supplyArea: 31, totalUnits: 47 },
        { id: 'u1', name: '59 Type', category: 'APARTMENT', supplyArea: 25, totalUnits: 125 },
        { id: 'u6', name: '임대 84Type', category: 'RENTAL', supplyArea: 34, totalUnits: 3 },
        { id: 'u5', name: '임대 73Type', category: 'RENTAL', supplyArea: 31, totalUnits: 3 },
        { id: 'u4', name: '임대 59Type', category: 'RENTAL', supplyArea: 25, totalUnits: 12 },
        legacy.unitTypes[1],
    ],
};
const upgraded = normalizeInputs(JSON.parse(JSON.stringify(oldSavedProject)));
assert.equal(upgraded.projectTarget.totalHouseholds,262);
assert.equal(upgraded.unitTypes.filter(t=>t.category==='APARTMENT').reduce((sum,t)=>sum+t.totalUnits,0),244);
assert.equal(upgraded.unitTypes.filter(t=>t.category==='RENTAL').reduce((sum,t)=>sum+t.totalUnits,0),18);
assert.equal(upgraded.unitAllocations.filter(a=>a.tier==='1st').reduce((sum,a)=>sum+a.count,0),150);
assert.equal(upgraded.unitAllocations.filter(a=>a.tier==='2nd').reduce((sum,a)=>sum+a.count,0),94);
assert.equal(upgraded.unitTypes.some(t=>t.id==='u3'),false);
assert.equal(calculateAnalysisResult(upgraded).totalRevenue,338263000000);
assert.deepEqual(JSON.parse(JSON.stringify(normalizeInputs(upgraded))),JSON.parse(JSON.stringify(upgraded)));
const editedThenReloaded = normalizeInputs(updateHouseholdCountInInputs(upgraded,'unit-49a','1st',14));
assert.equal(editedThenReloaded.projectTarget.totalHouseholds,263);
assert.equal(editedThenReloaded.unitAllocations.find(a=>a.id==='alloc-49a-1st').count,14);
const duplicated = { ...inputs, unitAllocations: [...inputs.unitAllocations, { ...inputs.unitAllocations[0], id: 'duplicate-49a', count: 2 }] };
const consolidated = updateHouseholdCountInInputs(duplicated, 'unit-49a', '1st', 15);
assert.equal(consolidated.unitAllocations.filter(a => a.unitTypeId === 'unit-49a' && a.tier === '1st').reduce((sum,a) => sum+a.count,0),15);
console.log('PASS: preset totals, prices/revenue, exact edits, rental area link, legacy preservation, preset application, and saved-data reload');
