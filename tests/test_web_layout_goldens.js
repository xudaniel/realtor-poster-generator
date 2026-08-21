"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Core = require("../web/core.js");

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "v1.4-layout-goldens.json"), "utf8"));

function items(count, factory) {
  return Array.from({length: count}, (_, index) => factory(index));
}

function projectFromDescriptor(input) {
  return {
    preset: input.preset,
    listing: {status: input.status},
    language: {mode: input.language},
    contact: {portraitMode: input.portraitMode},
    media: {
      floorplans: items(input.floorPlans, index => ({role: index ? "technical2d" : "furnished3d", name: `plan-${index + 1}.png`})),
    },
    modules: {
      propertyFacts: items(input.facts, index => ({id: `fact-${index + 1}`, value: String(index + 1), labelEn: `Fact ${index + 1}`, labelZh: `信息 ${index + 1}`, visible: true, priority: index + 1})),
      spotlights: items(input.spotlights, index => ({id: `spotlight-${index + 1}`, titleEn: `Spotlight ${index + 1}`, titleZh: `卖点 ${index + 1}`, visible: true})),
      leaseDetails: items(input.leaseDetails, index => ({id: `lease-${index + 1}`, labelEn: `Term ${index + 1}`, labelZh: `条件 ${index + 1}`, valueEn: "Provided", valueZh: "已提供", state: "active"})),
      includedCosts: items(input.includedCosts, index => ({id: `included-${index + 1}`, labelEn: `Included ${index + 1}`, labelZh: `包含 ${index + 1}`, state: "included"})),
      tenantPaidCosts: items(input.tenantPaidCosts, index => ({id: `tenant-${index + 1}`, labelEn: `Tenant ${index + 1}`, labelZh: `租客 ${index + 1}`, state: "tenant-paid"})),
      amenities: items(input.amenities, index => ({id: `amenity-${index + 1}`, labelEn: `Amenity ${index + 1}`, labelZh: `设施 ${index + 1}`, state: "active"})),
      applicationRequirements: items(input.applicationRequirements, index => ({id: `requirement-${index + 1}`, labelEn: `Requirement ${index + 1}`, labelZh: `要求 ${index + 1}`, state: index % 2 ? "conditional" : "required"})),
    },
  };
}

assert.equal(fixtures.length, 4);
for (const fixture of fixtures) {
  const project = projectFromDescriptor(fixture.input);
  const first = Core.layoutSnapshot(project, fixture.input.preset);
  const second = Core.layoutSnapshot(Core.clone(project), fixture.input.preset);
  assert.deepEqual(first, fixture.expected, `${fixture.name} layout snapshot changed`);
  assert.equal(Core.canonicalStringify(first), Core.canonicalStringify(second), `${fixture.name} layout snapshot is not deterministic`);
}

assert.deepEqual(Core.OUTPUT_DIMENSIONS.poster, [1800, 2400]);
assert.deepEqual(Core.OUTPUT_DIMENSIONS.square, [1080, 1080]);
assert.deepEqual(Core.OUTPUT_DIMENSIONS.portrait, [1080, 1350]);
assert.deepEqual(Core.OUTPUT_DIMENSIONS.story, [1080, 1920]);
assert.deepEqual(Core.OUTPUT_DIMENSIONS.landscape, [1200, 630]);

console.log("Browser v1.4 layout golden tests passed.");
