"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Core = require("../web/core.js");

function project() {
  return {
    schemaVersion: 6,
    appVersion: Core.APP_VERSION,
    listing: {
      address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M5J 2N8",
      price: "$3,850", rentPeriod: "per month", mls: "C1234567", beds: "2", bedsAdditional: "0", baths: "2", sqft: "815",
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
  assert.equal(Core.APP_VERSION, "1.4.3");
  assert.equal(Core.PROJECT_SCHEMA_VERSION, 6);
  assert.equal(Core.bedroomDisplay(project()), "2");
  for (const [primary, additional, expected] of [["1", "0", "1"], ["1", "1", "1 + 1"], ["2", "0", "2"], ["2", "1", "2 + 1"], ["3", "0", "3"], ["3", "1", "3 + 1"], ["0", "0", "0"], ["20", "10", "20 + 10"]]) {
    const bedroomProject = project(); bedroomProject.listing.beds = primary; bedroomProject.listing.bedsAdditional = additional;
    assert.equal(Core.bedroomDisplay(bedroomProject), expected);
  }
  const bilingualBedrooms = project(); bilingualBedrooms.listing.beds = "2"; bilingualBedrooms.listing.bedsAdditional = "1";
  assert.equal(Core.bedroomAccessibleCopy(bilingualBedrooms, "english"), "2 bedrooms + 1 additional room/den");
  assert.equal(Core.bedroomAccessibleCopy(bilingualBedrooms, "chinese"), "2 间卧室 + 1 个额外房间/书房");
  assert.equal(Core.allPropertyFacts(bilingualBedrooms)[0].labelEn, "Beds + room/den");
  assert.equal(Core.allPropertyFacts(bilingualBedrooms)[0].labelZh, "卧室 + 额外房间/书房");

  const valid = Core.validateProject(project());
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.profile.id, "lease");
  assert.ok(valid.warnings.includes("No floor plan selected"));
  assert.equal(Core.preflightPresentation(project()).warnings.find(item => item.detail === "No floor plan selected").targetId, "plans-editor");

  const broken = project();
  broken.contact.email = "not-an-email";
  broken.listing.beds = "two";
  const errors = Core.validateProject(broken).errors.join("\n");
  assert.match(errors, /contact\.email/);
  assert.match(errors, /listing\.beds/);
  const invalidAdditional = project(); invalidAdditional.listing.bedsAdditional = "1.5";
  const additionalErrors = Core.validateProject(invalidAdditional).errors.join("\n");
  assert.match(additionalErrors, /listing\.bedsAdditional must be a whole number from 0 to 10/);
  assert.equal(Core.preflightPresentation(invalidAdditional).blockers.find(item => item.targetPath === "listing.bedsAdditional").actionLabel, "Go to field");
  for (const [path, value] of [
    ["listing.beds", "-1"], ["listing.beds", "1.5"], ["listing.beds", "21"], ["listing.beds", true], ["listing.beds", [2]], ["listing.beds", {value: 2}], ["listing.beds", "9".repeat(100)],
    ["listing.bedsAdditional", "-1"], ["listing.bedsAdditional", "11"], ["listing.bedsAdditional", false], ["listing.bedsAdditional", [1]],
  ]) {
    const bounded = project(); Core.setPath(bounded, path, value);
    assert.ok(Core.validateProject(bounded).errors.some(message => message.startsWith(path)), `${path}=${value} should be rejected`);
  }
  const mixedBedrooms = project(); mixedBedrooms.listing.beds = "2 + 1"; mixedBedrooms.listing.bedsAdditional = "0";
  assert.equal(Core.bedroomDisplay(mixedBedrooms), "2 + 1", "a conflicting source expression must not be silently rewritten");
  assert.match(Core.validateProject(mixedBedrooms).errors.join("\n"), /use the two separate whole-number fields/);
  assert.equal(Core.preflightPresentation(mixedBedrooms).blockers.find(item => item.targetPath === "listing.beds").actionLabel, "Go to field");

  const approved = project(); approved.review.status = "Approved";
  const approvalErrors = Core.validateProject(approved).errors.join("\n");
  assert.match(approvalErrors, /review\.reviewer/);
  assert.match(approvalErrors, /review\.reviewedAt/);

  const missingDisclaimer = project(); missingDisclaimer.compliance.disclaimer = "";
  assert.match(Core.validateProject(missingDisclaimer).errors.join("\n"), /requires disclaimer text/);

  const missingTitle = project(); missingTitle.contact.title = "";
  assert.match(Core.validateProject(missingTitle).errors.join("\n"), /requires contact\.title/);
  const missingTitlePreflight = Core.preflightPresentation(missingTitle);
  assert.equal(missingTitlePreflight.blockers.length, 1);
  assert.equal(missingTitlePreflight.blockers.length, Core.validateProject(missingTitle).errors.length);
  assert.equal(missingTitlePreflight.blockers.find(item => item.targetPath === "contact.title").title, "Review agent title");
  assert.equal(missingTitlePreflight.blockers.find(item => item.targetPath === "contact.title").actionLabel, "Go to field");
  assert.ok(Core.preflightPresentation(broken).blockers.length > 1);
  const missingHero = project(); missingHero.media.heroDataUrl = "";
  const heroBlocker = Core.preflightPresentation(missingHero).blockers.find(item => item.id === "hero-required");
  assert.equal(heroBlocker.targetId, "hero-upload");
  assert.doesNotMatch(heroBlocker.detail, /media\.heroDataUrl/);

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
  assert.equal(listingData.listing.beds_additional, 0);
  assert.equal(listingData.studio.language_mode, "bilingual");
  assert.equal(listingData.studio.media.heroDataUrl, project().media.heroDataUrl);
  const listingRoundTrip = Core.projectFromListingData(listingData, project());
  assert.equal(listingRoundTrip.media.heroDataUrl, project().media.heroDataUrl);
  assert.equal(listingRoundTrip.template.name, "Harbour Editorial");
  assert.deepEqual(listingRoundTrip.modules.propertyFacts, project().modules.propertyFacts);
  assert.deepEqual(listingRoundTrip.modules.leaseDetails, project().modules.leaseDetails);
  assert.deepEqual(listingRoundTrip.modules.includedCosts, project().modules.includedCosts);
  const bedroomInterchange = {listing: {beds: 2, beds_additional: 1}};
  const bedroomRoundTrip = Core.projectFromListingData(Core.parseSimpleYaml(Core.toSimpleYaml(bedroomInterchange)), project());
  assert.equal(bedroomRoundTrip.listing.beds, "2");
  assert.equal(bedroomRoundTrip.listing.bedsAdditional, "1");
  assert.equal(Core.bedroomDisplay(bedroomRoundTrip), "2 + 1");
  const portableBedroomProject = project(); portableBedroomProject.listing.beds = "3"; portableBedroomProject.listing.bedsAdditional = "1";
  const reopenedPortableBedroomProject = Core.normalizeProject(JSON.parse(JSON.stringify(portableBedroomProject)), project());
  assert.equal(reopenedPortableBedroomProject.listing.beds, "3");
  assert.equal(reopenedPortableBedroomProject.listing.bedsAdditional, "1");
  const mixedInterchange = Core.projectFromListingData({listing: {beds: "2 + 1", beds_additional: 0}}, project());
  assert.match(Core.validateProject(mixedInterchange).errors.join("\n"), /use the two separate whole-number fields/);
  const legacyProject = project(); legacyProject.schemaVersion = 5; legacyProject.listing.beds = "2"; delete legacyProject.listing.bedsAdditional;
  assert.equal(Core.normalizeProject(legacyProject, project()).listing.bedsAdditional, "0");
  const legacyCompoundProject = project(); legacyCompoundProject.schemaVersion = 5; legacyCompoundProject.listing.beds = "1 + 1"; delete legacyCompoundProject.listing.bedsAdditional;
  const migratedCompound = Core.normalizeProject(legacyCompoundProject, project());
  assert.equal(migratedCompound.listing.beds, "1");
  assert.equal(migratedCompound.listing.bedsAdditional, "1");

  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "mls", "synthetic_provider.json"), "utf8"));
  const exactResponse = {...fixture.scenarios["SYN-EXACT"].body, provider: fixture.provider, retrievedAt: "2026-08-21T12:00:00Z"};
  const exactRequest = {providerId: fixture.provider.id, board: fixture.provider.board, listingNumber: "SYN-EXACT"};
  const importPlan = Core.buildMlsImportPlan(project(), exactResponse, exactRequest);
  assert.equal(importPlan.exactMatch, true);
  assert.equal(importPlan.candidate["listing.address"], "100 Test Avenue");
  assert.equal(importPlan.candidate["content.featuresEn"], "Synthetic feature one\nSynthetic feature two");
  assert.equal(importPlan.provider.board, "SYNTH-BOARD");
  assert.equal(Object.prototype.hasOwnProperty.call(importPlan.fields, "listing.bedsAdditional"), false, "missing optional den data must not be inferred");
  assert.deepEqual(importPlan.blocked, ["synthetic-plan", "synthetic-denied"]);
  const importedProject = Core.applyMlsImport(project(), importPlan, {overwriteLocalImages: true, overwriteUserOverrides: true});
  assert.equal(importedProject.listing.mls, "SYN-EXACT");
  assert.equal(importedProject.contact.name, "Daniel Xu");
  assert.equal(importedProject.brand.name, "Harbour Realty Group");
  assert.equal(importedProject.media.heroName, "synthetic-hero.png");
  const missingAdditionalOverride = Core.clone(importedProject); missingAdditionalOverride.mlsImport.reviewConfirmed = true; missingAdditionalOverride.mlsImport.reviewedAt = "2026-08-21T12:10:00Z";
  missingAdditionalOverride.listing.bedsAdditional = "1"; Core.recordMlsOverride(missingAdditionalOverride, "listing.bedsAdditional", "1");
  assert.equal(missingAdditionalOverride.mlsImport.fields["listing.bedsAdditional"].status, "user-overridden");
  assert.equal(missingAdditionalOverride.mlsImport.fields["listing.bedsAdditional"].sourceMissing, true);
  assert.equal(missingAdditionalOverride.mlsImport.fields["listing.bedsAdditional"].originalValue, null);
  assert.equal(missingAdditionalOverride.mlsImport.reviewConfirmed, false);
  assert.equal(missingAdditionalOverride.mlsImport.reviewedAt, "");
  assert.match(Core.validateProject(importedProject).errors.join("\n"), /image-rights/);
  assert.match(Core.validateProject(importedProject).errors.join("\n"), /explicit human review/);
  const confirmedImage = Core.confirmMlsImageRights(importedProject, "synthetic-plan");
  assert.equal(confirmedImage.media.floorplans[0].name, "synthetic-plan.png");
  assert.throws(() => Core.resolveMlsImageWithReplacement(confirmedImage, "synthetic-denied"), error => error.code === "MLS_IMAGE_REPLACEMENT_REQUIRED");
  confirmedImage.media.gallery.push({name: "local-replacement.png", type: "image/png", dataUrl: "data:image/png;base64,BA=="});
  const replacedImage = Core.resolveMlsImageWithReplacement(confirmedImage, "synthetic-denied");
  assert.equal(Core.mlsCompleteness(replacedImage).blocked, 0);
  replacedImage.mlsImport.reviewConfirmed = true; replacedImage.mlsImport.reviewedAt = "2026-08-21T12:10:00Z";
  assert.doesNotMatch(Core.validateProject(replacedImage).errors.join("\n"), /Authorized MLS/);
  replacedImage.listing.price = "$3,350"; Core.recordMlsOverride(replacedImage, "listing.price", replacedImage.listing.price);
  assert.equal(replacedImage.mlsImport.fields["listing.price"].status, "user-overridden");
  assert.equal(replacedImage.mlsImport.reviewConfirmed, false);
  assert.equal(replacedImage.mlsImport.reviewedAt, "");
  assert.equal(Core.mlsCompleteness(replacedImage).overridden, 1);
  const actionableMlsPreflight = Core.preflightPresentation(replacedImage);
  const mlsReviewBlocker = actionableMlsPreflight.blockers.find(item => item.id === "mls-review-required");
  assert.equal(mlsReviewBlocker.title, "Review imported MLS facts");
  assert.equal(mlsReviewBlocker.targetId, "mls-review-confirmed");
  const overrideWarning = actionableMlsPreflight.warnings.find(item => item.id === "mls-local-overrides");
  assert.equal(overrideWarning.title, "Changed since import");
  assert.equal(overrideWarning.targetPath, "listing.price");
  assert.match(overrideWarning.detail, /1 field differs/);
  assert.match(overrideWarning.detail, /Changed: Price/);
  assert.equal(actionableMlsPreflight.blockers.length, Core.validateProject(replacedImage).errors.length, "warnings must not increase the blocker count");
  replacedImage.listing.beds = "3"; Core.recordMlsOverride(replacedImage, "listing.beds", replacedImage.listing.beds);
  replacedImage.mlsImport.stale = true;
  const multipleWarningPreflight = Core.preflightPresentation(replacedImage);
  assert.ok(multipleWarningPreflight.warnings.length > 1);
  assert.match(multipleWarningPreflight.warnings.find(item => item.id === "mls-local-overrides").detail, /2 fields differ.*Price, Main bedrooms/);
  replacedImage.mlsImport.reviewConfirmed = true;
  assert.equal(Core.preflightPresentation(replacedImage).blockers.some(item => item.id === "mls-review-required"), false, "resolving review removes its blocker immediately");
  replacedImage.mlsImport.reviewConfirmed = false;
  const refreshed = JSON.parse(JSON.stringify(exactResponse)); refreshed.matches[0].price = "$3,400"; refreshed.retrievedAt = "2026-08-21T13:00:00Z";
  const refreshPlan = Core.buildMlsImportPlan(replacedImage, refreshed, exactRequest);
  assert.equal(refreshPlan.refresh.sameListing, true);
  assert.equal(refreshPlan.refresh.requiresConfirmation, true);
  assert.ok(refreshPlan.refresh.changes.some(change => change.path === "listing.price"));
  const preservedOverride = Core.applyMlsImport(replacedImage, refreshPlan, {overwriteUserOverrides: false});
  assert.equal(preservedOverride.listing.price, "$3,350");
  assert.equal(preservedOverride.mlsImport.fields["listing.price"].status, "user-overridden");
  assert.equal(preservedOverride.mlsImport.fields["listing.price"].originalValue, "$3,400");
  assert.equal(preservedOverride.mlsImport.fields["listing.price"].currentValue, "$3,350");
  const explicitAdditionalResponse = JSON.parse(JSON.stringify(exactResponse)); explicitAdditionalResponse.matches[0].bedsAdditional = 1;
  const explicitAdditionalPlan = Core.buildMlsImportPlan(project(), explicitAdditionalResponse, exactRequest);
  assert.equal(explicitAdditionalPlan.candidate["listing.beds"], "2");
  assert.equal(explicitAdditionalPlan.candidate["listing.bedsAdditional"], "1");
  const explicitAdditionalProject = Core.applyMlsImport(project(), explicitAdditionalPlan, {overwriteUserOverrides: true});
  const omittedAdditionalPlan = Core.buildMlsImportPlan(explicitAdditionalProject, exactResponse, exactRequest);
  assert.ok(omittedAdditionalPlan.refresh.changes.some(change => change.path === "listing.bedsAdditional" && change.after === null));
  const preservedMissingAdditional = Core.applyMlsImport(explicitAdditionalProject, omittedAdditionalPlan, {overwriteUserOverrides: true});
  assert.equal(preservedMissingAdditional.listing.bedsAdditional, "1");
  assert.equal(preservedMissingAdditional.mlsImport.fields["listing.bedsAdditional"].status, "user-overridden");
  assert.equal(preservedMissingAdditional.mlsImport.fields["listing.bedsAdditional"].sourceMissing, true);
  assert.equal(preservedMissingAdditional.mlsImport.fields["listing.bedsAdditional"].previousOriginalValue, "1");
  const compoundResponse = JSON.parse(JSON.stringify(exactResponse)); compoundResponse.matches[0].beds = "2 + 1";
  const compoundPlan = Core.buildMlsImportPlan(project(), compoundResponse, exactRequest);
  assert.equal(compoundPlan.candidate["listing.beds"], "2");
  assert.equal(compoundPlan.candidate["listing.bedsAdditional"], "1");
  assert.equal(compoundPlan.fields["listing.beds"].sourceValue, "2 + 1");
  assert.equal(compoundPlan.fields["listing.bedsAdditional"].sourceValue, "2 + 1");
  const importedCompound = Core.applyMlsImport(project(), compoundPlan, {overwriteUserOverrides: true});
  importedCompound.mlsImport.reviewConfirmed = true; importedCompound.mlsImport.reviewedAt = "2026-08-21T12:10:00Z";
  importedCompound.listing.bedsAdditional = "2"; Core.recordMlsOverride(importedCompound, "listing.bedsAdditional", "2");
  assert.equal(importedCompound.mlsImport.fields["listing.bedsAdditional"].status, "user-overridden");
  assert.equal(importedCompound.mlsImport.reviewConfirmed, false);
  const externallyChangedProject = Core.clone(explicitAdditionalProject); externallyChangedProject.mlsImport.reviewConfirmed = true; externallyChangedProject.mlsImport.reviewedAt = "2026-08-21T12:10:00Z"; externallyChangedProject.listing.beds = "4";
  const reconciledProject = Core.normalizeProject(externallyChangedProject, project());
  assert.equal(reconciledProject.mlsImport.fields["listing.beds"].status, "user-overridden");
  assert.equal(reconciledProject.mlsImport.fields["listing.beds"].currentValue, "4");
  assert.equal(reconciledProject.mlsImport.reviewConfirmed, false);
  const simpleAfterCompoundPlan = Core.buildMlsImportPlan(importedCompound, exactResponse, exactRequest);
  assert.ok(simpleAfterCompoundPlan.refresh.changes.some(change => change.path === "listing.bedsAdditional" && change.after === null));
  const preservedAfterCompound = Core.applyMlsImport(importedCompound, simpleAfterCompoundPlan, {overwriteUserOverrides: true});
  assert.equal(preservedAfterCompound.mlsImport.fields["listing.bedsAdditional"].sourceMissing, true);
  const ambiguousBedroomResponse = JSON.parse(JSON.stringify(exactResponse)); ambiguousBedroomResponse.matches[0].beds = "2 + 1"; ambiguousBedroomResponse.matches[0].bedsAdditional = 1;
  assert.throws(() => Core.buildMlsImportPlan(project(), ambiguousBedroomResponse, exactRequest), error => error.code === "MLS_BEDROOM_CONFLICT");
  assert.throws(() => Core.buildMlsImportPlan(project(), {...fixture.scenarios["SYN-AMBIGUOUS"].body, provider: fixture.provider}, {...exactRequest, listingNumber: "SYN-AMBIGUOUS"}), error => error.code === "MLS_AMBIGUOUS");
  assert.throws(() => Core.buildMlsImportPlan(project(), {...fixture.scenarios["SYN-INCOMPLETE"].body, provider: fixture.provider}, {...exactRequest, listingNumber: "SYN-INCOMPLETE"}), error => error.code === "MLS_INCOMPLETE_IDENTITY");
  assert.throws(() => Core.buildMlsImportPlan(project(), {...fixture.scenarios["SYN-WITHDRAWN"].body, provider: fixture.provider}, {...exactRequest, listingNumber: "SYN-WITHDRAWN"}), error => error.code === "MLS_WITHDRAWN");
  const stalePlan = Core.buildMlsImportPlan(project(), {...fixture.scenarios["SYN-STALE"].body, provider: fixture.provider}, {...exactRequest, listingNumber: "SYN-STALE"});
  assert.equal(stalePlan.stale, true);
  const sanitized = Core.sanitizeMlsValue({provider: "safe", accessToken: "do-not-export", nested: {password: "hidden", board: "visible"}});
  assert.deepEqual(sanitized, {provider: "safe", nested: {board: "visible"}});

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
  assert.equal(copy.shared.bedsAdditional, "0");
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
  factsProject.listing.bedsAdditional = "1";
  assert.equal(Core.resolvedPropertyFacts(factsProject, "poster")[0].value, "3 + 1");
  assert.equal(Core.resolvedPropertyFacts(factsProject, "poster")[0].labelEn, "Beds + room/den");
  factsProject.modules.propertyFacts[0].visible = false;
  assert.equal(Core.allPropertyFacts(factsProject)[0].value, "3 + 1");
  assert.equal(Core.allPropertyFacts(factsProject)[0].visible, false);
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
  const tooManyLeaseDetails = project(); tooManyLeaseDetails.modules.leaseDetails = Array.from({length: 10}, (_, index) => ({id: `lease-${index}`, labelEn: "Term", labelZh: "条件", valueEn: "Provided", valueZh: "已提供", state: "active"}));
  assert.match(Core.validateProject(tooManyLeaseDetails).errors.join("\n"), /at most 9 rows/);
  assert.equal(Core.activeLeaseDetails(tooManyLeaseDetails).length, 9);
  const longLeaseDetail = project(); longLeaseDetail.modules.leaseDetails[0].valueEn = "x".repeat(121);
  assert.match(Core.validateProject(longLeaseDetail).errors.join("\n"), /120 characters or fewer/);

  const conflictProject = project(); conflictProject.modules.tenantPaidCosts.push({id: "water", labelEn: "Water", labelZh: "水费", state: "tenant-paid"});
  assert.deepEqual(Core.costConflicts(conflictProject), ["Water"]);
  assert.match(Core.validateProject(conflictProject).errors.join("\n"), /both included and tenant-paid/);

  assert.equal(Core.activeTenantPaidCosts(project()).length, 1);
  assert.equal(Core.activeAmenities(project()).length, 1);
  assert.equal(Core.activeApplicationRequirements(project()).length, 2);
  const unconfirmedRequirements = project(); unconfirmedRequirements.compliance.applicationRequirementsConfirmed = false;
  assert.match(Core.validateProject(unconfirmedRequirements).errors.join("\n"), /require compliance-profile confirmation/);
  const requirementsBlocker = Core.preflightPresentation(unconfirmedRequirements).blockers.find(item => item.id === "application-confirmation");
  assert.equal(requirementsBlocker.targetPath, "compliance.applicationRequirementsConfirmed");
  assert.equal(requirementsBlocker.actionLabel, "Review requirements");
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
  const bedroomChange = project(); bedroomChange.listing.bedsAdditional = "1";
  assert.ok(Core.diffProjects(project(), bedroomChange).some(change => change.path === "listing.bedsAdditional"));
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
  const bedroomApproval = Core.buildApprovalRecord(bedroomChange, Core.diffProjects(project(), bedroomChange));
  assert.ok(bedroomApproval.changes.some(change => change.path === "listing.bedsAdditional"));

  const output = {name: "poster.png", data: new Uint8Array([1, 2, 3, 4])};
  planProject.modules.spotlights = spotlightProject.modules.spotlights;
  planProject.modules.propertyFacts[4].visible = false;
  planProject.listing.bedsAdditional = "1";
  planProject.contact.portraitMode = "photo"; planProject.media.portraitName = "agent.png"; planProject.media.portraitDataUrl = "data:image/png;base64,BA==";
  const manifest = await Core.buildManifest(planProject, [output]);
  assert.equal(manifest.generator, "realtor-poster-studio 1.4.3");
  assert.equal(manifest.modules.bedrooms.primary, 2);
  assert.equal(manifest.modules.bedrooms.additional, 1);
  assert.equal(manifest.modules.bedrooms.display, "2 + 1");
  assert.equal(manifest.modules.bedrooms.accessible.chinese, "2 间卧室 + 1 个额外房间/书房");
  assert.equal(manifest.outputs[0].filename, "poster.png");
  assert.equal(manifest.outputs[0].sha256.length, 64);
  assert.equal(manifest.compliance.profile, "Residential lease");
  assert.equal(manifest.template.name, "Harbour Editorial");
  assert.equal(manifest.language.typographyStyle, "editorial");
  assert.ok(manifest.language.fonts.some(font => font.includes("PingFang SC")));
  assert.equal(manifest.modules.propertyFacts.length, 5);
  assert.equal(manifest.modules.propertyFacts[4].visible, false);
  assert.equal(manifest.modules.propertyFacts[4].order, 4);
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
  const importedManifest = await Core.buildManifest(replacedImage, [output]);
  assert.equal(importedManifest.mlsImport.provider.board, "SYNTH-BOARD");
  assert.equal(importedManifest.mlsImport.fields["listing.price"].status, "user-overridden");
  assert.ok(importedManifest.mlsImport.images.every(image => image.dataUrl === undefined));
  assert.match(importedManifest.provenance, /authorized provider/);

  console.log("Browser core tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
