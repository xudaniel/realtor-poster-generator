(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RealtorPosterCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const APP_VERSION = "1.4.1";
  const PROJECT_SCHEMA_VERSION = 5;
  const OUTPUT_DIMENSIONS = Object.freeze({
    poster: [1800, 2400], square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1200, 630],
  });
  const MODULE_ORDER = Object.freeze(["propertyFacts", "floorPlans", "spotlights", "leaseDetails", "includedCosts", "tenantPaidCosts", "amenities", "applicationRequirements", "agentProfile"]);
  const MODULE_LIMITS = {
    propertyFacts: 8,
    floorPlans: 2,
    spotlights: 3,
    leaseDetails: 9,
    includedCosts: 12,
    tenantPaidCosts: 12,
    amenities: 12,
    applicationRequirements: 10,
  };
  const PLAN_FITS = new Set(["contain", "fit-width", "crop"]);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+()\-. xX\d]+$/;
  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  const COMPLIANCE_PROFILES = {
    lease: {
      id: "lease",
      name: "Residential lease",
      version: "1.0.0",
      required: ["listing.address", "listing.price", "listing.mls", "listing.availability", "contact.name", "contact.title", "contact.phone", "contact.email", "brand.name"],
      disclaimer: "Information is deemed reliable but is not guaranteed. Verify listing facts, availability, brokerage disclosures, and local advertising requirements before publication.",
    },
    sale: {
      id: "sale",
      name: "Residential sale",
      version: "1.0.0",
      required: ["listing.address", "listing.price", "listing.mls", "contact.name", "contact.title", "contact.phone", "contact.email", "brand.name"],
      disclaimer: "Information is deemed reliable but is not guaranteed. Verify price, MLS® data, brokerage disclosures, and local advertising requirements before publication.",
    },
    open_house: {
      id: "open_house",
      name: "Open house",
      version: "1.0.0",
      required: ["listing.address", "listing.price", "listing.mls", "listing.availability", "contact.name", "contact.title", "contact.phone", "brand.name"],
      disclaimer: "Open-house details may change. Verify the date, time, access instructions, brokerage disclosures, and listing status before publication.",
    },
    just_listed: {
      id: "just_listed",
      name: "Just listed",
      version: "1.0.0",
      required: ["listing.address", "listing.price", "listing.mls", "contact.name", "contact.title", "contact.phone", "contact.email", "brand.name"],
      disclaimer: "Information is deemed reliable but is not guaranteed. Verify listing status, price, MLS® data, and required brokerage disclosures before publication.",
    },
  };

  const TYPOGRAPHY_PRESETS = {
    editorial: {
      style: "editorial",
      name: "Editorial",
      latin: "Arial, sans-serif",
      cjk: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
    },
    modern: {
      style: "modern",
      name: "Modern",
      latin: 'Inter, "Helvetica Neue", Arial, sans-serif',
      cjk: '"PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
      serif: 'Inter, "Helvetica Neue", Arial, sans-serif',
    },
    classic: {
      style: "classic",
      name: "Classic",
      latin: '"Helvetica Neue", Arial, sans-serif',
      cjk: '"Songti SC", SimSun, "Noto Serif CJK SC", serif',
      serif: 'Baskerville, Georgia, "Times New Roman", serif',
    },
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function isObject(value) { return value && typeof value === "object" && !Array.isArray(value); }
  function getPath(object, path) {
    return String(path).split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  }
  function setPath(object, path, value) {
    const keys = String(path).split("."); let target = object;
    keys.slice(0, -1).forEach(key => { if (!isObject(target[key])) target[key] = {}; target = target[key]; });
    target[keys[keys.length - 1]] = value;
    return object;
  }
  function deepMerge(base, incoming) {
    const output = clone(base);
    Object.entries(incoming || {}).forEach(([key, value]) => {
      output[key] = isObject(value) && isObject(output[key]) ? deepMerge(output[key], value) : clone(value);
    });
    return output;
  }
  function list(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value || "").split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  }
  function populated(value) { return value != null && String(value).trim() !== ""; }
  const MLS_SCALAR_MAPPING = Object.freeze([
    ["status", "listing.status"], ["address", "listing.address"], ["unit", "listing.unit"],
    ["city", "listing.city"], ["postalCode", "listing.postalCode"], ["price", "listing.price"],
    ["rentPeriod", "listing.rentPeriod"], ["listingNumber", "listing.mls"], ["beds", "listing.beds"],
    ["baths", "listing.baths"], ["sqft", "listing.sqft"], ["floor", "listing.floor"],
    ["exposure", "listing.exposure"], ["balcony", "listing.balcony"], ["parking", "listing.parking"],
    ["availability", "listing.availability"], ["openHouse", "listing.openHouse"],
    ["descriptionEn", "listing.descriptionEn"], ["descriptionZh", "listing.descriptionZh"],
    ["headlineEn", "listing.headlineEn"], ["headlineZh", "listing.headlineZh"],
    ["featuresEn", "content.featuresEn"], ["featuresZh", "content.featuresZh"],
  ]);
  const MLS_MODULE_MAPPING = Object.freeze([
    ["propertyFacts", "modules.propertyFacts"], ["spotlights", "modules.spotlights"],
    ["leaseDetails", "modules.leaseDetails"], ["includedCosts", "modules.includedCosts"],
    ["tenantPaidCosts", "modules.tenantPaidCosts"], ["amenities", "modules.amenities"],
    ["applicationRequirements", "modules.applicationRequirements"],
  ]);
  const MLS_REQUIRED_TARGETS = Object.freeze([
    "listing.status", "listing.address", "listing.price", "listing.mls", "listing.beds",
    "listing.baths", "listing.sqft", "listing.floor", "listing.exposure", "listing.parking", "listing.availability",
  ]);
  const INACTIVE_MLS_STATUSES = new Set(["EXPIRED", "WITHDRAWN", "SUSPENDED", "TERMINATED", "CANCELLED", "CANCELED", "CLOSED", "SOLD", "LEASED", "OFF_MARKET", "INACTIVE"]);

  function mlsFailure(code, message) {
    const error = new Error(message || code); error.code = code; return error;
  }
  function sameIdentityValue(left, right) { return String(left == null ? "" : left).trim().toUpperCase() === String(right == null ? "" : right).trim().toUpperCase(); }
  function sanitizeMlsValue(value, key = "") {
    if (/secret|token|credential|password|api[-_]?key/i.test(key)) return undefined;
    if (Array.isArray(value)) return value.map(item => sanitizeMlsValue(item)).filter(item => item !== undefined);
    if (isObject(value)) return Object.entries(value).reduce((output, [childKey, child]) => {
      const safe = sanitizeMlsValue(child, childKey); if (safe !== undefined) output[childKey] = safe; return output;
    }, {});
    return value;
  }
  function normalizedMlsFieldValue(sourceKey, value) {
    if (sourceKey === "featuresEn" || sourceKey === "featuresZh") return list(value).join("\n");
    if (sourceKey === "openHouse" && isObject(value)) return canonicalStringify(value);
    return value == null ? "" : value;
  }
  function imageRightsBlocked(image) {
    return image && !image.replaced && !image.confirmed && image.reuseAllowed !== true;
  }
  function mlsCompleteness(project) {
    const imported = getPath(project, "mlsImport") || {}; const fields = Object.values(imported.fields || {});
    return {
      imported: fields.filter(field => field.status === "imported").length,
      missing: fields.filter(field => field.status === "missing").length,
      stale: fields.filter(field => field.status === "stale").length + (imported.stale ? 1 : 0),
      overridden: fields.filter(field => field.status === "user-overridden").length,
      blocked: (imported.images || []).filter(imageRightsBlocked).length,
    };
  }
  function buildMlsImportPlan(project, rawResponse, request = {}) {
    const response = sanitizeMlsValue(rawResponse || {});
    if (response.error && response.error.code) throw mlsFailure(response.error.code, response.error.message);
    const matches = Array.isArray(response.matches) ? response.matches : [];
    if (!matches.length) throw mlsFailure("MLS_NOT_FOUND", "No permitted listing matched this provider, board, and MLS number.");
    if (matches.length !== 1) throw mlsFailure("MLS_AMBIGUOUS", "More than one listing matched; import is blocked.");
    const listing = matches[0] || {}; const provider = response.provider || {};
    const providerId = listing.providerId || provider.id || ""; const board = listing.board || provider.board || "";
    const listingNumber = listing.listingNumber || listing.mls || "";
    if (!populated(providerId) || !populated(board) || !populated(listingNumber) || !populated(listing.status) || !populated(listing.address) || !Object.prototype.hasOwnProperty.call(listing, "unit")) {
      throw mlsFailure("MLS_INCOMPLETE_IDENTITY", "Provider, board, listing number, status, address, and unit context are required.");
    }
    if (request.providerId && !sameIdentityValue(request.providerId, providerId)) throw mlsFailure("MLS_PROVIDER_MISMATCH", "The response provider does not match the connected provider.");
    if (request.board && !sameIdentityValue(request.board, board)) throw mlsFailure("MLS_BOARD_MISMATCH", "The response board does not match the connected board.");
    if (request.listingNumber && !sameIdentityValue(request.listingNumber, listingNumber)) throw mlsFailure("MLS_NUMBER_MISMATCH", "The returned listing number does not exactly match the request.");
    const normalizedStatusValue = normalizedStatus(listing.status);
    if (INACTIVE_MLS_STATUSES.has(normalizedStatusValue)) throw mlsFailure(`MLS_${normalizedStatusValue}`, `Listing status ${listing.status} cannot be imported for publication.`);
    const retrievedAt = response.retrievedAt || new Date().toISOString(); const sourceUpdatedAt = listing.sourceUpdatedAt || response.sourceUpdatedAt || "";
    const sourceAge = sourceUpdatedAt ? Date.now() - new Date(sourceUpdatedAt).getTime() : 0;
    const stale = response.stale === true || (Number.isFinite(sourceAge) && sourceAge > 24 * 60 * 60 * 1000);
    const fields = {}; const candidate = {};
    [...MLS_SCALAR_MAPPING, ...MLS_MODULE_MAPPING].forEach(([sourceKey, targetPath]) => {
      const hasValue = Object.prototype.hasOwnProperty.call(listing, sourceKey);
      const value = normalizedMlsFieldValue(sourceKey, hasValue ? listing[sourceKey] : "");
      const missing = !hasValue || (Array.isArray(value) ? !value.length : !populated(value));
      fields[targetPath] = {
        status: missing ? "missing" : (stale ? "stale" : "imported"), originalValue: missing ? null : clone(value),
        currentValue: missing ? null : clone(value), providerId, board, listingNumber, retrievedAt, sourceUpdatedAt,
      };
      if (!missing) candidate[targetPath] = clone(value);
    });
    const previous = getPath(project, "mlsImport") || {}; const changes = [];
    Object.entries(fields).forEach(([path, field]) => {
      const prior = previous.fields && previous.fields[path];
      if (prior && canonicalStringify(prior.originalValue) !== canonicalStringify(field.originalValue)) changes.push({path, before: prior.originalValue, after: field.originalValue});
    });
    const images = (Array.isArray(listing.images) ? listing.images : []).map((image, index) => ({
      sourceId: String(image.sourceId || `image-${index + 1}`), role: image.role || (index ? "gallery" : "hero"), order: Number(image.order == null ? index : image.order),
      caption: image.caption || "", pixelWidth: Number(image.pixelWidth || 0), pixelHeight: Number(image.pixelHeight || 0),
      rightsStatus: image.rightsStatus || (image.reuseAllowed === true ? "permitted" : "unknown"), reuseAllowed: image.reuseAllowed === true,
      confirmed: false, replaced: false, name: image.name || `${image.sourceId || `image-${index + 1}`}.jpg`, type: image.type || "image/jpeg",
      dataUrl: typeof image.dataUrl === "string" && image.dataUrl.startsWith("data:image/") ? image.dataUrl : "",
    })).sort((left, right) => left.order - right.order);
    const sameListing = previous.active && sameIdentityValue(previous.provider && previous.provider.id, providerId) && sameIdentityValue(previous.provider && previous.provider.board, board) && sameIdentityValue(previous.listingNumber, listingNumber);
    return {
      provider: {id: providerId, name: provider.name || providerId, board}, listingNumber, retrievedAt, sourceUpdatedAt,
      exactMatch: true, stale, status: listing.status, fields, candidate, images,
      missing: MLS_REQUIRED_TARGETS.filter(path => !populated(candidate[path])), blocked: images.filter(imageRightsBlocked).map(image => image.sourceId),
      refresh: {sameListing: Boolean(sameListing), changes, requiresConfirmation: Boolean(sameListing && changes.length)},
    };
  }
  function applyMlsImage(project, image) {
    if (!image.dataUrl || image.reuseAllowed !== true) return;
    if (image.role === "hero") {
      project.media.heroDataUrl = image.dataUrl; project.media.heroName = image.name; project.media.heroType = image.type;
    } else if (image.role === "floorplan" || image.role === "furnished3d" || image.role === "technical2d") {
      const role = image.role === "floorplan" ? "technical2d" : image.role; const plans = project.media.floorplans || [];
      const index = Math.max(0, plans.findIndex(plan => plan.role === role)); const base = plans[index] || {fit: "contain", focal: [.5, .5], captionEn: "", captionZh: "", noteEn: "", noteZh: ""};
      plans[index] = {...base, role, name: image.name, type: image.type, dataUrl: image.dataUrl, pixelWidth: image.pixelWidth, pixelHeight: image.pixelHeight}; project.media.floorplans = plans.slice(0, MODULE_LIMITS.floorPlans);
    } else if ((project.media.gallery || []).length < 4) project.media.gallery.push({name: image.name, type: image.type, dataUrl: image.dataUrl});
  }
  function applyMlsImport(project, plan, options = {}) {
    const output = clone(project); const previousFields = getPath(output, "mlsImport.fields") || {}; const nextFields = clone(plan.fields);
    Object.entries(plan.candidate || {}).forEach(([path, value]) => {
      if (previousFields[path] && previousFields[path].status === "user-overridden" && options.overwriteUserOverrides !== true) {
        nextFields[path] = {...nextFields[path], status: "user-overridden", currentValue: clone(getPath(output, path)), overriddenAt: previousFields[path].overriddenAt || ""}; return;
      }
      setPath(output, path, clone(value));
    });
    if (options.overwriteLocalImages === true || !(output.media.heroDataUrl || (output.media.gallery || []).length || activeFloorPlans(output).length)) {
      (plan.images || []).forEach(image => applyMlsImage(output, image));
    }
    output.mlsImport = {
      active: true, provider: clone(plan.provider), listingNumber: plan.listingNumber, retrievedAt: plan.retrievedAt,
      sourceUpdatedAt: plan.sourceUpdatedAt, exactMatch: true, stale: Boolean(plan.stale), status: plan.status,
      fields: nextFields, images: clone(plan.images), missing: clone(plan.missing), blocked: clone(plan.blocked),
      reviewConfirmed: false, reviewedAt: "", refresh: clone(plan.refresh),
    };
    return output;
  }
  function recordMlsOverride(project, path, value) {
    const field = getPath(project, "mlsImport.fields") && project.mlsImport.fields[path]; if (!getPath(project, "mlsImport.active") || !field) return project;
    field.currentValue = clone(value); field.status = canonicalStringify(value) === canonicalStringify(field.originalValue) ? (project.mlsImport.stale ? "stale" : "imported") : "user-overridden";
    if (field.status === "user-overridden") field.overriddenAt = new Date().toISOString(); else delete field.overriddenAt;
    project.mlsImport.reviewConfirmed = false; project.mlsImport.reviewedAt = "";
    return project;
  }
  function confirmMlsImageRights(project, sourceId) {
    const output = clone(project); const image = (getPath(output, "mlsImport.images") || []).find(item => item.sourceId === sourceId);
    if (!image) throw mlsFailure("MLS_IMAGE_NOT_FOUND", "Imported image was not found.");
    if (image.rightsStatus === "denied") throw mlsFailure("MLS_IMAGE_RIGHTS_DENIED", "Provider rights explicitly prohibit reuse; choose a local replacement.");
    image.confirmed = true; image.reuseAllowed = true; image.rightsStatus = "user-confirmed"; applyMlsImage(output, image);
    output.mlsImport.blocked = output.mlsImport.images.filter(imageRightsBlocked).map(item => item.sourceId); output.mlsImport.reviewConfirmed = false;
    return output;
  }
  function resolveMlsImageWithReplacement(project, sourceId) {
    const output = clone(project); const image = (getPath(output, "mlsImport.images") || []).find(item => item.sourceId === sourceId);
    if (!image) throw mlsFailure("MLS_IMAGE_NOT_FOUND", "Imported image was not found.");
    const importedData = new Set((output.mlsImport.images || []).map(item => item.dataUrl).filter(Boolean));
    const isLocal = dataUrl => populated(dataUrl) && !importedData.has(dataUrl);
    let replacementAvailable = false;
    if (image.role === "hero") replacementAvailable = isLocal(getPath(output, "media.heroDataUrl"));
    else if (image.role === "floorplan" || image.role === "furnished3d" || image.role === "technical2d") {
      replacementAvailable = (getPath(output, "media.floorplans") || []).some(plan => isLocal(plan.dataUrl));
    } else replacementAvailable = (getPath(output, "media.gallery") || []).some(item => isLocal(item.dataUrl));
    if (!replacementAvailable) throw mlsFailure("MLS_IMAGE_REPLACEMENT_REQUIRED", "Upload a local replacement for this image role before marking it replaced.");
    image.replaced = true; image.dataUrl = ""; output.mlsImport.blocked = output.mlsImport.images.filter(imageRightsBlocked).map(item => item.sourceId); output.mlsImport.reviewConfirmed = false;
    return output;
  }
  function moduleItems(project, name) {
    const items = getPath(project, `modules.${name}`);
    return Array.isArray(items) ? items : [];
  }
  function allPropertyFacts(project) {
    return moduleItems(project, "propertyFacts").map((fact, order) => {
      const value = fact.source ? getPath(project, fact.source) : fact.value;
      return {...clone(fact), value: value == null ? "" : String(value), order};
    });
  }
  function resolvedPropertyFacts(project, preset = "poster") {
    const facts = allPropertyFacts(project).filter(fact => fact.visible !== false && populated(fact.value));
    if (preset === "poster") return facts.slice(0, MODULE_LIMITS.propertyFacts);
    return facts.slice().sort((left, right) => Number(left.priority || 99) - Number(right.priority || 99) || left.order - right.order)
      .slice(0, 4).sort((left, right) => left.order - right.order);
  }
  function activeFloorPlans(project) {
    const plans = getPath(project, "media.floorplans");
    return (Array.isArray(plans) ? plans : []).filter(plan => populated(plan.dataUrl) || populated(plan.name)).slice(0, MODULE_LIMITS.floorPlans);
  }
  function activeSpotlights(project) {
    return moduleItems(project, "spotlights").filter(item => item.visible !== false && (populated(item.dataUrl) || populated(item.titleEn) || populated(item.titleZh))).slice(0, MODULE_LIMITS.spotlights);
  }
  function activeLeaseDetails(project) {
    if (profileForStatus(getPath(project, "listing.status")) !== "lease") return [];
    return moduleItems(project, "leaseDetails").filter(item => item.state === "active" && (populated(item.valueEn) || populated(item.valueZh))).slice(0, MODULE_LIMITS.leaseDetails);
  }
  function activeIncludedCosts(project) {
    if (profileForStatus(getPath(project, "listing.status")) !== "lease") return [];
    return moduleItems(project, "includedCosts").filter(item => item.state !== "hidden" && (populated(item.labelEn) || populated(item.labelZh))).slice(0, MODULE_LIMITS.includedCosts);
  }
  function activeTenantPaidCosts(project) {
    if (profileForStatus(getPath(project, "listing.status")) !== "lease") return [];
    return moduleItems(project, "tenantPaidCosts").filter(item => item.state !== "hidden" && (populated(item.labelEn) || populated(item.labelZh))).slice(0, MODULE_LIMITS.tenantPaidCosts);
  }
  function activeAmenities(project) {
    return moduleItems(project, "amenities").filter(item => item.state !== "hidden" && (populated(item.labelEn) || populated(item.labelZh))).slice(0, MODULE_LIMITS.amenities);
  }
  function activeApplicationRequirements(project) {
    if (profileForStatus(getPath(project, "listing.status")) !== "lease") return [];
    return moduleItems(project, "applicationRequirements").filter(item => item.state !== "hidden" && (populated(item.labelEn) || populated(item.labelZh))).slice(0, MODULE_LIMITS.applicationRequirements);
  }
  function layoutSnapshot(project, requestedPreset) {
    const preset = OUTPUT_DIMENSIONS[requestedPreset] ? requestedPreset : (OUTPUT_DIMENSIONS[project.preset] ? project.preset : "poster");
    const [width, height] = OUTPUT_DIMENSIONS[preset];
    const isPoster = preset === "poster"; const showsResponsibilities = preset === "portrait" || preset === "story";
    const counts = {
      propertyFacts: resolvedPropertyFacts(project, preset).length,
      floorPlans: isPoster ? activeFloorPlans(project).length : 0,
      spotlights: isPoster ? activeSpotlights(project).length : 0,
      leaseDetails: isPoster ? activeLeaseDetails(project).length : 0,
      includedCosts: isPoster ? activeIncludedCosts(project).length : (showsResponsibilities ? activeIncludedCosts(project).slice(0, 2).length : 0),
      tenantPaidCosts: isPoster ? activeTenantPaidCosts(project).length : (showsResponsibilities ? activeTenantPaidCosts(project).slice(0, 2).length : 0),
      amenities: isPoster ? activeAmenities(project).length : 0,
      applicationRequirements: isPoster ? activeApplicationRequirements(project).length : 0,
      agentProfile: 1,
    };
    return {
      preset, width, height, language: getPath(project, "language.mode") || "english",
      portraitMode: getPath(project, "contact.portraitMode") || "none",
      moduleOrder: MODULE_ORDER.filter(name => counts[name] > 0), counts,
    };
  }
  function normalizedCostId(item) {
    return String(item.id || item.labelEn || item.labelZh || "").toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "");
  }
  function costConflicts(project) {
    const included = new Map(activeIncludedCosts(project).map(item => [normalizedCostId(item), item]));
    return activeTenantPaidCosts(project).filter(item => included.has(normalizedCostId(item)))
      .map(item => item.labelEn || item.labelZh || item.id);
  }
  function normalizedStatus(status) {
    return String(status || "").toUpperCase().replace(/\s+/g, "_");
  }
  function profileForStatus(status) {
    const key = normalizedStatus(status);
    if (key.includes("SALE")) return "sale";
    if (key.includes("OPEN_HOUSE")) return "open_house";
    if (key.includes("JUST_LISTED")) return "just_listed";
    return "lease";
  }
  function activeComplianceProfile(project) {
    const custom = project.compliance && project.compliance.profile;
    if (custom && custom.id && Array.isArray(custom.required)) return custom;
    const id = project.compliance && project.compliance.profileId || profileForStatus(getPath(project, "listing.status"));
    return clone(COMPLIANCE_PROFILES[id] || COMPLIANCE_PROFILES.lease);
  }
  function activeTypography(project) {
    const selected = getPath(project, "typography.style") || "editorial";
    const base = TYPOGRAPHY_PRESETS[selected] || TYPOGRAPHY_PRESETS.editorial;
    return deepMerge(base, project.typography || {});
  }

  function buildTemplate(project) {
    return {
      kind: "realtor-poster-template",
      schemaVersion: 1,
      name: project.template.name,
      version: project.template.version,
      brand: clone(project.brand),
      contact: clone(project.contact),
      theme: clone(project.theme),
      typography: activeTypography(project),
      layout: {
        defaultPreset: project.preset,
        moduleOrder: [...MODULE_ORDER],
      },
      lockedFields: clone(project.template.lockedFields || []),
      logoLightDataUrl: getPath(project, "media.logoLightDataUrl") || "",
      logoLightName: getPath(project, "media.logoLightName") || "",
      logoLightType: getPath(project, "media.logoLightType") || "",
      logoDarkDataUrl: getPath(project, "media.logoDarkDataUrl") || "",
      logoDarkName: getPath(project, "media.logoDarkName") || "",
      logoDarkType: getPath(project, "media.logoDarkType") || "",
    };
  }
  function applyTemplate(project, template) {
    if (!template || template.kind !== "realtor-poster-template") throw new Error("Not a Realtor Poster template");
    if (Number(template.schemaVersion || 1) !== 1) throw new Error(`Unsupported template schema version: ${template.schemaVersion}`);
    const output = clone(project);
    output.brand = deepMerge(output.brand || {}, template.brand || {});
    output.contact = deepMerge(output.contact || {}, template.contact || {});
    output.theme = deepMerge(output.theme || {}, template.theme || {});
    output.typography = deepMerge(activeTypography(output), template.typography || {});
    if (template.layout && template.layout.defaultPreset) output.preset = template.layout.defaultPreset;
    output.template = {
      name: template.name || "Imported template",
      version: template.version || "1.0.0",
      lockedFields: Array.isArray(template.lockedFields) ? clone(template.lockedFields) : [],
    };
    output.media.logoLightDataUrl = template.logoLightDataUrl || "";
    output.media.logoLightName = template.logoLightName || "";
    output.media.logoLightType = template.logoLightType || "";
    output.media.logoDarkDataUrl = template.logoDarkDataUrl || "";
    output.media.logoDarkName = template.logoDarkName || "";
    output.media.logoDarkType = template.logoDarkType || "";
    return output;
  }
  function duplicateTemplate(project) {
    const output = clone(project);
    output.template.name = `${String(output.template.name || "Template").trim()} Copy`;
    return output;
  }
  function campaignCopy(project) {
    return {
      shared: {
        address: project.listing.address,
        price: project.listing.price,
        rentPeriod: project.listing.rentPeriod,
        mls: project.listing.mls,
        beds: project.listing.beds,
        baths: project.listing.baths,
        sqft: project.listing.sqft,
        contact: clone(project.contact),
      },
      english: {headline: project.listing.headlineEn, features: list(project.content.featuresEn)},
      chinese: {headline: project.listing.headlineZh, features: list(project.content.featuresZh)},
    };
  }
  function buildApprovalRecord(project, changes) {
    return {
      status: project.review.status,
      reviewer: project.review.reviewer,
      reviewedAt: project.review.reviewedAt,
      notes: project.review.notes,
      changes: clone(changes || []),
      mlsImport: getPath(project, "mlsImport.active") ? sanitizeMlsValue({
        provider: project.mlsImport.provider, listingNumber: project.mlsImport.listingNumber,
        retrievedAt: project.mlsImport.retrievedAt, reviewedAt: project.mlsImport.reviewedAt,
        completeness: mlsCompleteness(project),
      }) : null,
      statement: "Internal workflow record only; not an electronic signature or legal, regulatory, MLS, or brokerage approval.",
    };
  }

  function validateProject(project) {
    const errors = []; const warnings = [];
    const required = [
      "listing.address", "listing.price", "listing.mls", "listing.beds", "listing.baths",
      "listing.sqft", "listing.floor", "listing.exposure", "listing.parking", "listing.availability",
      "contact.name", "contact.phone", "contact.email", "brand.name", "media.heroDataUrl",
    ];
    required.forEach(path => {
      const value = getPath(project, path);
      if (value == null || String(value).trim() === "") errors.push(`Missing required field: ${path}`);
    });

    const email = String(getPath(project, "contact.email") || "");
    if (email && !EMAIL_RE.test(email)) errors.push(`Invalid contact.email: ${email}`);
    const phone = String(getPath(project, "contact.phone") || "");
    const digits = phone.replace(/\D/g, "");
    if (phone && (!PHONE_RE.test(phone) || digits.length < 10 || digits.length > 15)) {
      errors.push("Invalid contact.phone: use 10-15 digits with normal phone punctuation");
    }
    ["beds", "baths"].forEach(name => {
      const value = Number(getPath(project, `listing.${name}`));
      if (!Number.isFinite(value) || value <= 0) errors.push(`listing.${name} must be a positive number`);
    });
    const sqft = String(getPath(project, "listing.sqft") || "").trim();
    const singleArea = Number(sqft) > 0;
    const range = sqft.match(/^(\d{2,5})\s*-\s*(\d{2,5})$/);
    if (!singleArea && !(range && Number(range[1]) <= Number(range[2]))) {
      errors.push("listing.sqft must be a positive number or a range such as 600-699");
    }
    ["accent", "ink", "paper"].forEach(name => {
      if (!HEX_RE.test(String(getPath(project, `theme.${name}`) || ""))) errors.push(`theme.${name} must be a six-digit hex color`);
    });
    const focal = project.focal;
    if (!Array.isArray(focal) || focal.length !== 2 || focal.some(value => typeof value !== "number" || value < 0 || value > 1)) {
      errors.push("focal must be [x, y] with values between 0 and 1");
    }
    const gallery = getPath(project, "media.gallery") || [];
    if (!Array.isArray(gallery)) errors.push("media.gallery must be a list");
    else if (gallery.length > 4) errors.push("media.gallery supports at most 4 images");

    const facts = moduleItems(project, "propertyFacts");
    if (facts.length > MODULE_LIMITS.propertyFacts) errors.push(`modules.propertyFacts supports at most ${MODULE_LIMITS.propertyFacts} facts`);
    const visibleFacts = resolvedPropertyFacts(project, "poster");
    if (visibleFacts.length > 0 && visibleFacts.length < 3) warnings.push("The property-facts ribbon is most readable with at least 3 populated facts");
    facts.forEach((fact, index) => {
      if (!populated(fact.labelEn)) warnings.push(`Property fact ${index + 1} is missing an English label`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(fact.labelZh)) warnings.push(`Property fact ${index + 1} is missing a Chinese label`);
    });

    const floorplans = getPath(project, "media.floorplans");
    if (!Array.isArray(floorplans)) errors.push("media.floorplans must be a list");
    else {
      if (floorplans.length > MODULE_LIMITS.floorPlans) errors.push(`media.floorplans supports at most ${MODULE_LIMITS.floorPlans} plans`);
      floorplans.forEach((plan, index) => {
        if (!PLAN_FITS.has(plan.fit || "contain")) errors.push(`media.floorplans.${index}.fit must be contain, fit-width, or crop`);
        if (!Array.isArray(plan.focal) || plan.focal.length !== 2 || plan.focal.some(value => typeof value !== "number" || value < 0 || value > 1)) errors.push(`media.floorplans.${index}.focal must be [x, y] between 0 and 1`);
        if ((plan.dataUrl || plan.name) && Number(plan.pixelWidth || 0) > 0 && Number(plan.pixelHeight || 0) > 0) {
          const minimum = project.preset === "poster" ? 700 : 420;
          if (Number(plan.pixelWidth) < minimum || Number(plan.pixelHeight) < minimum) warnings.push(`${plan.name || `Floor plan ${index + 1}`} may be too low-resolution for ${project.preset} output`);
        }
        if (plan.name && !plan.dataUrl) warnings.push(`${plan.name} must be reselected before its floor-plan image can be exported`);
      });
    }

    const spotlights = moduleItems(project, "spotlights");
    if (spotlights.length > MODULE_LIMITS.spotlights) errors.push(`modules.spotlights supports at most ${MODULE_LIMITS.spotlights} callouts`);
    spotlights.filter(item => item.visible !== false).forEach((item, index) => {
      if (!populated(item.titleEn)) warnings.push(`Feature spotlight ${index + 1} is missing an English title`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.titleZh)) warnings.push(`Feature spotlight ${index + 1} is missing a Chinese title`);
      if (!Array.isArray(item.focal) || item.focal.length !== 2 || item.focal.some(value => typeof value !== "number" || value < 0 || value > 1)) errors.push(`modules.spotlights.${index}.focal must be [x, y] between 0 and 1`);
      if (!["circle", "rounded", "rectangle"].includes(item.mask || "circle")) errors.push(`modules.spotlights.${index}.mask is unsupported`);
      if (!item.dataUrl) warnings.push(`Feature spotlight ${index + 1} needs a local image before it can appear in artwork`);
    });

    if (profileForStatus(getPath(project, "listing.status")) === "lease") {
      const leaseDetails = moduleItems(project, "leaseDetails");
      if (leaseDetails.length > MODULE_LIMITS.leaseDetails) errors.push(`modules.leaseDetails supports at most ${MODULE_LIMITS.leaseDetails} rows`);
      ["term", "availability"].forEach(id => {
        const detail = leaseDetails.find(item => item.id === id);
        if (!detail || detail.state !== "active" || (!populated(detail.valueEn) && !populated(detail.valueZh))) warnings.push(`Lease profile recommends a completed ${id} detail`);
      });
      activeLeaseDetails(project).forEach((item, index) => {
        if (!populated(item.valueEn)) warnings.push(`Lease detail ${index + 1} is missing English wording`);
        if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.valueZh)) warnings.push(`Lease detail ${index + 1} is missing Chinese wording`);
        if (`${item.labelEn || ""}: ${item.valueEn || ""}`.length > 120) errors.push(`Lease detail ${index + 1} English wording must be 120 characters or fewer`);
        if (`${item.labelZh || ""}：${item.valueZh || ""}`.length > 120) errors.push(`Lease detail ${index + 1} Chinese wording must be 120 characters or fewer`);
      });
    }

    const includedCosts = moduleItems(project, "includedCosts");
    if (includedCosts.length > MODULE_LIMITS.includedCosts) errors.push(`modules.includedCosts supports at most ${MODULE_LIMITS.includedCosts} items`);
    activeIncludedCosts(project).forEach((item, index) => {
      if (!populated(item.labelEn)) warnings.push(`Included cost ${index + 1} is missing an English label`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.labelZh)) warnings.push(`Included cost ${index + 1} is missing a Chinese label`);
    });
    const tenantPaidCosts = moduleItems(project, "tenantPaidCosts");
    if (tenantPaidCosts.length > MODULE_LIMITS.tenantPaidCosts) errors.push(`modules.tenantPaidCosts supports at most ${MODULE_LIMITS.tenantPaidCosts} items`);
    activeTenantPaidCosts(project).forEach((item, index) => {
      if (!populated(item.labelEn)) warnings.push(`Tenant-paid cost ${index + 1} is missing an English label`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.labelZh)) warnings.push(`Tenant-paid cost ${index + 1} is missing a Chinese label`);
    });
    costConflicts(project).forEach(label => errors.push(`${label} appears in both included and tenant-paid costs`));

    const amenities = moduleItems(project, "amenities");
    if (amenities.length > MODULE_LIMITS.amenities) errors.push(`modules.amenities supports at most ${MODULE_LIMITS.amenities} items`);
    activeAmenities(project).forEach((item, index) => {
      if (!populated(item.labelEn)) warnings.push(`Amenity ${index + 1} is missing an English label`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.labelZh)) warnings.push(`Amenity ${index + 1} is missing a Chinese label`);
    });

    const applicationRequirements = moduleItems(project, "applicationRequirements");
    if (applicationRequirements.length > MODULE_LIMITS.applicationRequirements) errors.push(`modules.applicationRequirements supports at most ${MODULE_LIMITS.applicationRequirements} items`);
    activeApplicationRequirements(project).forEach((item, index) => {
      if (!populated(item.labelEn)) warnings.push(`Application requirement ${index + 1} is missing English wording`);
      if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && !populated(item.labelZh)) warnings.push(`Application requirement ${index + 1} is missing Chinese wording`);
    });
    if (activeApplicationRequirements(project).length) {
      if (!getPath(project, "compliance.applicationRequirementsConfirmed")) errors.push("Application requirements require compliance-profile confirmation before export");
      if (!populated(getPath(project, "compliance.applicationDisclaimer"))) errors.push("Application requirements require an informational disclaimer");
    }

    const portraitMode = String(getPath(project, "contact.portraitMode") || "none");
    if (!["photo", "illustrated", "initials", "none"].includes(portraitMode)) errors.push(`Unsupported contact.portraitMode: ${portraitMode}`);
    if ((portraitMode === "photo" || portraitMode === "illustrated") && !populated(getPath(project, "media.portraitDataUrl"))) {
      warnings.push(`${portraitMode === "photo" ? "Photo" : "Illustrated avatar"} mode needs a local portrait before it can appear in artwork`);
    }
    if (getPath(project, "media.portraitName") && !getPath(project, "media.portraitDataUrl")) warnings.push(`${getPath(project, "media.portraitName")} must be reselected before the agent portrait can be exported`);
    if ((getPath(project, "language.mode") === "chinese" || getPath(project, "language.mode") === "bilingual") && populated(getPath(project, "contact.ctaTitleEn")) && !populated(getPath(project, "contact.ctaTitleZh"))) {
      warnings.push("Agent call-to-action is missing a Chinese title");
    }

    const profile = activeComplianceProfile(project);
    const expectedProfileId = profileForStatus(getPath(project, "listing.status"));
    if (!getPath(project, "compliance.profile") && profile.id !== expectedProfileId) {
      errors.push(`${profile.name} does not match listing.status ${getPath(project, "listing.status")}`);
    }
    profile.required.forEach(path => {
      const value = getPath(project, path);
      if (value == null || String(value).trim() === "") errors.push(`${profile.name} requires ${path}`);
    });
    if (!String(getPath(project, "compliance.disclaimer") || "").trim()) {
      errors.push(`${profile.name} requires disclaimer text`);
    }
    const typographyStyle = String(getPath(project, "typography.style") || "editorial");
    if (!TYPOGRAPHY_PRESETS[typographyStyle]) errors.push(`Unsupported typography.style: ${typographyStyle}`);

    const mode = getPath(project, "language.mode") || "english";
    if ((mode === "chinese" || mode === "bilingual") && !String(getPath(project, "listing.headlineZh") || "").trim()) {
      warnings.push("Chinese headline is missing; the English headline will be used as a fallback");
    }
    if ((mode === "chinese" || mode === "bilingual") && !list(getPath(project, "content.featuresZh")).length) {
      warnings.push("Chinese features are missing; English features will be used as a fallback");
    }
    if (!String(getPath(project, "brand.website") || "").trim()) warnings.push("Brand website is blank");
    if (!activeFloorPlans(project).length) warnings.push("No floor plan selected");
    if (!gallery.length) warnings.push("No interior photos selected");
    if (getPath(project, "review.status") === "Approved") {
      if (!String(getPath(project, "review.reviewer") || "").trim()) errors.push("Approved projects require review.reviewer");
      if (!String(getPath(project, "review.reviewedAt") || "").trim()) errors.push("Approved projects require review.reviewedAt");
    }
    if (getPath(project, "mlsImport.active")) {
      if (!getPath(project, "mlsImport.exactMatch")) errors.push("Authorized MLS import requires one exact provider, board, and listing-number match");
      ["provider.id", "provider.board", "listingNumber", "retrievedAt", "status"].forEach(path => {
        if (!populated(getPath(project.mlsImport, path))) errors.push(`Authorized MLS import is missing mlsImport.${path}`);
      });
      if (INACTIVE_MLS_STATUSES.has(normalizedStatus(getPath(project, "mlsImport.status")))) errors.push("Authorized MLS listing status is not publishable");
      const blockedImages = (getPath(project, "mlsImport.images") || []).filter(imageRightsBlocked);
      if (blockedImages.length) errors.push(`Authorized MLS import has ${blockedImages.length} image-rights item(s) requiring confirmation or local replacement`);
      if (!getPath(project, "mlsImport.reviewConfirmed")) errors.push("Authorized MLS imports require explicit human review before export");
      if (getPath(project, "mlsImport.stale")) warnings.push("Authorized MLS source data is stale; refresh and review it before publication");
      (getPath(project, "mlsImport.missing") || []).forEach(path => warnings.push(`Authorized MLS source did not provide ${path}`));
    }
    return {errors: [...new Set(errors)], warnings: [...new Set(warnings)], profile};
  }

  function parseScalar(value) {
    const text = value.replace(/\s+#.*$/, "").trim();
    if (!text) return "";
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      if (text.startsWith('"')) { try { return JSON.parse(text); } catch (_) { return text.slice(1, -1); } }
      return text.slice(1, -1).replace(/''/g, "'");
    }
    if (text === "true") return true;
    if (text === "false") return false;
    if (text === "null" || text === "~") return null;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (text.startsWith("[") || text.startsWith("{")) { try { return JSON.parse(text); } catch (_) { /* use text */ } }
    return text;
  }
  function parseSimpleYaml(source) {
    const lines = String(source).split(/\r?\n/).map((raw, number) => ({
      number: number + 1,
      indent: raw.match(/^ */)[0].length,
      text: raw.trim(),
    })).filter(line => line.text && !line.text.startsWith("#"));
    function block(start, indent) {
      const arrayMode = lines[start] && lines[start].indent === indent && lines[start].text.startsWith("- ");
      const value = arrayMode ? [] : {}; let index = start;
      while (index < lines.length && lines[index].indent === indent && lines[index].text.startsWith("- ") === arrayMode) {
        const line = lines[index];
        if (arrayMode) {
          const item = line.text.slice(2).trim();
          if (!item) {
            if (!lines[index + 1] || lines[index + 1].indent <= indent) value.push("");
            else { const child = block(index + 1, lines[index + 1].indent); value.push(child.value); index = child.index - 1; }
          } else value.push(parseScalar(item));
        } else {
          const match = line.text.match(/^([^:]+):(.*)$/);
          if (!match) throw new Error(`Unsupported YAML on line ${line.number}`);
          const key = match[1].trim(); const remainder = match[2].trim();
          if (remainder) value[key] = parseScalar(remainder);
          else if (lines[index + 1] && lines[index + 1].indent > indent) {
            const child = block(index + 1, lines[index + 1].indent); value[key] = child.value; index = child.index - 1;
          } else value[key] = {};
        }
        index += 1;
      }
      return {value, index};
    }
    return lines.length ? block(0, lines[0].indent).value : {};
  }
  function yamlScalar(value) {
    if (value == null) return "null";
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(String(value));
  }
  function toSimpleYaml(value, indent = 0) {
    const pad = " ".repeat(indent); const rows = [];
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (isObject(item) || Array.isArray(item)) rows.push(`${pad}-\n${toSimpleYaml(item, indent + 2)}`);
        else rows.push(`${pad}- ${yamlScalar(item)}`);
      });
    } else {
      Object.entries(value || {}).forEach(([key, item]) => {
        if (Array.isArray(item) && !item.length) rows.push(`${pad}${key}: []`);
        else if (isObject(item) && !Object.keys(item).length) rows.push(`${pad}${key}: {}`);
        else if (isObject(item) || Array.isArray(item)) rows.push(`${pad}${key}:\n${toSimpleYaml(item, indent + 2)}`);
        else rows.push(`${pad}${key}: ${yamlScalar(item)}`);
      });
    }
    return rows.join("\n");
  }

  function toListingData(project) {
    return {
      listing: {
        status: project.listing.status, demo: false, address: project.listing.address, unit: project.listing.unit,
        city: project.listing.city, postal_code: project.listing.postalCode, tagline: project.listing.headlineEn,
        rent: project.listing.price, rent_period: project.listing.rentPeriod, mls: project.listing.mls,
        beds: Number(project.listing.beds), baths: Number(project.listing.baths), sqft: project.listing.sqft,
        floor: project.listing.floor, exposure: project.listing.exposure, balcony: project.listing.balcony, parking: project.listing.parking,
        availability: project.listing.availability, open_house: project.listing.openHouse || "",
        description_en: project.listing.descriptionEn || "", description_zh: project.listing.descriptionZh || "",
      },
      brand: {name: project.brand.name, tagline: project.brand.tagline, website: project.brand.website, logo: project.media.logoLightName || "assets/logo.png"},
      contact: clone(project.contact),
      photos: {
        hero: project.media.heroName || "assets/hero.jpg", hero_focal: clone(project.focal),
        gallery: project.media.gallery.map(item => item.name || "assets/interior.jpg"),
        floorplan: activeFloorPlans(project)[0] ? activeFloorPlans(project)[0].name : (project.media.floorplanName || ""),
        floorplans: activeFloorPlans(project).map(plan => ({name: plan.name, role: plan.role, fit: plan.fit, focal: clone(plan.focal), caption_en: plan.captionEn, caption_zh: plan.captionZh, note_en: plan.noteEn, note_zh: plan.noteZh, pixel_width: plan.pixelWidth, pixel_height: plan.pixelHeight})),
      },
      content: {
        features: list(project.content.featuresEn), amenities: activeAmenities(project).map(item => item.labelEn || item.labelZh),
        utilities: [
          ...activeIncludedCosts(project).map(item => `${item.labelEn || item.labelZh} included`),
          ...activeTenantPaidCosts(project).map(item => `${item.labelEn || item.labelZh} paid by tenant`),
        ], location_highlights: list(project.content.locationEn),
        translations: {headline_zh: project.listing.headlineZh, features_zh: list(project.content.featuresZh)},
      },
      theme: clone(project.theme), canvas: {width: 1800, height: 2400, dpi: 150},
      studio: {
        project_schema_version: PROJECT_SCHEMA_VERSION, language_mode: project.language.mode,
        compliance: clone(project.compliance), template: clone(project.template), review: clone(project.review), media: clone(project.media), modules: clone(project.modules),
        mls_import: project.mlsImport ? sanitizeMlsValue(project.mlsImport) : null,
      },
    };
  }
  function projectFromListingData(raw, defaults) {
    if (raw && raw.schemaVersion) return normalizeProject(raw, defaults);
    const project = clone(defaults); const listing = raw.listing || {}; const photos = raw.photos || {}; const content = raw.content || {};
    Object.assign(project.listing, {
      status: listing.status || project.listing.status, address: listing.address || "", unit: listing.unit || "",
      city: listing.city || "", postalCode: listing.postal_code || "", headlineEn: listing.tagline || "",
      headlineZh: getPath(content, "translations.headline_zh") || "", price: listing.rent || listing.price || "",
      rentPeriod: listing.rent_period || "", mls: listing.mls || "", beds: listing.beds || "", baths: listing.baths || "",
      sqft: listing.sqft || "", floor: listing.floor || "", exposure: listing.exposure || "", balcony: listing.balcony || "", parking: listing.parking || "",
      availability: listing.availability || "", openHouse: listing.open_house || "",
      descriptionEn: listing.description_en || "", descriptionZh: listing.description_zh || "",
    });
    Object.assign(project.brand, raw.brand || {}); Object.assign(project.contact, raw.contact || {}); Object.assign(project.theme, raw.theme || {});
    project.content.featuresEn = list(content.features).join("\n"); project.content.featuresZh = list(getPath(content, "translations.features_zh")).join("\n");
    project.content.amenitiesEn = list(content.amenities).join("\n"); project.content.utilitiesEn = list(content.utilities).join("\n"); project.content.locationEn = list(content.location_highlights).join("\n");
    if (!raw.studio || !raw.studio.modules || !Array.isArray(raw.studio.modules.amenities)) {
      project.modules.amenities = list(content.amenities).slice(0, MODULE_LIMITS.amenities).map((label, index) => ({id: `imported-amenity-${index + 1}`, icon: "building-community", labelEn: label, labelZh: "", state: "active"}));
    }
    project.focal = Array.isArray(photos.hero_focal) ? photos.hero_focal.map(Number) : [.5, .5];
    project.media.heroName = photos.hero || ""; project.media.logoLightName = getPath(raw, "brand.logo") || "";
    project.media.floorplanName = photos.floorplan || ""; project.media.gallery = list(photos.gallery).map(name => ({name, dataUrl: "", type: ""}));
    if (Array.isArray(photos.floorplans)) {
      project.media.floorplans = photos.floorplans.slice(0, MODULE_LIMITS.floorPlans).map((plan, index) => ({
        role: plan.role || (index ? "technical2d" : "furnished3d"), name: plan.name || "", type: "", dataUrl: "",
        fit: plan.fit || "contain", focal: Array.isArray(plan.focal) ? plan.focal.map(Number) : [.5, .5],
        captionEn: plan.caption_en || "", captionZh: plan.caption_zh || "", noteEn: plan.note_en || "", noteZh: plan.note_zh || "",
        pixelWidth: Number(plan.pixel_width || 0), pixelHeight: Number(plan.pixel_height || 0),
      }));
    }
    if (raw.studio) {
      if (raw.studio.language_mode) project.language.mode = raw.studio.language_mode;
      if (raw.studio.compliance) project.compliance = deepMerge(project.compliance, raw.studio.compliance);
      if (raw.studio.template) project.template = deepMerge(project.template, raw.studio.template);
      if (raw.studio.review) project.review = deepMerge(project.review, raw.studio.review);
      if (raw.studio.media) project.media = deepMerge(project.media, raw.studio.media);
      if (raw.studio.modules) project.modules = deepMerge(project.modules, raw.studio.modules);
      if (raw.studio.mls_import) project.mlsImport = deepMerge(project.mlsImport || {}, sanitizeMlsValue(raw.studio.mls_import));
    }
    return normalizeProject(project, defaults);
  }
  function normalizeProject(saved, defaults) {
    const migrated = deepMerge(defaults, saved || {}); migrated.schemaVersion = PROJECT_SCHEMA_VERSION; migrated.appVersion = APP_VERSION;
    if (!Array.isArray(migrated.media.gallery)) migrated.media.gallery = [];
    migrated.media.gallery = migrated.media.gallery.slice(0, 4).map(item => typeof item === "string" ? {name: "interior.jpg", dataUrl: item, type: "image/jpeg"} : item);
    if (!Array.isArray(migrated.media.floorplans)) migrated.media.floorplans = [];
    const savedHasFloorplans = Boolean(saved && saved.media && Object.prototype.hasOwnProperty.call(saved.media, "floorplans"));
    if (!savedHasFloorplans && (migrated.media.floorplanDataUrl || migrated.media.floorplanName)) {
      const legacy = {
        role: "technical2d", name: migrated.media.floorplanName || "floor-plan", type: migrated.media.floorplanType || "", dataUrl: migrated.media.floorplanDataUrl || "",
        fit: "contain", focal: [.5, .5], captionEn: "2D floor plan", captionZh: "二维户型图", noteEn: "", noteZh: "", pixelWidth: 0, pixelHeight: 0,
      };
      const slot = migrated.media.floorplans.findIndex(plan => plan.role === "technical2d");
      if (slot >= 0) migrated.media.floorplans[slot] = deepMerge(migrated.media.floorplans[slot], legacy); else migrated.media.floorplans.push(legacy);
    }
    ["propertyFacts", "spotlights", "leaseDetails", "includedCosts", "tenantPaidCosts", "amenities", "applicationRequirements"].forEach(name => {
      if (!Array.isArray(getPath(migrated, `modules.${name}`))) setPath(migrated, `modules.${name}`, []);
    });
    const savedHasAmenities = Boolean(saved && saved.modules && Object.prototype.hasOwnProperty.call(saved.modules, "amenities"));
    if (!savedHasAmenities && list(getPath(saved || {}, "content.amenitiesEn")).length) {
      migrated.modules.amenities = list(getPath(saved, "content.amenitiesEn")).slice(0, MODULE_LIMITS.amenities).map((label, index) => ({id: `legacy-amenity-${index + 1}`, icon: "building-community", labelEn: label, labelZh: "", state: "active"}));
    }
    if (!Array.isArray(migrated.media.portraitFocal) || migrated.media.portraitFocal.length !== 2) migrated.media.portraitFocal = [.5, .5];
    if (!migrated.contact.portraitMode) migrated.contact.portraitMode = "none";
    if (typeof migrated.compliance.applicationRequirementsConfirmed !== "boolean") migrated.compliance.applicationRequirementsConfirmed = false;
    if (!migrated.compliance.disclaimer) migrated.compliance.disclaimer = activeComplianceProfile(migrated).disclaimer;
    if (migrated.mlsImport) {
      if (!isObject(migrated.mlsImport.fields)) migrated.mlsImport.fields = {};
      if (!Array.isArray(migrated.mlsImport.images)) migrated.mlsImport.images = [];
      if (!Array.isArray(migrated.mlsImport.missing)) migrated.mlsImport.missing = [];
      if (!Array.isArray(migrated.mlsImport.blocked)) migrated.mlsImport.blocked = [];
    }
    return migrated;
  }

  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (isObject(value)) return Object.keys(value).sort().reduce((result, key) => { result[key] = canonicalize(value[key]); return result; }, {});
    return value;
  }
  function canonicalStringify(value) { return JSON.stringify(canonicalize(value)); }
  function comparableProject(project) {
    const copy = clone(project); delete copy.review.baseline; delete copy.review.notes; delete copy.review.reviewer; delete copy.review.reviewedAt; delete copy.review.status;
    const media = copy.media || {};
    ["heroDataUrl", "portraitDataUrl", "logoLightDataUrl", "logoDarkDataUrl", "floorplanDataUrl"].forEach(key => { if (media[key]) media[key] = embeddedSignature(media[key]); });
    media.gallery = (media.gallery || []).map(item => ({name: item.name, type: item.type, embedded: Boolean(item.dataUrl), signature: item.dataUrl ? embeddedSignature(item.dataUrl) : ""}));
    media.floorplans = (media.floorplans || []).map(item => ({...item, dataUrl: item.dataUrl ? embeddedSignature(item.dataUrl) : ""}));
    if (copy.modules) copy.modules.spotlights = (copy.modules.spotlights || []).map(item => ({...item, dataUrl: item.dataUrl ? embeddedSignature(item.dataUrl) : ""}));
    if (copy.mlsImport) copy.mlsImport.images = (copy.mlsImport.images || []).map(item => ({...item, dataUrl: item.dataUrl ? embeddedSignature(item.dataUrl) : ""}));
    return copy;
  }
  function diffProjects(previous, current) {
    const before = comparableProject(previous || {}); const after = comparableProject(current || {}); const changes = [];
    function walk(left, right, path) {
      if (canonicalStringify(left) === canonicalStringify(right)) return;
      if (isObject(left) && isObject(right)) {
        [...new Set([...Object.keys(left), ...Object.keys(right)])].sort().forEach(key => walk(left[key], right[key], path ? `${path}.${key}` : key));
      } else changes.push({path, before: left == null ? null : left, after: right == null ? null : right});
    }
    walk(before, after, ""); return changes;
  }

  function dataUrlToBytes(dataUrl) {
    const parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return new Uint8Array();
    const binary = typeof atob === "function" ? atob(parts[1]) : Buffer.from(parts[1], "base64").toString("binary");
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function embeddedSignature(dataUrl) {
    const bytes = dataUrlToBytes(dataUrl);
    return `[embedded:${bytes.length}:${crc32(bytes).toString(16).padStart(8, "0")}]`;
  }
  function write16(view, offset, value) { view.setUint16(offset, value, true); }
  function write32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
  function makeZip(files) {
    const encoder = new TextEncoder();
    const prepared = files.map(file => ({...file, data: file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data), nameBytes: encoder.encode(file.name), crc: crc32(file.data)}));
    const localSize = prepared.reduce((sum, file) => sum + 30 + file.nameBytes.length + file.data.length, 0);
    const centralSize = prepared.reduce((sum, file) => sum + 46 + file.nameBytes.length, 0);
    const output = new Uint8Array(localSize + centralSize + 22); const view = new DataView(output.buffer); let offset = 0; const records = [];
    for (const file of prepared) {
      const start = offset; write32(view, offset, 0x04034b50); write16(view, offset + 4, 20); write16(view, offset + 6, 0x0800); write16(view, offset + 8, 0); write16(view, offset + 10, 0); write16(view, offset + 12, 0); write32(view, offset + 14, file.crc); write32(view, offset + 18, file.data.length); write32(view, offset + 22, file.data.length); write16(view, offset + 26, file.nameBytes.length); write16(view, offset + 28, 0);
      output.set(file.nameBytes, offset + 30); output.set(file.data, offset + 30 + file.nameBytes.length); offset += 30 + file.nameBytes.length + file.data.length; records.push({file, start});
    }
    const centralStart = offset;
    for (const {file, start} of records) {
      write32(view, offset, 0x02014b50); write16(view, offset + 4, 20); write16(view, offset + 6, 20); write16(view, offset + 8, 0x0800); write16(view, offset + 10, 0); write16(view, offset + 12, 0); write16(view, offset + 14, 0); write32(view, offset + 16, file.crc); write32(view, offset + 20, file.data.length); write32(view, offset + 24, file.data.length); write16(view, offset + 28, file.nameBytes.length); write16(view, offset + 30, 0); write16(view, offset + 32, 0); write16(view, offset + 34, 0); write16(view, offset + 36, 0); write32(view, offset + 38, 0); write32(view, offset + 42, start); output.set(file.nameBytes, offset + 46); offset += 46 + file.nameBytes.length;
    }
    write32(view, offset, 0x06054b50); write16(view, offset + 4, 0); write16(view, offset + 6, 0); write16(view, offset + 8, records.length); write16(view, offset + 10, records.length); write32(view, offset + 12, centralSize); write32(view, offset + 16, centralStart); write16(view, offset + 20, 0); return output;
  }
  async function sha256Bytes(bytes) {
    let digest;
    if (globalThis.crypto && globalThis.crypto.subtle) digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    else {
      const crypto = require("crypto"); return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
    }
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  }
  async function sha256Text(text) { return sha256Bytes(new TextEncoder().encode(String(text))); }
  async function buildManifest(project, outputFiles) {
    const projectCopy = clone(project); delete projectCopy.review.baseline;
    const typography = activeTypography(project);
    const mlsProvenance = getPath(project, "mlsImport.active") ? sanitizeMlsValue({
      provider: project.mlsImport.provider, listingNumber: project.mlsImport.listingNumber,
      retrievedAt: project.mlsImport.retrievedAt, sourceUpdatedAt: project.mlsImport.sourceUpdatedAt,
      exactMatch: project.mlsImport.exactMatch, stale: project.mlsImport.stale, status: project.mlsImport.status,
      fields: project.mlsImport.fields, images: (project.mlsImport.images || []).map(({dataUrl, ...image}) => image),
      completeness: mlsCompleteness(project), reviewedAt: project.mlsImport.reviewedAt,
    }) : null;
    const assets = [
      ["hero", project.media.heroName, project.media.heroDataUrl], ["portrait", project.media.portraitName, project.media.portraitDataUrl], ["logo_light", project.media.logoLightName, project.media.logoLightDataUrl],
      ["logo_dark", project.media.logoDarkName, project.media.logoDarkDataUrl], ["floorplan", project.media.floorplanName, project.media.floorplanDataUrl],
      ...project.media.gallery.map((item, index) => [`gallery_${index + 1}`, item.name, item.dataUrl]),
      ...(project.media.floorplans || []).map((item, index) => [`floorplan_${item.role || index + 1}`, item.name, item.dataUrl]),
      ...moduleItems(project, "spotlights").map((item, index) => [`spotlight_${index + 1}`, item.name, item.dataUrl]),
    ].filter(item => item[2]);
    return {
      generator: `realtor-poster-studio ${APP_VERSION}`, schemaVersion: PROJECT_SCHEMA_VERSION,
      createdAt: new Date().toISOString(), projectSha256: await sha256Text(canonicalStringify(projectCopy)),
      language: {
        mode: project.language.mode,
        typographyStyle: typography.style,
        fonts: project.language.mode === "english" ? [typography.latin, typography.serif] : [typography.cjk, typography.latin, typography.serif],
      },
      compliance: {profile: activeComplianceProfile(project).name, version: activeComplianceProfile(project).version, disclaimer: project.compliance.disclaimer},
      template: {
        name: project.template.name,
        version: project.template.version,
        defaultPreset: project.preset,
        moduleOrder: [...MODULE_ORDER],
        layoutPolicy: {
          poster: "all populated modules in configured order",
          portrait: "four priority facts plus two included and two tenant-paid costs",
          story: "four priority facts plus two included and two tenant-paid costs",
          square: "four priority facts plus listing identity and agent contact",
          landscape: "four priority facts plus listing identity and agent contact",
        },
      },
      modules: {
        propertyFacts: allPropertyFacts(project).map(({id, icon, source, value, labelEn, labelZh, visible, priority, order}) => ({id, icon, source, value, labelEn, labelZh, visible: visible !== false, priority, order})),
        floorPlans: activeFloorPlans(project).map(({role, name, fit, focal, captionEn, captionZh, noteEn, noteZh, pixelWidth, pixelHeight}) => ({role, name, fit, focal, captionEn, captionZh, noteEn, noteZh, pixelWidth, pixelHeight})),
        spotlights: activeSpotlights(project).map(({id, name, mask, focal, titleEn, titleZh, detailEn, detailZh}) => ({id, name, mask, focal, titleEn, titleZh, detailEn, detailZh})),
        leaseDetails: activeLeaseDetails(project).map(({id, labelEn, labelZh, valueEn, valueZh, state}) => ({id, labelEn, labelZh, valueEn, valueZh, state})),
        includedCosts: activeIncludedCosts(project).map(({id, icon, labelEn, labelZh, state}) => ({id, icon, labelEn, labelZh, state})),
        tenantPaidCosts: activeTenantPaidCosts(project).map(({id, icon, labelEn, labelZh, state}) => ({id, icon, labelEn, labelZh, state})),
        amenities: activeAmenities(project).map(({id, icon, labelEn, labelZh, state}) => ({id, icon, labelEn, labelZh, state})),
        applicationRequirements: activeApplicationRequirements(project).map(({id, icon, labelEn, labelZh, state}) => ({id, icon, labelEn, labelZh, state})),
        agentProfile: {
          portraitMode: getPath(project, "contact.portraitMode") || "none",
          portraitFocal: clone(getPath(project, "media.portraitFocal") || [.5, .5]),
          name: getPath(project, "contact.name") || "",
          title: getPath(project, "contact.title") || "",
          license: getPath(project, "contact.license") || "",
          phone: getPath(project, "contact.phone") || "",
          email: getPath(project, "contact.email") || "",
          website: getPath(project, "contact.website") || getPath(project, "brand.website") || "",
          brokerage: getPath(project, "brand.name") || "",
          taglineEn: getPath(project, "contact.taglineEn") || "",
          taglineZh: getPath(project, "contact.taglineZh") || "",
          ctaTitleEn: getPath(project, "contact.ctaTitleEn") || "",
          ctaTitleZh: getPath(project, "contact.ctaTitleZh") || "",
          ctaBodyEn: getPath(project, "contact.ctaBodyEn") || "",
          ctaBodyZh: getPath(project, "contact.ctaBodyZh") || "",
        },
      },
      assets: await Promise.all(assets.map(async ([role, name, dataUrl]) => ({role, filename: name, sha256: await sha256Bytes(dataUrlToBytes(dataUrl))}))),
      outputs: await Promise.all((outputFiles || []).map(async file => ({filename: file.name, bytes: file.data.length, sha256: await sha256Bytes(file.data)}))),
      mlsImport: mlsProvenance,
      provenance: mlsProvenance
        ? "Imported listing values retain authorized provider, board, retrieval-time, original-value, and user-override provenance. Images are exportable only after provider permission, explicit user confirmation, or local replacement."
        : "Listing and module text comes from validated user input. Images are fitted or cropped locally and are never generated or uploaded by this tool.",
    };
  }

  return {
    APP_VERSION, PROJECT_SCHEMA_VERSION, OUTPUT_DIMENSIONS, MODULE_LIMITS, MODULE_ORDER, COMPLIANCE_PROFILES, TYPOGRAPHY_PRESETS, MLS_SCALAR_MAPPING, MLS_MODULE_MAPPING, clone, getPath, setPath, deepMerge, list,
    profileForStatus, activeComplianceProfile, activeTypography, buildTemplate, applyTemplate, duplicateTemplate,
    allPropertyFacts, resolvedPropertyFacts, activeFloorPlans, activeSpotlights, activeLeaseDetails, activeIncludedCosts, activeTenantPaidCosts,
    activeAmenities, activeApplicationRequirements, costConflicts, layoutSnapshot,
    campaignCopy, buildApprovalRecord, validateProject, parseSimpleYaml, toSimpleYaml, toListingData,
    buildMlsImportPlan, applyMlsImport, recordMlsOverride, confirmMlsImageRights, resolveMlsImageWithReplacement, mlsCompleteness, sanitizeMlsValue,
    projectFromListingData, normalizeProject, canonicalStringify, diffProjects, dataUrlToBytes, crc32, makeZip,
    sha256Bytes, sha256Text, buildManifest,
  };
});
