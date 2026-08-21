"use strict";

const assert = require("assert");
const Core = require("../web/core.js");

function project() {
  return {
    schemaVersion: 4,
    appVersion: Core.APP_VERSION,
    listing: {
      address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M5J 2N8",
      price: "$3,850", rentPeriod: "per month", mls: "C1234567", beds: "2", baths: "2", sqft: "815",
      floor: "26th", exposure: "South-East", balcony: "Open balcony", parking: "1 Space", availability: "Immediately",
      headlineEn: "Lake views", headlineZh: "湖景生活",
    },
    contact: {name: "Daniel Xu", title: "Sales Representative", license: "", phone: "416-555-0198", email: "hello@example.com", website: "example.com", portraitMode: "initials", ctaTitleEn: "Find your next home", ctaTitleZh: "找到理想新居"},
    brand: {name: "Harbour Realty Group", tagline: "Move beautifully.", website: "example.com"},
    content: {featuresEn: "Windows\nTransit", featuresZh: "落地窗\n公共交通", amenitiesEn: "Gym", utilitiesEn: "Water", locationEn: "Waterfront"},
    language: {mode: "bilingual"}, typography: {style: "editorial"}, theme: {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"}, focal: [.5, .5], preset: "poster",
    media: {
      heroDataUrl: "data:image/png;base64,AA==", heroName: "hero.png", heroType: "image/png", gallery: [],
      floorplanDataUrl: "", floorplanName: "", floorplanType: "", logoLightDataUrl: "", logoLightName: "", logoLightType: "",
      logoDarkDataUrl: "", logoDarkName: "", logoDarkType: "", portraitDataUrl: "", portraitName: "", portraitType: "", portraitFocal: [.5, .5], floorplans: [],
    },
    modules: {
      propertyFacts: [
        {id: "beds", icon: "bed", source: "listing.beds", labelEn: "Bedrooms", labelZh: "卧室", visible: true, priority: 1},
        {id: "baths", icon: "bath", source: "listing.baths", labelEn: "Bathrooms", labelZh: "卫浴", visible: true, priority: 2},
        {id: "area", icon: "ruler-measure", source: "listing.sqft", labelEn: "Area", labelZh: "面积", visible: true, priority: 3},
        {id: "floor", icon: "building-skyscraper", source: "listing.floor", labelEn: "Floor", labelZh: "楼层", visible: true, priority: 6},
        {id: "parking", icon: "parking", source: "listing.parking", labelEn: "Parking", labelZh: "车位", visible: true, priority: 4},
      ],
      spotlights: [],
      leaseDetails: [
        {id: "term", labelEn: "Lease term", labelZh: "租期", valueEn: "12 months", valueZh: "一年", state: "active"},
        {id: "availability", labelEn: "Available", labelZh: "可入住", valueEn: "Immediately", valueZh: "随时", state: "active"},
      ],
      includedCosts: [{id: "water", icon: "droplet", labelEn: "Water", labelZh: "水费", state: "included"}],
      tenantPaidCosts: [{id: "hydro", icon: "bolt", labelEn: "Hydro", labelZh: "电费", state: "tenant-paid"}],
      amenities: [{id: "gym", icon: "tool", labelEn: "Fitness centre", labelZh: "健身中心", state: "active"}],
      applicationRequirements: [
        {id: "credit", icon: "receipt", labelEn: "Credit report", labelZh: "信用报告", state: "required"},
        {id: "references", icon: "circle-check", labelEn: "References", labelZh: "推荐人资料", state: "conditional"},
      ],
    },
    compliance: {profileId: "lease", profile: null, disclaimer: Core.COMPLIANCE_PROFILES.lease.disclaimer, applicationRequirementsConfirmed: true, applicationDisclaimer: "Informational only."},
    template: {name: "Harbour Editorial", version: "1.0.0", lockedFields: ["brand.name"]},
    review: {status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null},
  };
}

(async () => {
  assert.equal(Core.APP_VERSION, "1.4.0-dev");
  assert.equal(Core.PROJECT_SCHEMA_VERSION, 4);

  const valid = Core.validateProject(project());
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.profile.id, "lease");
  assert.ok(valid.warnings.includes("No floor plan selected"));

  const broken = project();
  broken.contact.email = "not-an-email";
  broken.listing.beds = "two";
  const errors = Core.validateProject(broken).errors.join("\n");
  assert.match(errors, /contact\.email/);
  assert.match(errors, /listing\.beds/);

  const approved = project(); approved.review.status = "Approved";
  const approvalErrors = Core.validateProject(approved).errors.join("\n");
  assert.match(approvalErrors, /review\.reviewer/);
  assert.match(approvalErrors, /review\.reviewedAt/);

  const missingDisclaimer = project(); missingDisclaimer.compliance.disclaimer = "";
  assert.match(Core.validateProject(missingDisclaimer).errors.join("\n"), /requires disclaimer text/);

  const missingTitle = project(); missingTitle.contact.title = "";
  assert.match(Core.validateProject(missingTitle).errors.join("\n"), /requires contact\.title/);

  const licenceProfile = project();
  licenceProfile.compliance.profileId = "licensed-brokerage";
  licenceProfile.compliance.profile = {id: "licensed-brokerage", name: "Licensed brokerage", version: "1.0.0", required: ["contact.license"], disclaimer: "Confirm registration."};
  licenceProfile.compliance.disclaimer = licenceProfile.compliance.profile.disclaimer;
  assert.match(Core.validateProject(licenceProfile).errors.join("\n"), /requires contact\.license/);
  licenceProfile.contact.license = "RECO 12345678";
  assert.doesNotMatch(Core.validateProject(licenceProfile).errors.join("\n"), /contact\.license/);

  const mismatchedProfile = project(); mismatchedProfile.compliance.profileId = "sale";
  mismatchedProfile.compliance.disclaimer = Core.COMPLIANCE_PROFILES.sale.disclaimer;
  assert.match(Core.validateProject(mismatchedProfile).errors.join("\n"), /does not match listing\.status/);

  const yaml = `listing:\n  status: "FOR SALE"\n  address: "10 King Street"\n  beds: 2\nphotos:\n  hero_focal: [0.6, 0.4]\n  gallery:\n    - "living.jpg"\n    - "kitchen.jpg"\n`;
  const parsed = Core.parseSimpleYaml(yaml);
  assert.equal(parsed.listing.address, "10 King Street");
  assert.deepEqual(parsed.photos.hero_focal, [0.6, 0.4]);
  assert.deepEqual(parsed.photos.gallery, ["living.jpg", "kitchen.jpg"]);
  assert.equal(Core.parseSimpleYaml('listing:\n  rent: "$3,850" # advertised price\n').listing.rent, "$3,850");
  const reparsed = Core.parseSimpleYaml(Core.toSimpleYaml(parsed));
  assert.deepEqual(reparsed, parsed);
  const emptyCollections = {photos: {gallery: []}, studio: {review: {}}};
  assert.deepEqual(Core.parseSimpleYaml(Core.toSimpleYaml(emptyCollections)), emptyCollections);

  const listingData = Core.toListingData(project());
  assert.equal(listingData.listing.rent, "$3,850");
  assert.equal(listingData.studio.language_mode, "bilingual");
  assert.equal(listingData.studio.media.heroDataUrl, project().media.heroDataUrl);
  const listingRoundTrip = Core.projectFromListingData(listingData, project());
  assert.equal(listingRoundTrip.media.heroDataUrl, project().media.heroDataUrl);
  assert.equal(listingRoundTrip.template.name, "Harbour Editorial");
  assert.deepEqual(listingRoundTrip.modules.propertyFacts, project().modules.propertyFacts);
  assert.deepEqual(listingRoundTrip.modules.leaseDetails, project().modules.leaseDetails);
  assert.deepEqual(listingRoundTrip.modules.includedCosts, project().modules.includedCosts);

  const templateSource = project();
  templateSource.preset = "story";
  templateSource.typography.style = "modern";
  templateSource.brand.name = "Daniel Xu Realty";
  templateSource.contact.phone = "416-555-0112";
  templateSource.media.logoLightDataUrl = "data:image/png;base64,Ag==";
  templateSource.media.logoLightName = "logo-light.png";
  const template = Core.buildTemplate(templateSource);
  assert.equal(template.kind, "realtor-poster-template");
  assert.equal(template.typography.style, "modern");
  assert.equal(template.layout.defaultPreset, "story");
  assert.ok(template.layout.moduleOrder.includes("applicationRequirements"));
  const templateTarget = project(); templateTarget.listing.price = "$4,100";
  const applied = Core.applyTemplate(templateTarget, template);
  assert.equal(applied.brand.name, "Daniel Xu Realty");
  assert.equal(applied.contact.phone, "416-555-0112");
  assert.equal(applied.typography.style, "modern");
  assert.equal(applied.preset, "story");
  assert.equal(applied.media.logoLightName, "logo-light.png");
  assert.equal(applied.listing.price, "$4,100");
  assert.equal(templateTarget.brand.name, "Harbour Realty Group");
  const duplicated = Core.duplicateTemplate(applied);
  assert.equal(duplicated.template.name, "Harbour Editorial Copy");
  assert.equal(applied.template.name, "Harbour Editorial");
  const legacyTemplate = {kind: "realtor-poster-template", schemaVersion: 1, name: "Legacy", version: "0.9.0", brand: {tagline: "Legacy brand"}};
  assert.equal(Core.applyTemplate(project(), legacyTemplate).brand.tagline, "Legacy brand");
  assert.throws(() => Core.applyTemplate(project(), {kind: "other"}), /Not a Realtor Poster template/);

  const copy = Core.campaignCopy(project());
  assert.equal(copy.shared.address, "88 Harbour Street");
  assert.equal(copy.shared.mls, "C1234567");
  assert.equal(copy.english.headline, "Lake views");
  assert.equal(copy.chinese.headline, "湖景生活");
  assert.deepEqual(copy.english.features, ["Windows", "Transit"]);
  assert.deepEqual(copy.chinese.features, ["落地窗", "公共交通"]);

  const factsProject = project();
  assert.equal(Core.resolvedPropertyFacts(factsProject, "poster").length, 5);
  assert.equal(Core.resolvedPropertyFacts(factsProject, "square").length, 4);
  assert.ok(!Core.resolvedPropertyFacts(factsProject, "square").some(fact => fact.id === "floor"));
  factsProject.listing.beds = "3";
  assert.equal(Core.resolvedPropertyFacts(factsProject, "poster")[0].value, "3");
  const tooManyFacts = project();
  tooManyFacts.modules.propertyFacts = Array.from({length: 9}, (_, index) => ({id: `fact-${index}`, icon: "photo", value: String(index), labelEn: "Fact", labelZh: "信息", visible: true, priority: index + 1}));
  assert.match(Core.validateProject(tooManyFacts).errors.join("\n"), /at most 8 facts/);

  const planProject = project();
  planProject.media.floorplans = [
    {role: "furnished3d", name: "3d.png", type: "image/png", dataUrl: "data:image/png;base64,AQ==", fit: "contain", focal: [.5, .5], captionEn: "3D plan", captionZh: "三维户型图", noteEn: "Illustrative", noteZh: "示意", pixelWidth: 1600, pixelHeight: 1200},
    {role: "technical2d", name: "2d.png", type: "image/png", dataUrl: "data:image/png;base64,Ag==", fit: "crop", focal: [.4, .6], captionEn: "2D plan", captionZh: "二维户型图", noteEn: "Verify dimensions", noteZh: "请核实尺寸", pixelWidth: 500, pixelHeight: 500},
  ];
  assert.equal(Core.activeFloorPlans(planProject).length, 2);
  assert.match(Core.validateProject(planProject).warnings.join("\n"), /low-resolution/);
  const invalidPlan = project(); invalidPlan.media.floorplans = [{role: "technical2d", fit: "stretch", focal: [2, 0], dataUrl: "data:image/png;base64,AQ=="}];
  assert.match(Core.validateProject(invalidPlan).errors.join("\n"), /fit must be contain/);
  assert.match(Core.validateProject(invalidPlan).errors.join("\n"), /focal must be/);

  const spotlightProject = project();
  spotlightProject.modules.spotlights = [
    {id: "laundry", name: "laundry.png", dataUrl: "data:image/png;base64,Aw==", titleEn: "In-suite laundry", titleZh: "套内洗衣", detailEn: "Stacked washer and dryer", detailZh: "叠放式洗衣机和烘干机", mask: "circle", focal: [.5, .5], visible: true},
  ];
  assert.equal(Core.activeSpotlights(spotlightProject).length, 1);
  const incompleteSpotlight = project(); incompleteSpotlight.modules.spotlights = [{id: "view", titleEn: "View", titleZh: "", mask: "rounded", focal: [.5, .5], visible: true}];
  assert.match(Core.validateProject(incompleteSpotlight).warnings.join("\n"), /missing a Chinese title/);
  const tooManySpotlights = project(); tooManySpotlights.modules.spotlights = Array.from({length: 4}, (_, index) => ({id: `spot-${index}`, titleEn: "Feature", titleZh: "卖点", mask: "circle", focal: [.5, .5], visible: true}));
  assert.match(Core.validateProject(tooManySpotlights).errors.join("\n"), /at most 3 callouts/);

  const saleTerms = project(); saleTerms.listing.status = "FOR SALE"; saleTerms.compliance.profileId = "sale"; saleTerms.compliance.disclaimer = Core.COMPLIANCE_PROFILES.sale.disclaimer;
  assert.deepEqual(Core.activeLeaseDetails(saleTerms), []);
  assert.deepEqual(Core.activeIncludedCosts(saleTerms), []);
  assert.deepEqual(Core.activeTenantPaidCosts(saleTerms), []);
  assert.deepEqual(Core.activeApplicationRequirements(saleTerms), []);
  const missingLeaseTerm = project(); missingLeaseTerm.modules.leaseDetails.find(item => item.id === "term").state = "hidden";
  assert.match(Core.validateProject(missingLeaseTerm).warnings.join("\n"), /completed term detail/);

  const conflictProject = project(); conflictProject.modules.tenantPaidCosts.push({id: "water", labelEn: "Water", labelZh: "水费", state: "tenant-paid"});
  assert.deepEqual(Core.costConflicts(conflictProject), ["Water"]);
  assert.match(Core.validateProject(conflictProject).errors.join("\n"), /both included and tenant-paid/);

  assert.equal(Core.activeTenantPaidCosts(project()).length, 1);
  assert.equal(Core.activeAmenities(project()).length, 1);
  assert.equal(Core.activeApplicationRequirements(project()).length, 2);
  const unconfirmedRequirements = project(); unconfirmedRequirements.compliance.applicationRequirementsConfirmed = false;
  assert.match(Core.validateProject(unconfirmedRequirements).errors.join("\n"), /require compliance-profile confirmation/);
  const tooManyAmenities = project(); tooManyAmenities.modules.amenities = Array.from({length: 13}, (_, index) => ({id: `amenity-${index}`, labelEn: "Amenity", labelZh: "设施", state: "active"}));
  assert.match(Core.validateProject(tooManyAmenities).errors.join("\n"), /at most 12 items/);
  const tooManyRequirements = project(); tooManyRequirements.modules.applicationRequirements = Array.from({length: 11}, (_, index) => ({id: `requirement-${index}`, labelEn: "Requirement", labelZh: "要求", state: "required"}));
  assert.match(Core.validateProject(tooManyRequirements).errors.join("\n"), /at most 10 items/);
  const portraitProject = project(); portraitProject.contact.portraitMode = "photo"; portraitProject.media.portraitName = "agent.png";
  assert.match(Core.validateProject(portraitProject).warnings.join("\n"), /Photo mode needs a local portrait/);
  for (const portraitMode of ["photo", "illustrated", "initials", "none"]) {
    const portraitState = project(); portraitState.contact.portraitMode = portraitMode;
    if (portraitMode === "photo" || portraitMode === "illustrated") portraitState.media.portraitDataUrl = "data:image/png;base64,BA==";
    assert.doesNotMatch(Core.validateProject(portraitState).errors.join("\n"), /portraitMode/);
  }
  const invalidPortrait = project(); invalidPortrait.contact.portraitMode = "generated";
  assert.match(Core.validateProject(invalidPortrait).errors.join("\n"), /Unsupported contact\.portraitMode/);
  const hiddenModules = project(); hiddenModules.modules.tenantPaidCosts[0].state = "hidden"; hiddenModules.modules.amenities[0].state = "hidden"; hiddenModules.modules.applicationRequirements.forEach(item => { item.state = "hidden"; });
  assert.equal(Core.activeTenantPaidCosts(hiddenModules).length, 0);
  assert.equal(Core.activeAmenities(hiddenModules).length, 0);
  assert.equal(Core.activeApplicationRequirements(hiddenModules).length, 0);
  const verifyCost = project(); verifyCost.modules.tenantPaidCosts[0].state = "unknown";
  assert.equal(Core.activeTenantPaidCosts(verifyCost)[0].state, "unknown");

  const current = project(); const previous = project(); current.listing.price = "$3,950"; current.media.heroName = "new-hero.png";
  const changes = Core.diffProjects(previous, current).map(change => change.path);
  assert.ok(changes.includes("listing.price"));
  assert.ok(changes.includes("media.heroName"));
  const imageBefore = project(); const imageAfter = project(); imageAfter.media.heroDataUrl = "data:image/png;base64,AQ==";
  assert.ok(Core.diffProjects(imageBefore, imageAfter).some(change => change.path === "media.heroDataUrl"));

  const zip = Core.makeZip([{name: "proof.txt", data: new TextEncoder().encode("checked")}]);
  const zipView = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  assert.equal(zipView.getUint32(0, true), 0x04034b50);
  assert.equal(zipView.getUint32(zip.length - 22, true), 0x06054b50);
  assert.equal(zipView.getUint16(zip.length - 14, true), 1);

  const approval = Core.buildApprovalRecord(project(), [{path: "listing.price", before: "$3,850", after: "$3,950"}]);
  assert.equal(approval.status, "Draft");
  assert.equal(approval.changes[0].path, "listing.price");
  assert.match(approval.statement, /not an electronic signature or legal/);

  const output = {name: "poster.png", data: new Uint8Array([1, 2, 3, 4])};
  planProject.modules.spotlights = spotlightProject.modules.spotlights;
  planProject.contact.portraitMode = "photo"; planProject.media.portraitName = "agent.png"; planProject.media.portraitDataUrl = "data:image/png;base64,BA==";
  const manifest = await Core.buildManifest(planProject, [output]);
  assert.equal(manifest.generator, "realtor-poster-studio 1.4.0-dev");
  assert.equal(manifest.outputs[0].filename, "poster.png");
  assert.equal(manifest.outputs[0].sha256.length, 64);
  assert.equal(manifest.compliance.profile, "Residential lease");
  assert.equal(manifest.template.name, "Harbour Editorial");
  assert.equal(manifest.language.typographyStyle, "editorial");
  assert.ok(manifest.language.fonts.some(font => font.includes("PingFang SC")));
  assert.equal(manifest.modules.propertyFacts.length, 5);
  assert.equal(manifest.modules.floorPlans.length, 2);
  assert.equal(manifest.modules.spotlights.length, 1);
  assert.equal(manifest.modules.leaseDetails.length, 2);
  assert.equal(manifest.modules.includedCosts.length, 1);
  assert.equal(manifest.modules.tenantPaidCosts.length, 1);
  assert.equal(manifest.modules.amenities.length, 1);
  assert.equal(manifest.modules.applicationRequirements.length, 2);
  assert.equal(manifest.modules.agentProfile.name, "Daniel Xu");
  assert.ok(manifest.template.moduleOrder.includes("agentProfile"));
  assert.match(manifest.template.layoutPolicy.story, /two included and two tenant-paid costs/);
  assert.equal(manifest.assets.filter(asset => asset.role.startsWith("floorplan_")).length, 2);
  assert.equal(manifest.assets.filter(asset => asset.role.startsWith("spotlight_")).length, 1);
  assert.equal(manifest.assets.filter(asset => asset.role === "portrait").length, 1);

  console.log("Browser core tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
