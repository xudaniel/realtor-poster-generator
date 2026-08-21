"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Core = require("../web/core.js");
const Mls = require("../web/mls.js");

function project() {
  return {
    schemaVersion: Core.PROJECT_SCHEMA_VERSION, appVersion: Core.APP_VERSION, projectId: "project-existing",
    listing: {address: "Manual Address", unit: "1", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M1A 1A1", price: "$1", rentPeriod: "per month", mls: "MANUAL1", beds: "1", baths: "1", sqft: "500", floor: "1st", exposure: "East", balcony: "None", parking: "1 space", availability: "Immediately", headlineEn: "Manual", headlineZh: ""},
    contact: {name: "Daniel Xu", title: "Sales Representative", license: "", phone: "416-555-0198", email: "hello@example.com", website: "example.com", portraitMode: "none", taglineEn: "", taglineZh: "", ctaTitleEn: "", ctaTitleZh: "", ctaBodyEn: "", ctaBodyZh: ""},
    brand: {name: "Daniel Xu Realty", tagline: "Move beautifully.", website: "example.com"},
    content: {featuresEn: "Manual", featuresZh: "", amenitiesEn: "", utilitiesEn: "", locationEn: ""},
    language: {mode: "english"}, typography: {style: "editorial"}, theme: {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"}, focal: [.5, .5], preset: "poster",
    media: {heroDataUrl: "", heroName: "", heroType: "", gallery: [], floorplans: [], portraitDataUrl: "", portraitName: "", portraitType: "", portraitFocal: [.5, .5], logoLightDataUrl: "", logoLightName: "", logoLightType: "", logoDarkDataUrl: "", logoDarkName: "", logoDarkType: ""},
    modules: {propertyFacts: [], spotlights: [], leaseDetails: [], includedCosts: [], tenantPaidCosts: [], amenities: [], applicationRequirements: []},
    compliance: {profileId: "lease", profile: null, disclaimer: Core.COMPLIANCE_PROFILES.lease.disclaimer, applicationRequirementsConfirmed: true, applicationDisclaimer: "Information only; verify requirements before applying."},
    template: {name: "Daniel Template", version: "1.0.0", lockedFields: []}, review: {status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null},
  };
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }

(async () => {
  assert.equal(Mls.PROTOCOL_VERSION, "1.0");
  assert.equal(Mls.validateConnectorUrl("https://connector.example.com/"), "https://connector.example.com");
  assert.equal(Mls.validateConnectorUrl("http://127.0.0.1:8787/api/"), "http://127.0.0.1:8787/api");
  assert.throws(() => Mls.validateConnectorUrl("http://connector.example.com"), error => error.code === "CONNECTOR_URL");
  assert.throws(() => Mls.validateConnectorUrl("https://user:secret@connector.example.com"), error => error.code === "CONNECTOR_URL");
  assert.throws(() => Mls.validateConnectorUrl("https://connector.example.com?token=secret"), error => error.code === "CONNECTOR_URL");

  const envelope = Mls.demoEnvelope(" demo1234 ", {now: "2026-08-20T20:30:00.000Z"});
  assert.equal(envelope.listing.mlsNumber, "DEMO1234");
  assert.equal(envelope.match.confirmed, true);
  assert.equal(envelope.provider.board, "Fictional Toronto Board");
  assert.ok(envelope.media.every(item => item.rights && item.rights.exportAllowed));
  assert.throws(() => Mls.demoEnvelope("C1234567"), error => error.code === "NOT_FOUND");

  const mismatch = clone(envelope); mismatch.match.keys.address = "Wrong address";
  assert.throws(() => Mls.validateEnvelope(mismatch, "DEMO1234"), error => error.code === "INVALID_RESPONSE");
  const ambiguous = clone(envelope); ambiguous.matchCount = 2;
  assert.throws(() => Mls.validateEnvelope(ambiguous, "DEMO1234"), error => error.code === "AMBIGUOUS");
  const duplicateMedia = clone(envelope); duplicateMedia.media[1].sourceId = duplicateMedia.media[0].sourceId; duplicateMedia.media[1].rights.sourceId = duplicateMedia.media[0].sourceId;
  assert.throws(() => Mls.validateEnvelope(duplicateMedia, "DEMO1234"), error => error.code === "INVALID_RESPONSE");
  const withdrawn = clone(envelope); withdrawn.listing.status = "EXPIRED"; withdrawn.match.keys.status = "EXPIRED";
  assert.throws(() => Mls.validateEnvelope(withdrawn, "DEMO1234"), error => error.code === "WITHDRAWN");

  const source = project();
  const mapped = Mls.mapEnvelopeToProject(envelope, source, Core);
  assert.equal(mapped.listing.address, "123 Recovery Lane");
  assert.equal(mapped.listing.mls, "DEMO1234");
  assert.equal(mapped.listing.headlineZh, "", "the importer must not invent a translation");
  assert.equal(mapped.contact.name, "Daniel Xu", "saved agent identity must be preserved");
  assert.equal(mapped.brand.name, "Daniel Xu Realty", "saved brand data must be preserved");
  assert.equal(mapped.template.name, "Daniel Template");
  assert.equal(mapped.review.status, "Draft");
  assert.match(mapped.media.heroDataUrl, /^data:image\/svg\+xml;base64,/);
  assert.equal(mapped.media.gallery.length, 2);
  assert.equal(mapped.media.floorplans.length, 1);
  assert.equal(mapped.mlsImport.provider.id, "demo-fixture");
  assert.ok(mapped.mlsImport.fieldSources["listing.price"]);
  assert.equal(mapped.mlsImport.fieldSources["listing.price"].providerBoard, "Fictional Toronto Board");
  assert.ok(mapped.mlsImport.fieldSources["modules.leaseDetails"]);
  assert.equal(mapped.modules.amenities.length, 3);
  assert.equal(mapped.modules.applicationRequirements.length, 3);
  assert.ok(mapped.mlsImport.fieldSources["modules.amenities"]);
  assert.equal(mapped.mlsImport.humanReviewedAt, "");
  assert.match(Mls.validateProjectImport(mapped).errors.join("\n"), /explicit human review/);

  const noPlanEnvelope = clone(envelope); noPlanEnvelope.media = noPlanEnvelope.media.filter(item => item.role !== "floorplan");
  const staleMediaProject = project(); staleMediaProject.media.floorplans = [{role: "technical2d", name: "old.png", type: "image/png", dataUrl: "data:image/png;base64,AA=="}]; staleMediaProject.media.floorplanName = "legacy-old.png"; staleMediaProject.media.floorplanDataUrl = "data:image/png;base64,AA==";
  const noPlanProject = Mls.mapEnvelopeToProject(noPlanEnvelope, staleMediaProject, Core);
  assert.deepEqual(noPlanProject.media.floorplans, [], "a missing source floor plan must not retain another listing's plan");
  assert.equal(noPlanProject.media.floorplanDataUrl, "");
  assert.ok(noPlanProject.mlsImport.missingFields.includes("media.floorplan"));

  Mls.reviewImport(mapped, true, "2026-08-20T21:00:00.000Z");
  assert.deepEqual(Mls.validateProjectImport(mapped).errors, []);
  mapped.listing.price = "$4,500";
  assert.equal(Mls.recordOverride(mapped, "listing.price", mapped.listing.price, "2026-08-20T21:05:00.000Z"), true);
  assert.equal(mapped.mlsImport.fieldSources["listing.price"].overrideValue, "$4,500");
  assert.equal(mapped.mlsImport.humanReviewedAt, "", "editing an imported fact must invalidate review");
  mapped.listing.price = envelope.listing.price;
  Mls.recordOverride(mapped, "listing.price", mapped.listing.price);
  assert.equal(mapped.mlsImport.fieldSources["listing.price"].overriddenAt, "");

  const restricted = clone(envelope);
  restricted.media.push({role: "interior", sourceId: "restricted-photo", name: "restricted.jpg", type: "image/jpeg", order: 9, width: 1200, height: 800, rights: {exportAllowed: false, basis: "No campaign licence", sourceId: "restricted-photo", confirmedAt: "2026-08-20T20:30:00.000Z"}});
  const restrictedProject = Mls.mapEnvelopeToProject(restricted, project(), Core);
  assert.equal(restrictedProject.mlsImport.blockedMedia.length, 1);
  assert.ok(!restrictedProject.media.gallery.some(item => item.sourceId === "restricted-photo"), "restricted media must not be silently used");
  assert.match(Mls.validateProjectImport(restrictedProject).errors.join("\n"), /rights review/);

  let request = null;
  const connector = new Mls.AuthorizedConnectorProvider("https://connector.example.com", {
    fetchImpl: async (url, options) => {
      request = {url, options};
      return {status: 200, ok: true, headers: {get: name => name.toLowerCase() === "content-type" ? "application/json; charset=utf-8" : ""}, text: async () => JSON.stringify(envelope)};
    },
  });
  const connected = await connector.resolve("DEMO1234");
  assert.equal(connected.listing.address, envelope.listing.address);
  assert.equal(request.url, "https://connector.example.com/v1/listings:resolve");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.credentials, "include");
  assert.equal(request.options.redirect, "error");
  assert.deepEqual(JSON.parse(request.options.body), {mlsNumber: "DEMO1234"});
  assert.ok(!Object.keys(request.options.headers).some(name => name.toLowerCase() === "authorization"));

  const unauthorized = new Mls.AuthorizedConnectorProvider("https://connector.example.com", {fetchImpl: async () => ({status: 403, ok: false})});
  await assert.rejects(() => unauthorized.resolve("DEMO1234"), error => error.code === "UNAUTHORIZED");
  const wrongType = new Mls.AuthorizedConnectorProvider("https://connector.example.com", {fetchImpl: async () => ({status: 200, ok: true, headers: {get: name => name === "content-type" ? "text/html" : ""}, text: async () => "{}"})});
  await assert.rejects(() => wrongType.resolve("DEMO1234"), error => error.code === "INVALID_RESPONSE");
  const oversized = new Mls.AuthorizedConnectorProvider("https://connector.example.com", {fetchImpl: async () => ({status: 200, ok: true, headers: {get: name => name === "content-length" ? String(Mls.MAX_RESPONSE_BYTES + 1) : "application/json"}, text: async () => "{}"})});
  await assert.rejects(() => oversized.resolve("DEMO1234"), error => error.code === "RESPONSE_TOO_LARGE");
  assert.match(Mls.providerMessage({code: "RATE_LIMITED"}), /请求限制/);

  const previousFields = Mls.sourceFields(envelope); const refreshedEnvelope = clone(envelope); refreshedEnvelope.listing.price = "$4,350";
  const changes = Mls.diffSourceFields(previousFields, Mls.sourceFields(refreshedEnvelope));
  assert.deepEqual(changes.map(change => change.path), ["listing.price"]);
  const refreshedMedia = clone(envelope); refreshedMedia.media[0].caption = "Updated provider caption";
  assert.deepEqual(Mls.diffMedia(mapped.mlsImport.media, refreshedMedia.media).map(change => change.path), ["media.demo-hero"]);

  const roundTrip = Core.projectFromListingData(Core.toListingData(mapped), project());
  assert.equal(roundTrip.mlsImport.provider.id, "demo-fixture");
  assert.equal(roundTrip.mlsImport.fieldSources["listing.price"].importedValue, envelope.listing.price);
  const manifest = await Core.buildManifest(mapped, []);
  assert.equal(manifest.source.type, "fictional-development-fixture");
  assert.equal(manifest.source.listingNumber, "DEMO1234");
  assert.match(manifest.provenance, /deterministically mapped/);

  const appSource = fs.readFileSync(path.join(__dirname, "../web/app.js"), "utf8");
  const mlsSource = fs.readFileSync(path.join(__dirname, "../web/mls.js"), "utf8");
  const htmlSource = fs.readFileSync(path.join(__dirname, "../web/index.html"), "utf8");
  assert.match(appSource, /before-mls-import/);
  assert.match(appSource, /before-mls-refresh/);
  assert.match(appSource, /window\.confirm/);
  assert.match(htmlSource, /id="generate-from-mls"/);
  assert.match(htmlSource, /src="mls\.js"/);
  assert.doesNotMatch(mlsSource, /localStorage|sessionStorage|Authorization\s*:/);

  console.log("Browser MLS connector tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
