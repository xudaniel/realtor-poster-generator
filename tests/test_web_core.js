"use strict";

const assert = require("assert");
const Core = require("../web/core.js");

function project() {
  return {
    schemaVersion: 2,
    appVersion: Core.APP_VERSION,
    listing: {
      address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M5J 2N8",
      price: "$3,850", rentPeriod: "per month", mls: "C1234567", beds: "2", baths: "2", sqft: "815",
      floor: "26th", exposure: "South-East", parking: "1 Space", availability: "Immediately",
      headlineEn: "Lake views", headlineZh: "湖景生活",
    },
    contact: {name: "Daniel Xu", title: "Sales Representative", phone: "416-555-0198", email: "hello@example.com"},
    brand: {name: "Harbour Realty Group", tagline: "Move beautifully.", website: "example.com"},
    content: {featuresEn: "Windows\nTransit", featuresZh: "落地窗\n公共交通", amenitiesEn: "Gym", utilitiesEn: "Water", locationEn: "Waterfront"},
    language: {mode: "bilingual"}, theme: {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"}, focal: [.5, .5], preset: "poster",
    media: {
      heroDataUrl: "data:image/png;base64,AA==", heroName: "hero.png", heroType: "image/png", gallery: [],
      floorplanDataUrl: "", floorplanName: "", floorplanType: "", logoLightDataUrl: "", logoLightName: "", logoLightType: "",
      logoDarkDataUrl: "", logoDarkName: "", logoDarkType: "",
    },
    compliance: {profileId: "lease", profile: null, disclaimer: Core.COMPLIANCE_PROFILES.lease.disclaimer},
    template: {name: "Harbour Editorial", version: "1.0.0", lockedFields: ["brand.name"]},
    review: {status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null},
  };
}

(async () => {
  assert.equal(Core.APP_VERSION, "1.3.0");
  assert.equal(Core.PROJECT_SCHEMA_VERSION, 2);

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

  const output = {name: "poster.png", data: new Uint8Array([1, 2, 3, 4])};
  const manifest = await Core.buildManifest(project(), [output]);
  assert.equal(manifest.generator, "realtor-poster-studio 1.3.0");
  assert.equal(manifest.outputs[0].filename, "poster.png");
  assert.equal(manifest.outputs[0].sha256.length, 64);
  assert.equal(manifest.compliance.profile, "Residential lease");
  assert.equal(manifest.template.name, "Harbour Editorial");

  console.log("Browser core tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
