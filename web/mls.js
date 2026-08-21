(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RealtorPosterMls = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PROTOCOL_VERSION = "1.0";
  const MAX_RESPONSE_BYTES = 12 * 1024 * 1024;
  const ACTIVE_STATUSES = new Set(["FOR LEASE", "FOR SALE", "JUST LISTED", "OPEN HOUSE"]);
  const LISTING_FIELD_MAP = {
    status: "listing.status", address: "listing.address", unit: "listing.unit", city: "listing.city", postalCode: "listing.postalCode",
    price: "listing.price", rentPeriod: "listing.rentPeriod", mlsNumber: "listing.mls", beds: "listing.beds", baths: "listing.baths",
    sqft: "listing.sqft", floor: "listing.floor", exposure: "listing.exposure", balcony: "listing.balcony", parking: "listing.parking",
    availability: "listing.availability", headlineEn: "listing.headlineEn", headlineZh: "listing.headlineZh",
  };
  const CONTENT_FIELD_MAP = {
    featuresEn: "content.featuresEn", featuresZh: "content.featuresZh", amenitiesEn: "content.amenitiesEn",
    utilitiesEn: "content.utilitiesEn", locationEn: "content.locationEn",
  };
  const STRUCTURED_FIELD_MAP = {
    leaseDetails: "modules.leaseDetails", includedCosts: "modules.includedCosts", tenantPaidCosts: "modules.tenantPaidCosts",
    amenities: "modules.amenities", applicationRequirements: "modules.applicationRequirements",
  };
  const REQUIRED_SOURCE_FIELDS = [
    "listing.address", "listing.unit", "listing.status", "listing.city", "listing.postalCode", "listing.price", "listing.mls",
    "listing.beds", "listing.baths", "listing.sqft", "listing.floor", "listing.exposure", "listing.parking", "listing.availability", "listing.headlineEn",
  ];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeMlsNumber(value) { return String(value || "").trim().toUpperCase().replace(/\s+/g, ""); }
  function normalizedStatus(value) { return String(value || "").trim().toUpperCase().replace(/_/g, " ").replace(/\s+/g, " "); }
  function canonical(value) { return JSON.stringify(value == null ? null : value); }
  function contentFingerprint(value) {
    const text = String(value || ""); let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 0x01000193); }
    return `${text.length}:${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }
  function joined(value) { return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean).join("\n") : String(value || ""); }
  function setPath(object, path, value) {
    const keys = String(path).split("."); let target = object;
    keys.slice(0, -1).forEach(key => { if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) target[key] = {}; target = target[key]; });
    target[keys[keys.length - 1]] = value; return object;
  }
  function getPath(object, path) { return String(path).split(".").reduce((value, key) => value == null ? undefined : value[key], object); }

  class MlsProviderError extends Error {
    constructor(code, message, status = 0) { super(message); this.name = "MlsProviderError"; this.code = code; this.status = status; }
  }

  function validateConnectorUrl(value) {
    let parsed;
    try { parsed = new URL(String(value || "")); } catch (_error) { throw new MlsProviderError("CONNECTOR_URL", "Enter a valid authorized connector URL."); }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new MlsProviderError("CONNECTOR_URL", "Connector URLs cannot contain credentials, query strings, or fragments.");
    const loopback = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !loopback) throw new MlsProviderError("CONNECTOR_URL", "Authorized connectors must use HTTPS, except an explicit loopback development connector.");
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
  }

  function providerMessage(error) {
    const code = String(error && error.code || "PROVIDER_UNAVAILABLE");
    const messages = {
      NOT_FOUND: "Listing not found in the connected provider. / 已连接的数据源中未找到该房源。",
      AMBIGUOUS: "More than one listing matched. Confirm the board and MLS number. / 找到多个房源，请核对 MLS 系统与号码。",
      WITHDRAWN: "The listing is withdrawn, expired, or unavailable for campaign generation. / 房源已撤销、过期或不可用于生成广告。",
      UNAUTHORIZED: "The connector session is not authorized. Reconnect through your licensed provider. / 连接器未获授权，请通过持牌数据源重新连接。",
      RATE_LIMITED: "The provider rate limit was reached. Wait and try again. / 已达到数据源请求限制，请稍后重试。",
      CONNECTOR_URL: `${error && error.message || "Invalid connector URL"} / 连接器地址无效。`,
      RESPONSE_TOO_LARGE: "The connector response is too large to process safely. / 连接器返回数据过大，无法安全处理。",
      INVALID_RESPONSE: `The connector returned unsupported data: ${error && error.message || "invalid response"} / 连接器返回了不支持的数据。`,
      PROVIDER_UNAVAILABLE: "The authorized provider is unavailable. Your current editor data was not replaced. / 授权数据源暂时不可用，当前编辑资料未被替换。",
    };
    return messages[code] || messages.PROVIDER_UNAVAILABLE;
  }

  function validateEnvelope(raw, requestedNumber = "") {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new MlsProviderError("INVALID_RESPONSE", "Response must be an object.");
    if (String(raw.protocolVersion || "") !== PROTOCOL_VERSION) throw new MlsProviderError("INVALID_RESPONSE", `Expected protocol ${PROTOCOL_VERSION}.`);
    if (Number(raw.matchCount == null ? 1 : raw.matchCount) !== 1) throw new MlsProviderError(Number(raw.matchCount) > 1 ? "AMBIGUOUS" : "NOT_FOUND", "Connector must return exactly one listing.");
    if (!raw.provider || !String(raw.provider.id || "").trim() || !String(raw.provider.name || "").trim() || !String(raw.provider.board || "").trim()) throw new MlsProviderError("INVALID_RESPONSE", "Provider id, name, and board are required.");
    if (!raw.listing || typeof raw.listing !== "object") throw new MlsProviderError("INVALID_RESPONSE", "Listing data is required.");
    if (!Object.prototype.hasOwnProperty.call(raw.listing, "unit")) throw new MlsProviderError("INVALID_RESPONSE", "Listing unit must be present, including an explicit blank value when not applicable.");
    const requested = normalizeMlsNumber(requestedNumber); const returned = normalizeMlsNumber(raw.listing.mlsNumber);
    if (!returned) throw new MlsProviderError("INVALID_RESPONSE", "Listing MLS number is required.");
    if (requested && requested !== returned) throw new MlsProviderError("INVALID_RESPONSE", "Returned MLS number does not match the request.");
    const status = normalizedStatus(raw.listing.status);
    if (["WITHDRAWN", "EXPIRED", "TERMINATED", "SUSPENDED", "CANCELLED"].includes(status)) throw new MlsProviderError("WITHDRAWN", `Listing status is ${status}.`);
    if (!ACTIVE_STATUSES.has(status)) throw new MlsProviderError("INVALID_RESPONSE", `Unsupported listing status ${status || "blank"}.`);
    if (!String(raw.listing.address || "").trim()) throw new MlsProviderError("INVALID_RESPONSE", "Listing address is required for exact-match confirmation.");
    const match = raw.match; const keys = match && match.keys;
    if (!match || match.confirmed !== true || !keys || typeof keys !== "object") throw new MlsProviderError("INVALID_RESPONSE", "Connector must confirm the exact provider, board, MLS number, status, address, and unit match.");
    const normalizedText = value => String(value == null ? "" : value).trim().toLowerCase().replace(/\s+/g, " ");
    const exactMatch = String(keys.providerId || "") === String(raw.provider.id)
      && normalizedText(keys.board) === normalizedText(raw.provider.board)
      && normalizeMlsNumber(keys.mlsNumber) === returned
      && normalizedStatus(keys.status) === status
      && normalizedText(keys.address) === normalizedText(raw.listing.address)
      && normalizedText(keys.unit) === normalizedText(raw.listing.unit);
    if (!exactMatch) throw new MlsProviderError("INVALID_RESPONSE", "Connector exact-match keys do not match the returned listing.");
    const retrievedAt = new Date(raw.retrievedAt);
    if (Number.isNaN(retrievedAt.getTime())) throw new MlsProviderError("INVALID_RESPONSE", "A valid retrieval time is required.");
    const envelope = clone(raw); envelope.listing.mlsNumber = returned; envelope.listing.status = status; envelope.retrievedAt = retrievedAt.toISOString();
    envelope.media = Array.isArray(envelope.media) ? envelope.media : [];
    if (envelope.media.length > 20) throw new MlsProviderError("INVALID_RESPONSE", "Connector may return at most 20 permitted or blocked media records.");
    const sourceIds = new Set(); const roleCounts = {hero: 0, interior: 0, floorplan: 0};
    envelope.media.forEach((item, index) => {
      if (!item || typeof item !== "object") throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} is invalid.`);
      if (!String(item.role || "").trim() || !String(item.sourceId || "").trim()) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} requires role and sourceId.`);
      if (!Object.prototype.hasOwnProperty.call(roleCounts, item.role)) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} has an unsupported role.`);
      if (sourceIds.has(item.sourceId)) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} repeats sourceId ${item.sourceId}.`);
      sourceIds.add(item.sourceId);
      if (!String(item.name || "").trim() || !String(item.type || "").trim() || !Number.isInteger(Number(item.order)) || Number(item.order) < 0) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} requires name, type, and a non-negative integer order.`);
      if (item.role === "floorplan" && !["furnished3d", "technical2d"].includes(item.subtype)) throw new MlsProviderError("INVALID_RESPONSE", `Floor-plan media ${index + 1} requires subtype furnished3d or technical2d.`);
      if (!item.rights || typeof item.rights.exportAllowed !== "boolean") throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} requires explicit export rights metadata.`);
      if (!String(item.rights.basis || "").trim() || Number.isNaN(new Date(item.rights.confirmedAt).getTime())) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} requires a rights basis and confirmation time.`);
      if (item.rights.sourceId && String(item.rights.sourceId) !== String(item.sourceId)) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} rights sourceId does not match the media sourceId.`);
      if (item.rights.exportAllowed) {
        roleCounts[item.role] += 1;
        const dataMatch = String(item.dataUrl || "").match(/^data:(image\/(?:jpeg|png|webp|svg\+xml));base64,/i);
        if (!dataMatch) throw new MlsProviderError("INVALID_RESPONSE", `Permitted media ${index + 1} must be supplied as a supported embedded base64 image by the connector.`);
        if (item.type && String(item.type).toLowerCase() !== dataMatch[1].toLowerCase()) throw new MlsProviderError("INVALID_RESPONSE", `Media ${index + 1} type does not match its embedded image.`);
        if (!(Number(item.width) > 0) || !(Number(item.height) > 0)) throw new MlsProviderError("INVALID_RESPONSE", `Permitted media ${index + 1} requires positive source dimensions.`);
      }
    });
    if (roleCounts.hero > 1 || roleCounts.interior > 4 || roleCounts.floorplan > 2) throw new MlsProviderError("INVALID_RESPONSE", "Connector media exceeds the supported role limits.");
    return envelope;
  }

  function svgDataUrl(title, top, bottom, detail) {
    const safe = String(title).replace(/[<&]/g, ""); const safeDetail = String(detail).replace(/[<&]/g, "");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="1600" height="1100" fill="url(#g)"/><path d="M120 850 520 360l250 300 190-190 520 380Z" fill="#fff" opacity=".18"/><rect x="190" y="160" width="530" height="330" rx="38" fill="#fff" opacity=".13"/><text x="100" y="980" fill="#fff" font-family="Arial" font-size="74" font-weight="700">${safe}</text><text x="104" y="1040" fill="#fff" opacity=".75" font-family="Arial" font-size="34">${safeDetail}</text></svg>`;
    const encoded = typeof btoa === "function" ? btoa(svg) : Buffer.from(svg, "utf8").toString("base64");
    return `data:image/svg+xml;base64,${encoded}`;
  }

  function demoEnvelope(number, options = {}) {
    const normalized = normalizeMlsNumber(number);
    if (normalized !== "DEMO1234") throw new MlsProviderError("NOT_FOUND", "Use DEMO1234 for the bundled development fixture.", 404);
    const now = options.now || new Date().toISOString();
    const rights = sourceId => ({exportAllowed: true, basis: "Bundled fictional development fixture", sourceId, confirmedAt: now});
    return validateEnvelope({
      protocolVersion: PROTOCOL_VERSION, matchCount: 1, retrievedAt: now,
      provider: {id: "demo-fixture", name: "Bundled MLS Development Fixture", board: "Fictional Toronto Board", environment: "development"},
      match: {confirmed: true, keys: {providerId: "demo-fixture", board: "Fictional Toronto Board", mlsNumber: normalized, status: "FOR LEASE", address: "123 Recovery Lane", unit: "1808"}},
      listing: {
        mlsNumber: normalized, status: "FOR LEASE", address: "123 Recovery Lane", unit: "1808", city: "Toronto, ON", postalCode: "M5V 0A0",
        price: "$4,275", rentPeriod: "per month", beds: "2", baths: "2", sqft: "905", floor: "18th", exposure: "South-West",
        balcony: "Open balcony", parking: "1 space", availability: "Immediately",
        headlineEn: "Light-filled corner residence above the city", headlineZh: "",
        featuresEn: ["Corner suite with floor-to-ceiling windows", "Open living and dining layout", "Transit and waterfront access"],
        featuresZh: [], amenitiesEn: ["24-hour concierge", "Fitness centre", "Rooftop terrace"],
        utilitiesEn: ["Water included", "Hydro paid by tenant"], locationEn: ["Waterfront", "Union Station", "Dining and shopping"],
        leaseDetails: [
          {id: "term", labelEn: "Lease term", labelZh: "租期", valueEn: "12 months preferred", valueZh: "优先一年租期", state: "active"},
          {id: "availability", labelEn: "Available", labelZh: "可入住", valueEn: "Immediately", valueZh: "随时入住", state: "active"},
        ],
        includedCosts: [{id: "water", icon: "droplet", labelEn: "Water", labelZh: "水费", state: "included"}],
        tenantPaidCosts: [{id: "hydro", icon: "bolt", labelEn: "Hydro", labelZh: "电费", state: "tenant-paid"}],
        amenities: [
          {id: "concierge", icon: "building-community", labelEn: "24-hour concierge", labelZh: "24 小时礼宾", state: "active"},
          {id: "fitness", icon: "tool", labelEn: "Fitness centre", labelZh: "健身中心", state: "active"},
          {id: "terrace", icon: "building-skyscraper", labelEn: "Rooftop terrace", labelZh: "屋顶露台", state: "active"},
        ],
        applicationRequirements: [
          {id: "credit-report", icon: "receipt", labelEn: "Credit report", labelZh: "信用报告", state: "required"},
          {id: "employment", icon: "building-bank", labelEn: "Proof of employment", labelZh: "就业证明", state: "required"},
          {id: "references", icon: "circle-check", labelEn: "References", labelZh: "推荐人资料", state: "conditional"},
        ],
      },
      media: [
        {role: "hero", sourceId: "demo-hero", name: "demo-building.svg", type: "image/svg+xml", order: 0, width: 1600, height: 1100, caption: "Fictional development fixture", rights: rights("demo-hero"), dataUrl: svgDataUrl("123 Recovery Lane", "#173837", "#d6a25e", "Fictional MLS development fixture")},
        {role: "interior", sourceId: "demo-living", name: "demo-living.svg", type: "image/svg+xml", order: 1, width: 1600, height: 1100, caption: "Fictional living room", rights: rights("demo-living"), dataUrl: svgDataUrl("Living room", "#806f5b", "#d7b98d", "Bundled fictional image")},
        {role: "interior", sourceId: "demo-kitchen", name: "demo-kitchen.svg", type: "image/svg+xml", order: 2, width: 1600, height: 1100, caption: "Fictional kitchen", rights: rights("demo-kitchen"), dataUrl: svgDataUrl("Kitchen", "#405451", "#aeb8aa", "Bundled fictional image")},
        {role: "floorplan", subtype: "technical2d", sourceId: "demo-plan", name: "demo-plan.svg", type: "image/svg+xml", order: 3, width: 1600, height: 1100, caption: "Illustrative floor plan", rights: rights("demo-plan"), dataUrl: svgDataUrl("Illustrative floor plan", "#ece7db", "#b7b09f", "Not for measurement")},
      ],
    }, normalized);
  }

  class DemoMlsProvider {
    constructor(options = {}) { this.options = options; }
    async resolve(number) { return demoEnvelope(number, this.options); }
  }

  class AuthorizedConnectorProvider {
    constructor(baseUrl, options = {}) {
      this.baseUrl = validateConnectorUrl(baseUrl); this.fetchImpl = options.fetchImpl || globalThis.fetch; this.timeoutMs = Number(options.timeoutMs || 15000);
      if (typeof this.fetchImpl !== "function") throw new MlsProviderError("PROVIDER_UNAVAILABLE", "Fetch is unavailable for the authorized connector.");
    }
    async resolve(number) {
      const mlsNumber = normalizeMlsNumber(number); if (!mlsNumber) throw new MlsProviderError("NOT_FOUND", "MLS number is required.");
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;
      try {
        const response = await this.fetchImpl(`${this.baseUrl}/v1/listings:resolve`, {
          method: "POST", credentials: "include", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer",
          headers: {"Accept": "application/json", "Content-Type": "application/json", "X-Realtor-Poster-Protocol": PROTOCOL_VERSION},
          body: JSON.stringify({mlsNumber}), signal: controller && controller.signal,
        });
        if (response.status === 401 || response.status === 403) throw new MlsProviderError("UNAUTHORIZED", "Connector session is not authorized.", response.status);
        if (response.status === 404) throw new MlsProviderError("NOT_FOUND", "Listing was not found.", 404);
        if (response.status === 409) throw new MlsProviderError("AMBIGUOUS", "Connector returned multiple matches.", 409);
        if (response.status === 410) throw new MlsProviderError("WITHDRAWN", "Listing is unavailable.", 410);
        if (response.status === 429) throw new MlsProviderError("RATE_LIMITED", "Connector rate limit reached.", 429);
        if (!response.ok) throw new MlsProviderError("PROVIDER_UNAVAILABLE", `Connector returned HTTP ${response.status}.`, response.status);
        const contentLength = response.headers && Number(response.headers.get("content-length") || 0);
        if (contentLength > MAX_RESPONSE_BYTES) throw new MlsProviderError("RESPONSE_TOO_LARGE", "Connector response exceeds the safe size limit.");
        const contentType = response.headers && String(response.headers.get("content-type") || "");
        if (contentType && !/application\/(?:[a-z0-9.+-]*\+)?json\b/i.test(contentType)) throw new MlsProviderError("INVALID_RESPONSE", "Connector response must use an application/json content type.");
        const text = await response.text();
        const responseBytes = typeof TextEncoder === "function" ? new TextEncoder().encode(text).byteLength : text.length;
        if (responseBytes > MAX_RESPONSE_BYTES) throw new MlsProviderError("RESPONSE_TOO_LARGE", "Connector response exceeds the safe size limit.");
        let payload;
        try { payload = JSON.parse(text); } catch (_error) { throw new MlsProviderError("INVALID_RESPONSE", "Connector response is not valid JSON."); }
        return validateEnvelope(payload, mlsNumber);
      } catch (error) {
        if (error instanceof MlsProviderError) throw error;
        throw new MlsProviderError("PROVIDER_UNAVAILABLE", error && error.name === "AbortError" ? "Connector request timed out." : "Connector request failed.");
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
  }

  function sourceFields(envelope) {
    const fields = {};
    Object.entries(LISTING_FIELD_MAP).forEach(([source, path]) => { fields[path] = envelope.listing[source] == null ? "" : envelope.listing[source]; });
    Object.entries(CONTENT_FIELD_MAP).forEach(([source, path]) => { fields[path] = joined(envelope.listing[source]); });
    Object.entries(STRUCTURED_FIELD_MAP).forEach(([source, path]) => { fields[path] = Array.isArray(envelope.listing[source]) ? clone(envelope.listing[source]) : []; });
    return fields;
  }

  function diffSourceFields(previous, next) {
    const before = previous || {}; const after = next || {};
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().filter(path => canonical(before[path]) !== canonical(after[path]))
      .map(path => ({path, before: before[path] == null ? null : before[path], after: after[path] == null ? null : after[path]}));
  }

  function mediaMetadata(item) {
    return {
      role: item.role, subtype: item.subtype || "", sourceId: item.sourceId, name: item.name || "", order: Number(item.order || 0),
      width: Number(item.width || 0), height: Number(item.height || 0), caption: item.caption || "",
      contentFingerprint: contentFingerprint(item.dataUrl),
      rights: {exportAllowed: Boolean(item.rights.exportAllowed), basis: item.rights.basis || "", sourceId: item.rights.sourceId || item.sourceId, confirmedAt: item.rights.confirmedAt || ""},
    };
  }

  function analyzeEnvelope(envelope) {
    const fields = sourceFields(envelope); const missing = REQUIRED_SOURCE_FIELDS.filter(path => !String(fields[path] || "").trim());
    const blockedMedia = envelope.media.filter(item => !item.rights.exportAllowed).map(mediaMetadata);
    const permittedMedia = envelope.media.filter(item => item.rights.exportAllowed).map(mediaMetadata);
    if (!permittedMedia.some(item => item.role === "hero")) missing.push("media.hero");
    if (!permittedMedia.some(item => item.role === "interior")) missing.push("media.interior");
    if (!permittedMedia.some(item => item.role === "floorplan")) missing.push("media.floorplan");
    const ageMs = Math.max(0, Date.now() - new Date(envelope.retrievedAt).getTime());
    return {importedFieldCount: Object.values(fields).filter(value => String(value || "").trim()).length, missing, blockedMedia, permittedMedia, stale: ageMs > 24 * 60 * 60 * 1000, retrievedAt: envelope.retrievedAt};
  }

  function diffMedia(previous, nextItems) {
    const before = Array.isArray(previous) ? previous : []; const after = (Array.isArray(nextItems) ? nextItems : []).map(mediaMetadata);
    const beforeMap = new Map(before.map(item => [item.sourceId, item])); const afterMap = new Map(after.map(item => [item.sourceId, item]));
    return [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort().filter(sourceId => canonical(beforeMap.get(sourceId)) !== canonical(afterMap.get(sourceId)))
      .map(sourceId => ({path: `media.${sourceId}`, before: beforeMap.get(sourceId) || null, after: afterMap.get(sourceId) || null}));
  }

  function mapEnvelopeToProject(rawEnvelope, currentProject, core) {
    const envelope = validateEnvelope(rawEnvelope, rawEnvelope && rawEnvelope.listing && rawEnvelope.listing.mlsNumber);
    const project = clone(currentProject); const fields = sourceFields(envelope);
    Object.entries(fields).forEach(([path, value]) => setPath(project, path, value));
    project.listing.status = normalizedStatus(project.listing.status);
    const permitted = envelope.media.filter(item => item.rights.exportAllowed).sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
    const hero = permitted.find(item => item.role === "hero"); const interiors = permitted.filter(item => item.role === "interior").slice(0, 4);
    const plans = permitted.filter(item => item.role === "floorplan").slice(0, 2);
    Object.assign(project.media, {
      heroDataUrl: hero ? hero.dataUrl : "", heroName: hero ? hero.name : "", heroType: hero ? hero.type : "",
      gallery: interiors.map(item => ({name: item.name, type: item.type, dataUrl: item.dataUrl, sourceId: item.sourceId})),
      floorplanDataUrl: "", floorplanName: "", floorplanType: "",
    });
    project.focal = [.5, .5];
    project.media.floorplans = plans.map((item, index) => ({
      role: item.subtype === "furnished3d" ? "furnished3d" : "technical2d", name: item.name, type: item.type, dataUrl: item.dataUrl,
      fit: "contain", focal: [.5, .5], captionEn: item.caption || item.name, captionZh: "", noteEn: "Verify dimensions with the source listing.", noteZh: "请与房源资料核实尺寸。",
      pixelWidth: Number(item.width || 0), pixelHeight: Number(item.height || 0), sourceId: item.sourceId,
    }));

    const analysis = analyzeEnvelope(envelope); const importedAt = new Date().toISOString();
    project.mlsImport = {
      protocolVersion: PROTOCOL_VERSION, provider: clone(envelope.provider), listingNumber: envelope.listing.mlsNumber, retrievedAt: envelope.retrievedAt,
      importedAt, sourceFields: fields, fieldSources: {}, media: envelope.media.map(mediaMetadata), blockedMedia: analysis.blockedMedia,
      missingFields: analysis.missing, mediaOverrides: [], humanReviewedAt: "", rightsReviewedAt: "", refreshCount: Number(getPath(currentProject, "mlsImport.refreshCount") || 0),
    };
    Object.entries(fields).forEach(([path, value]) => { project.mlsImport.fieldSources[path] = {providerId: envelope.provider.id, providerBoard: envelope.provider.board, listingNumber: envelope.listing.mlsNumber, retrievedAt: envelope.retrievedAt, importedValue: clone(value), overriddenAt: "", overrideValue: null}; });
    if (core && typeof core.profileForStatus === "function" && !project.compliance.profile) {
      const profileId = core.profileForStatus(project.listing.status); project.compliance.profileId = profileId;
      if (core.COMPLIANCE_PROFILES && core.COMPLIANCE_PROFILES[profileId]) project.compliance.disclaimer = core.COMPLIANCE_PROFILES[profileId].disclaimer;
    }
    project.review = {...(project.review || {}), status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null};
    return project;
  }

  function recordOverride(project, path, value, at = new Date().toISOString()) {
    const sources = project && project.mlsImport && project.mlsImport.fieldSources;
    const sourcePath = sources && Object.keys(sources).sort((left, right) => right.length - left.length).find(candidate => path === candidate || path.startsWith(`${candidate}.`));
    const source = sourcePath && sources[sourcePath];
    if (!source) return false;
    const currentValue = sourcePath === path ? value : getPath(project, sourcePath);
    if (canonical(currentValue) === canonical(source.importedValue)) { source.overriddenAt = ""; source.overrideValue = null; }
    else { source.overriddenAt = at; source.overrideValue = clone(currentValue); }
    project.mlsImport.humanReviewedAt = "";
    return true;
  }

  function reviewImport(project, reviewed, at = new Date().toISOString()) {
    if (!project || !project.mlsImport) return project;
    project.mlsImport.humanReviewedAt = reviewed ? at : ""; project.mlsImport.rightsReviewedAt = reviewed ? at : ""; return project;
  }

  function validateProjectImport(project) {
    if (!project || !project.mlsImport) return {errors: [], warnings: []};
    const source = project.mlsImport; const errors = []; const warnings = [];
    if (normalizeMlsNumber(getPath(project, "listing.mls")) !== normalizeMlsNumber(source.listingNumber)) errors.push("Imported MLS number no longer matches the connected source record");
    if (!String(source.humanReviewedAt || "").trim()) errors.push("Imported MLS facts require explicit human review before export");
    if ((source.blockedMedia || []).length && !String(source.rightsReviewedAt || "").trim()) errors.push("Restricted MLS images require replacement or explicit rights review before export");
    if ((source.missingFields || []).length) warnings.push(`MLS import is missing ${source.missingFields.length} required source field${source.missingFields.length === 1 ? "" : "s"}`);
    const overrides = Object.entries(source.fieldSources || {}).filter(([_path, detail]) => detail.overriddenAt);
    if (overrides.length) warnings.push(`${overrides.length} imported field${overrides.length === 1 ? " has" : "s have"} local user overrides`);
    if (Date.now() - new Date(source.retrievedAt).getTime() > 24 * 60 * 60 * 1000) warnings.push("MLS source data is more than 24 hours old");
    return {errors, warnings};
  }

  function manifestSummary(project) {
    if (!project || !project.mlsImport) return null; const source = project.mlsImport;
    return {
      provider: clone(source.provider), listingNumber: source.listingNumber, retrievedAt: source.retrievedAt, importedAt: source.importedAt,
      humanReviewedAt: source.humanReviewedAt || "", rightsReviewedAt: source.rightsReviewedAt || "",
      fieldSources: clone(source.fieldSources || {}), media: clone(source.media || []), mediaOverrides: clone(source.mediaOverrides || []), blockedMediaCount: (source.blockedMedia || []).length,
      statement: "Imported through an explicitly configured provider connector. Import does not constitute factual, legal, regulatory, MLS, brokerage, or image-rights approval.",
    };
  }

  return {
    PROTOCOL_VERSION, MAX_RESPONSE_BYTES, LISTING_FIELD_MAP, CONTENT_FIELD_MAP, STRUCTURED_FIELD_MAP, REQUIRED_SOURCE_FIELDS,
    MlsProviderError, normalizeMlsNumber, validateConnectorUrl, providerMessage, validateEnvelope, demoEnvelope,
    DemoMlsProvider, AuthorizedConnectorProvider, sourceFields, diffSourceFields, diffMedia, analyzeEnvelope, mapEnvelopeToProject,
    recordOverride, reviewImport, validateProjectImport, manifestSummary,
  };
});
