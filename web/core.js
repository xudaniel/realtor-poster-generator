(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RealtorPosterCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const APP_VERSION = "1.3.0";
  const PROJECT_SCHEMA_VERSION = 2;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+()\-. xX\d]+$/;
  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  const COMPLIANCE_PROFILES = {
    lease: {
      id: "lease",
      name: "Residential lease",
      version: "1.0.0",
      required: ["listing.address", "listing.unit", "listing.price", "listing.mls", "listing.availability", "contact.name", "contact.title", "contact.phone", "contact.email", "brand.name"],
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
      layout: {defaultPreset: project.preset},
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
      statement: "Internal workflow record only; not an electronic signature or legal, regulatory, MLS, or brokerage approval.",
    };
  }

  function validateProject(project) {
    const errors = []; const warnings = [];
    const required = [
      "listing.address", "listing.unit", "listing.price", "listing.mls", "listing.beds", "listing.baths",
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
    if (!getPath(project, "media.floorplanDataUrl")) warnings.push("No floor plan selected");
    if (!gallery.length) warnings.push("No interior photos selected");
    if (getPath(project, "review.status") === "Approved") {
      if (!String(getPath(project, "review.reviewer") || "").trim()) errors.push("Approved projects require review.reviewer");
      if (!String(getPath(project, "review.reviewedAt") || "").trim()) errors.push("Approved projects require review.reviewedAt");
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
        floor: project.listing.floor, exposure: project.listing.exposure, parking: project.listing.parking,
        availability: project.listing.availability,
      },
      brand: {name: project.brand.name, tagline: project.brand.tagline, website: project.brand.website, logo: project.media.logoLightName || "assets/logo.png"},
      contact: clone(project.contact),
      photos: {
        hero: project.media.heroName || "assets/hero.jpg", hero_focal: clone(project.focal),
        gallery: project.media.gallery.map(item => item.name || "assets/interior.jpg"),
        floorplan: project.media.floorplanName || "",
      },
      content: {
        features: list(project.content.featuresEn), amenities: list(project.content.amenitiesEn),
        utilities: list(project.content.utilitiesEn), location_highlights: list(project.content.locationEn),
        translations: {headline_zh: project.listing.headlineZh, features_zh: list(project.content.featuresZh)},
      },
      theme: clone(project.theme), canvas: {width: 1800, height: 2400, dpi: 150},
      studio: {
        project_schema_version: PROJECT_SCHEMA_VERSION, language_mode: project.language.mode,
        compliance: clone(project.compliance), template: clone(project.template), review: clone(project.review), media: clone(project.media),
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
      sqft: listing.sqft || "", floor: listing.floor || "", exposure: listing.exposure || "", parking: listing.parking || "",
      availability: listing.availability || "",
    });
    Object.assign(project.brand, raw.brand || {}); Object.assign(project.contact, raw.contact || {}); Object.assign(project.theme, raw.theme || {});
    project.content.featuresEn = list(content.features).join("\n"); project.content.featuresZh = list(getPath(content, "translations.features_zh")).join("\n");
    project.content.amenitiesEn = list(content.amenities).join("\n"); project.content.utilitiesEn = list(content.utilities).join("\n"); project.content.locationEn = list(content.location_highlights).join("\n");
    project.focal = Array.isArray(photos.hero_focal) ? photos.hero_focal.map(Number) : [.5, .5];
    project.media.heroName = photos.hero || ""; project.media.logoLightName = getPath(raw, "brand.logo") || "";
    project.media.floorplanName = photos.floorplan || ""; project.media.gallery = list(photos.gallery).map(name => ({name, dataUrl: "", type: ""}));
    if (raw.studio) {
      if (raw.studio.language_mode) project.language.mode = raw.studio.language_mode;
      if (raw.studio.compliance) project.compliance = deepMerge(project.compliance, raw.studio.compliance);
      if (raw.studio.template) project.template = deepMerge(project.template, raw.studio.template);
      if (raw.studio.review) project.review = deepMerge(project.review, raw.studio.review);
      if (raw.studio.media) project.media = deepMerge(project.media, raw.studio.media);
    }
    return normalizeProject(project, defaults);
  }
  function normalizeProject(saved, defaults) {
    const migrated = deepMerge(defaults, saved || {}); migrated.schemaVersion = PROJECT_SCHEMA_VERSION; migrated.appVersion = APP_VERSION;
    if (!Array.isArray(migrated.media.gallery)) migrated.media.gallery = [];
    migrated.media.gallery = migrated.media.gallery.slice(0, 4).map(item => typeof item === "string" ? {name: "interior.jpg", dataUrl: item, type: "image/jpeg"} : item);
    if (!migrated.compliance.disclaimer) migrated.compliance.disclaimer = activeComplianceProfile(migrated).disclaimer;
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
    ["heroDataUrl", "logoLightDataUrl", "logoDarkDataUrl", "floorplanDataUrl"].forEach(key => { if (media[key]) media[key] = embeddedSignature(media[key]); });
    media.gallery = (media.gallery || []).map(item => ({name: item.name, type: item.type, embedded: Boolean(item.dataUrl), signature: item.dataUrl ? embeddedSignature(item.dataUrl) : ""}));
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
    const assets = [
      ["hero", project.media.heroName, project.media.heroDataUrl], ["logo_light", project.media.logoLightName, project.media.logoLightDataUrl],
      ["logo_dark", project.media.logoDarkName, project.media.logoDarkDataUrl], ["floorplan", project.media.floorplanName, project.media.floorplanDataUrl],
      ...project.media.gallery.map((item, index) => [`gallery_${index + 1}`, item.name, item.dataUrl]),
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
      template: {name: project.template.name, version: project.template.version, defaultPreset: project.preset},
      assets: await Promise.all(assets.map(async ([role, name, dataUrl]) => ({role, filename: name, sha256: await sha256Bytes(dataUrlToBytes(dataUrl))}))),
      outputs: await Promise.all((outputFiles || []).map(async file => ({filename: file.name, bytes: file.data.length, sha256: await sha256Bytes(file.data)}))),
      provenance: "Listing text comes from validated user input. Images are cropped locally and are never generated or uploaded by this tool.",
    };
  }

  return {
    APP_VERSION, PROJECT_SCHEMA_VERSION, COMPLIANCE_PROFILES, TYPOGRAPHY_PRESETS, clone, getPath, setPath, deepMerge, list,
    profileForStatus, activeComplianceProfile, activeTypography, buildTemplate, applyTemplate, duplicateTemplate,
    campaignCopy, buildApprovalRecord, validateProject, parseSimpleYaml, toSimpleYaml, toListingData,
    projectFromListingData, normalizeProject, canonicalStringify, diffProjects, dataUrlToBytes, crc32, makeZip,
    sha256Bytes, sha256Text, buildManifest,
  };
});
