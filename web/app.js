(() => {
  "use strict";

  const Core = window.RealtorPosterCore;
  if (!Core) throw new Error("RealtorPosterCore is required");
  const Recovery = window.RealtorPosterRecovery;
  if (!Recovery) throw new Error("RealtorPosterRecovery is required");
  const Mls = window.RealtorPosterMls;
  if (!Mls) throw new Error("RealtorPosterMls is required");
  const mlsClient = Mls.createClient(window.fetch.bind(window));

  const PRESETS = Core.OUTPUT_DIMENSIONS;
  const SOCIAL_PRESETS = ["square", "portrait", "story", "landscape"];
  const STATUS_ZH = {"FOR LEASE": "出租", "FOR SALE": "出售", "JUST LISTED": "全新上市", "OPEN HOUSE": "开放参观"};
  const ICON_NAMES = ["bed", "bath", "ruler-measure", "building-skyscraper", "compass", "building-community", "parking", "calendar", "key", "receipt", "shield-check", "paw", "smoking-no", "droplet", "flame", "snowflake", "tool", "bolt", "photo", "building-bank", "circle-check"];

  const DEFAULT_PROJECT = {
    schemaVersion: Core.PROJECT_SCHEMA_VERSION, appVersion: Core.APP_VERSION,
    listing: {
      address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M5J 2N8",
      price: "$3,850", rentPeriod: "per month", mls: "C1234567", beds: "2", baths: "2", sqft: "815",
      floor: "26th", exposure: "South-East", balcony: "Open balcony", parking: "1 Space", availability: "Immediately",
      openHouse: "", descriptionEn: "", descriptionZh: "",
      headlineEn: "Lake views. Downtown energy. A home above it all.", headlineZh: "湖景之上，都市生活触手可及",
    },
    contact: {
      name: "Daniel Xu", title: "Sales Representative", license: "", phone: "416-555-0198", email: "hello@example.com", website: "example.com",
      portraitMode: "initials", taglineEn: "Your dedicated leasing expert", taglineZh: "您的专属租赁顾问",
      ctaTitleEn: "Find your next home", ctaTitleZh: "找到理想新居", ctaBodyEn: "Professional, responsive, local.", ctaBodyZh: "专业、及时、熟悉本地。",
    },
    brand: {name: "Harbour Realty Group", tagline: "Move beautifully.", website: "example.com"},
    content: {
      featuresEn: "Floor-to-ceiling windows\nFlexible den and generous storage\nSteps to transit and waterfront\nAmenities for work and wellness",
      featuresZh: "落地窗，采光充足\n灵活书房与充裕储物空间\n步行可达公共交通与湖滨\n工作与休闲配套齐全",
      amenitiesEn: "24-hour concierge\nFitness studio\nRooftop terrace",
      utilitiesEn: "Water included\nHydro paid by tenant",
      locationEn: "Waterfront\nUnion Station\nDining and shopping",
    },
    language: {mode: "english"}, typography: {style: "editorial"}, theme: {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"},
    focal: [.5, .5], preset: "poster",
    media: {
      heroDataUrl: "", heroName: "", heroType: "", gallery: [], floorplanDataUrl: "", floorplanName: "", floorplanType: "",
      floorplans: [
        {role: "furnished3d", name: "", type: "", dataUrl: "", fit: "contain", focal: [.5, .5], captionEn: "Furnished 3D plan", captionZh: "三维家具户型图", noteEn: "", noteZh: "", pixelWidth: 0, pixelHeight: 0},
        {role: "technical2d", name: "", type: "", dataUrl: "", fit: "contain", focal: [.5, .5], captionEn: "Technical 2D plan", captionZh: "二维技术户型图", noteEn: "", noteZh: "", pixelWidth: 0, pixelHeight: 0},
      ],
      portraitDataUrl: "", portraitName: "", portraitType: "", portraitFocal: [.5, .5],
      logoLightDataUrl: "", logoLightName: "", logoLightType: "", logoDarkDataUrl: "", logoDarkName: "", logoDarkType: "",
    },
    modules: {
      propertyFacts: [
        {id: "beds", icon: "bed", source: "listing.beds", labelEn: "Bedrooms", labelZh: "卧室", visible: true, priority: 1},
        {id: "baths", icon: "bath", source: "listing.baths", labelEn: "Bathrooms", labelZh: "卫浴", visible: true, priority: 2},
        {id: "area", icon: "ruler-measure", source: "listing.sqft", labelEn: "Approx. sq. ft.", labelZh: "约平方英尺", visible: true, priority: 3},
        {id: "floor", icon: "building-skyscraper", source: "listing.floor", labelEn: "Floor", labelZh: "楼层", visible: true, priority: 4},
        {id: "exposure", icon: "compass", source: "listing.exposure", labelEn: "Exposure", labelZh: "朝向", visible: true, priority: 5},
        {id: "balcony", icon: "building-community", source: "listing.balcony", labelEn: "Balcony", labelZh: "阳台", visible: true, priority: 6},
        {id: "parking", icon: "parking", source: "listing.parking", labelEn: "Parking", labelZh: "车位", visible: true, priority: 7},
      ],
      spotlights: [],
      leaseDetails: [
        {id: "term", labelEn: "Lease term", labelZh: "租期", valueEn: "12 months preferred", valueZh: "优先一年租期", state: "active"},
        {id: "availability", labelEn: "Available", labelZh: "可入住", valueEn: "Immediately", valueZh: "随时入住", state: "active"},
        {id: "deposit", labelEn: "Deposit", labelZh: "押金", valueEn: "Key deposit as stated", valueZh: "钥匙押金以填写内容为准", state: "active"},
        {id: "payment", labelEn: "Payment", labelZh: "付款", valueEn: "Payment schedule as stated", valueZh: "付款安排以填写内容为准", state: "active"},
        {id: "insurance", labelEn: "Insurance", labelZh: "保险", valueEn: "Tenant insurance required", valueZh: "需购买租客保险", state: "active"},
        {id: "keys", labelEn: "Keys", labelZh: "钥匙", valueEn: "1 locker included", valueZh: "含一个储物柜", state: "active"},
        {id: "pets", labelEn: "Pets", labelZh: "宠物", valueEn: "Building rules apply", valueZh: "须遵守大楼规定", state: "active"},
        {id: "smoking", labelEn: "Smoking", labelZh: "吸烟", valueEn: "No smoking", valueZh: "禁止吸烟", state: "active"},
        {id: "parking", labelEn: "Parking", labelZh: "停车", valueEn: "1 space included", valueZh: "含一个车位", state: "active"},
      ],
      includedCosts: [
        {id: "water", icon: "droplet", labelEn: "Water", labelZh: "水费", state: "included"},
        {id: "heat", icon: "flame", labelEn: "Heat", labelZh: "暖气", state: "included"},
        {id: "air-conditioning", icon: "snowflake", labelEn: "Air conditioning", labelZh: "中央空调", state: "included"},
        {id: "maintenance", icon: "tool", labelEn: "Maintenance", labelZh: "物业维护", state: "included"},
        {id: "insurance", icon: "shield-check", labelEn: "Building insurance", labelZh: "大楼保险", state: "included"},
      ],
      tenantPaidCosts: [
        {id: "hydro", icon: "bolt", labelEn: "Hydro", labelZh: "电费", state: "tenant-paid"},
        {id: "heat-pump-rental", icon: "receipt", labelEn: "Heat-pump rental", labelZh: "热泵租赁费", state: "tenant-paid"},
      ],
      amenities: [
        {id: "concierge", icon: "building-community", labelEn: "24-hour concierge", labelZh: "24 小时礼宾", state: "active"},
        {id: "fitness", icon: "tool", labelEn: "Fitness centre", labelZh: "健身中心", state: "active"},
        {id: "rooftop", icon: "building-skyscraper", labelEn: "Rooftop terrace", labelZh: "屋顶露台", state: "active"},
        {id: "party-room", icon: "building-bank", labelEn: "Party room", labelZh: "宴会厅", state: "active"},
        {id: "guest-suites", icon: "bed", labelEn: "Guest suites", labelZh: "访客套房", state: "active"},
        {id: "bike-storage", icon: "key", labelEn: "Bike storage", labelZh: "自行车存放", state: "active"},
        {id: "visitor-parking", icon: "parking", labelEn: "Visitor parking", labelZh: "访客停车", state: "active"},
      ],
      applicationRequirements: [
        {id: "credit-report", icon: "receipt", labelEn: "Credit report", labelZh: "信用报告", state: "required"},
        {id: "employment", icon: "building-bank", labelEn: "Proof of employment", labelZh: "工作证明", state: "required"},
        {id: "pay-stubs", icon: "receipt", labelEn: "Recent pay stubs", labelZh: "近期工资单", state: "required"},
        {id: "references", icon: "circle-check", labelEn: "References", labelZh: "推荐人资料", state: "conditional"},
      ],
    },
    compliance: {
      profileId: "lease", profile: null, disclaimer: Core.COMPLIANCE_PROFILES.lease.disclaimer,
      applicationRequirementsConfirmed: false,
      applicationDisclaimer: "Application requirements are informational only and do not promise acceptance or replace brokerage and legal review.",
    },
    mlsImport: {
      active: false, provider: {id: "", name: "", board: ""}, listingNumber: "", retrievedAt: "", sourceUpdatedAt: "",
      exactMatch: false, stale: false, status: "", fields: {}, images: [], missing: [], blocked: [],
      reviewConfirmed: false, reviewedAt: "", refresh: {sameListing: false, changes: [], requiresConfirmation: false},
    },
    template: {name: "Harbour Editorial Modular", version: "2.0.0", lockedFields: []},
    review: {status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null},
  };

  let state = Core.normalizeProject(DEFAULT_PROJECT, DEFAULT_PROJECT);
  Recovery.ensureProjectId(state);
  const images = {hero: null, portrait: null, logoLight: null, logoDark: null, gallery: [], floorplans: [], spotlights: [], icons: {}};
  const canvas = document.getElementById("poster-canvas");
  const status = document.getElementById("status");
  const focalPad = document.getElementById("focal-pad");
  const focalMarker = document.getElementById("focal-marker");
  const focalEmpty = document.getElementById("focal-empty");
  const focusX = document.getElementById("focus-x");
  const focusY = document.getElementById("focus-y");
  const recoveryPanel = document.getElementById("recovery-panel");
  const recoveryTitle = document.getElementById("recovery-title");
  const recoveryMessage = document.getElementById("recovery-message");
  const restoreDraftButton = document.getElementById("restore-draft");
  const discardDraftButton = document.getElementById("discard-draft");
  const downloadRecoveryButton = document.getElementById("download-recovery");
  const autosaveBar = document.querySelector(".autosave-bar");
  const autosaveState = document.getElementById("autosave-state");
  const encoder = new TextEncoder();
  const tabId = Recovery.newProjectId("tab");
  let draftStore = null;
  let recoveryChannel = null;
  let pendingSnapshot = null;
  let pendingRecoveryMode = "";
  let autosaveTimer = null;
  let autosaveEnabled = false;
  let dirtySinceSave = false;
  let lastSavedFingerprint = "";
  let stateRevision = 0;
  let persistedRevision = 0;
  let mlsContext = null;

  function setStatus(message) { status.textContent = message; }
  function invalidateMlsReview() {
    if (!state.mlsImport || !state.mlsImport.active) return;
    state.mlsImport.reviewConfirmed = false; state.mlsImport.reviewedAt = "";
  }
  function setAutosaveState(message, mode = "") {
    autosaveState.textContent = message;
    autosaveBar.classList.toggle("is-saved", mode === "saved");
    autosaveBar.classList.toggle("is-warning", mode === "warning");
  }
  function slug() {
    return (state.listing.address || "listing").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "listing";
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[character]));
  }
  function downloadBlob(blob, filename) {
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }
  function readFile(file, mode = "data") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(reader.result);
      mode === "text" ? reader.readAsText(file) : reader.readAsDataURL(file);
    });
  }
  function loadImage(source) {
    if (!source) return Promise.resolve(null);
    return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; });
  }
  function hexToRgb(hex) {
    const clean = String(hex).replace("#", ""); const value = Number.parseInt(clean, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  function rgba(hex, alpha) { return `rgba(${hexToRgb(hex).join(",")},${alpha})`; }
  function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fillStyle = fill; ctx.fill();
  }
  function typography() { return Core.activeTypography(state); }
  function fontFamily(language = state.language.mode) { return language === "english" ? typography().latin : typography().cjk; }
  function serifFamily() { return typography().serif; }
  function fitText(ctx, text, maxWidth, startSize, minSize, weight = 700, family = fontFamily()) {
    let size = startSize;
    do { ctx.font = `${weight} ${size}px ${family}`; if (ctx.measureText(String(text)).width <= maxWidth) return size; size -= 2; } while (size >= minSize);
    ctx.font = `${weight} ${minSize}px ${family}`; return minSize;
  }
  function wrapText(ctx, text, maxWidth, maxLines = 2) {
    const source = String(text || ""); const cjk = /[\u3400-\u9fff]/.test(source);
    const tokens = cjk ? Array.from(source) : source.split(/\s+/).filter(Boolean); const joiner = cjk ? "" : " ";
    const lines = []; let line = ""; let consumed = 0;
    for (const token of tokens) {
      const candidate = line ? `${line}${joiner}${token}` : token;
      if (ctx.measureText(candidate).width <= maxWidth || !line) { line = candidate; consumed += 1; }
      else { lines.push(line); line = token; consumed += 1; if (lines.length === maxLines - 1) break; }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (consumed < tokens.length && lines.length) {
      let last = lines[lines.length - 1];
      while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last}…`;
    }
    return lines;
  }
  function wrapTextAll(ctx, text, maxWidth) {
    const source = String(text || ""); const cjk = /[\u3400-\u9fff]/.test(source);
    const tokens = cjk ? Array.from(source) : source.split(/\s+/).filter(Boolean); const joiner = cjk ? "" : " ";
    const lines = []; let line = "";
    tokens.forEach(token => {
      if (!cjk && ctx.measureText(token).width > maxWidth) {
        if (line) { lines.push(line); line = ""; }
        let fragment = "";
        Array.from(token).forEach(character => {
          if (fragment && ctx.measureText(`${fragment}${character}`).width > maxWidth) { lines.push(fragment); fragment = character; }
          else fragment += character;
        });
        line = fragment; return;
      }
      const candidate = line ? `${line}${joiner}${token}` : token;
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = token; }
    });
    if (line) lines.push(line);
    return lines;
  }
  function formattedSavedTime(snapshot) {
    const date = new Date(Number(snapshot && snapshot.savedAtMs || 0));
    return Number.isNaN(date.getTime()) ? "unknown time / 未知时间" : date.toLocaleString();
  }
  function storageFailureMessage(error) {
    const name = String(error && error.name || "");
    if (name === "QuotaExceededError") return "Local recovery storage is full. Download the portable project now. / 本地恢复空间已满，请立即下载项目文件。";
    if (name === "SecurityError" || name === "InvalidStateError") return "This browser mode blocks local recovery storage. Download the portable project before leaving. / 当前浏览模式禁止本地恢复，请在离开前下载项目文件。";
    return `Local recovery is unavailable: ${error && error.message || "unknown storage error"} / 本地恢复不可用，请下载项目文件。`;
  }
  function hideRecoveryPanel() {
    recoveryPanel.hidden = true; recoveryPanel.classList.remove("is-warning", "is-conflict"); pendingSnapshot = null; pendingRecoveryMode = "";
  }
  function showRecoveryPanel(snapshot, mode = "recovery", customMessage = "") {
    pendingSnapshot = snapshot || null; pendingRecoveryMode = mode; recoveryPanel.hidden = false;
    recoveryPanel.classList.toggle("is-warning", mode === "warning"); recoveryPanel.classList.toggle("is-conflict", mode === "conflict");
    recoveryTitle.textContent = mode === "conflict" ? "Newer draft in another tab / 另一标签页有较新草稿" : mode === "warning" ? "Recovery needs attention / 恢复功能需要处理" : "Recover local draft / 恢复本地草稿";
    recoveryMessage.textContent = customMessage || `${snapshot.projectName} · ${formattedSavedTime(snapshot)} · ${snapshot.reason}`;
    const validation = snapshot ? Recovery.validateSnapshot(snapshot, {maxProjectSchemaVersion: Core.PROJECT_SCHEMA_VERSION}) : {ok: false};
    restoreDraftButton.hidden = !validation.ok; discardDraftButton.hidden = !snapshot; downloadRecoveryButton.hidden = !snapshot;
  }
  async function saveRecoverySnapshot(reason = "autosave", options = {}) {
    if (!draftStore || (!autosaveEnabled && !options.force)) return null;
    clearTimeout(autosaveTimer); autosaveTimer = null; Recovery.ensureProjectId(state);
    const snapshotRevision = stateRevision;
    const snapshot = Recovery.createSnapshot(projectPayload(), {reason, scrollY: window.scrollY, tabId});
    setAutosaveState("Saving locally… / 正在本地保存…");
    try {
      await draftStore.save(snapshot); persistedRevision = Math.max(persistedRevision, snapshotRevision); dirtySinceSave = stateRevision > persistedRevision; lastSavedFingerprint = Recovery.snapshotFingerprint(snapshot);
      setAutosaveState(dirtySinceSave ? "Newer changes are waiting to save… / 较新的修改正在等待保存…" : `Saved locally ${formattedSavedTime(snapshot)} / 已保存到本机`, dirtySinceSave ? "" : "saved");
      if (recoveryChannel) recoveryChannel.postMessage({type: "draft-saved", tabId, projectId: snapshot.projectId, savedAtMs: snapshot.savedAtMs});
      return snapshot;
    } catch (error) {
      dirtySinceSave = true; const message = storageFailureMessage(error); setAutosaveState(message, "warning"); showRecoveryPanel(null, "warning", message); return null;
    }
  }
  function scheduleAutosave() {
    stateRevision += 1; dirtySinceSave = stateRevision > persistedRevision; clearTimeout(autosaveTimer);
    if (!draftStore) return;
    if (!autosaveEnabled) { setAutosaveState("Saving is paused until the recovery choice is resolved. / 选择如何处理恢复草稿前，自动保存已暂停。", "warning"); return; }
    setAutosaveState("Unsaved changes… / 有尚未保存的修改…");
    autosaveTimer = setTimeout(() => { saveRecoverySnapshot("autosave"); }, 650);
  }
  async function prepareAction(reason, options = {}) {
    let snapshot = await saveRecoverySnapshot(reason, {force: true});
    if (dirtySinceSave) snapshot = await saveRecoverySnapshot(reason, {force: true});
    if (options.requireSaved && !snapshot) {
      setStatus("Action stopped because a local recovery copy could not be saved. Download the portable project, then try again. / 操作已停止：无法保存本地恢复副本。请先下载项目文件再重试。");
      return false;
    }
    return Boolean(snapshot);
  }
  async function restoreRecoverySnapshot(snapshot) {
    const validation = Recovery.validateSnapshot(snapshot, {maxProjectSchemaVersion: Core.PROJECT_SCHEMA_VERSION});
    if (!validation.ok) { showRecoveryPanel(snapshot, "warning", `${validation.error} Download a copy for manual recovery. / 版本不兼容，请下载副本进行人工恢复。`); return; }
    autosaveEnabled = false; state = Core.normalizeProject(snapshot.project, DEFAULT_PROJECT); Recovery.ensureProjectId(state);
    await hydrateImages(); syncControls(); render({autosave: false}); stateRevision = 0; persistedRevision = 0; dirtySinceSave = false; lastSavedFingerprint = Recovery.snapshotFingerprint(snapshot);
    hideRecoveryPanel(); autosaveEnabled = true; setAutosaveState(`Restored ${formattedSavedTime(snapshot)} / 已恢复该时间的草稿`, "saved"); setStatus("Local draft restored with its fields and recoverable media. / 本地草稿及可恢复图片已恢复。");
    requestAnimationFrame(() => window.scrollTo({top: Number(snapshot.scrollY || 0), behavior: "auto"}));
  }
  async function initializeRecovery() {
    try {
      draftStore = new Recovery.IndexedDbDraftStore(window.indexedDB); await draftStore.open();
      if (typeof BroadcastChannel === "function") {
        recoveryChannel = new BroadcastChannel(Recovery.CHANNEL_NAME);
        recoveryChannel.addEventListener("message", async event => {
          const message = event.data || {}; if (message.type !== "draft-saved" || message.tabId === tabId || message.projectId !== state.projectId) return;
          const snapshot = await draftStore.get(message.projectId); if (!snapshot || Recovery.snapshotFingerprint(snapshot) === lastSavedFingerprint) return;
          autosaveEnabled = false; showRecoveryPanel(snapshot, "conflict", `${snapshot.projectName} was saved at ${formattedSavedTime(snapshot)} in another tab. Restore it before editing here. / 另一标签页已保存较新版本，请先恢复再继续编辑。`);
          setAutosaveState("Paused to prevent a cross-tab overwrite. / 已暂停保存，避免覆盖另一标签页。", "warning");
        });
      }
      const latest = await draftStore.latest();
      if (latest) {
        const validation = Recovery.validateSnapshot(latest, {maxProjectSchemaVersion: Core.PROJECT_SCHEMA_VERSION});
        if (validation.ok) showRecoveryPanel(latest);
        else showRecoveryPanel(latest, "warning", `${validation.error} Download a copy before discarding it. / 该草稿版本不兼容，请先下载副本。`);
        setAutosaveState("Recovery choice required before editing. / 请先选择是否恢复草稿。", "warning");
      } else {
        autosaveEnabled = true; setAutosaveState("Autosave ready on this device. / 本机自动保存已就绪。", "saved");
      }
    } catch (error) {
      draftStore = null; autosaveEnabled = false; const message = storageFailureMessage(error);
      setAutosaveState(message, "warning"); showRecoveryPanel(null, "warning", message);
    }
  }
  function drawCover(ctx, image, x, y, width, height, focal = [.5, .5]) {
    if (!image) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "#9aaba8"); gradient.addColorStop(1, "#476260"); ctx.fillStyle = gradient; ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "rgba(255,255,255,.11)"; ctx.beginPath(); ctx.moveTo(x + width * .08, y + height * .78);
      ctx.lineTo(x + width * .38, y + height * .34); ctx.lineTo(x + width * .68, y + height * .78); ctx.closePath(); ctx.fill(); return;
    }
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight); const sourceW = width / scale; const sourceH = height / scale;
    const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceW, focal[0] * image.naturalWidth - sourceW / 2));
    const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceH, focal[1] * image.naturalHeight - sourceH / 2));
    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
  }
  function drawFittedImage(ctx, image, x, y, width, height, fit = "contain", focal = [.5, .5]) {
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, width, height);
    if (!image) return;
    if (fit === "crop") { drawCover(ctx, image, x, y, width, height, focal); return; }
    let scale = fit === "fit-width" ? width / image.naturalWidth : Math.min(width / image.naturalWidth, height / image.naturalHeight);
    let drawWidth = image.naturalWidth * scale; let drawHeight = image.naturalHeight * scale;
    if (fit === "fit-width" && drawHeight > height) {
      const sourceHeight = height / scale; const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, focal[1] * image.naturalHeight - sourceHeight / 2));
      ctx.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, x, y, width, height); return;
    }
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }
  function iconImage(name) { return images.icons[name] || images.icons.photo || null; }
  function drawIcon(ctx, name, x, y, size, background, foreground) {
    ctx.save(); ctx.fillStyle = background; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.fill();
    const icon = iconImage(name); if (icon) { ctx.globalCompositeOperation = "source-over"; ctx.drawImage(icon, x + size * .22, y + size * .22, size * .56, size * .56); }
    ctx.strokeStyle = foreground; ctx.lineWidth = Math.max(1, size * .025); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function moduleCopy(item, englishKey, chineseKey) { return localized(item[englishKey] || "", item[chineseKey] || ""); }
  function drawLogo(ctx, x, y, maxWidth, maxHeight, surface = "dark") {
    const image = surface === "light" ? (images.logoDark || images.logoLight) : (images.logoLight || images.logoDark);
    if (!image) return;
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1); const width = image.naturalWidth * scale; const height = image.naturalHeight * scale;
    ctx.drawImage(image, x + (maxWidth - width) / 2, y + (maxHeight - height) / 2, width, height);
  }
  function localized(english, chinese) {
    if (state.language.mode === "chinese") return chinese || english;
    if (state.language.mode === "bilingual") return chinese ? `${english} / ${chinese}` : english;
    return english;
  }
  function statusCopy() { return localized(state.listing.status, STATUS_ZH[state.listing.status] || state.listing.status); }
  function headlineCopy() { return localized(state.listing.headlineEn, state.listing.headlineZh); }
  function featureCopies() {
    const english = Core.list(state.content.featuresEn); const chinese = Core.list(state.content.featuresZh);
    if (state.language.mode === "english") return english;
    if (state.language.mode === "chinese") return chinese.length ? chinese : english;
    return english.map((item, index) => chinese[index] ? `${item} / ${chinese[index]}` : item);
  }
  function factLabel(english, chinese) { return localized(english, chinese); }
  function priceCopy() { return [state.listing.price, state.listing.rentPeriod].filter(Boolean).join(" "); }
  function drawHeadlineBlock(ctx, x, y, maxWidth, S) {
    const copy = Core.campaignCopy(state);
    if (state.language.mode !== "bilingual") {
      ctx.font = `700 ${48 * S}px ${fontFamily()}`;
      wrapText(ctx, headlineCopy(), maxWidth, 2).forEach((line, index) => ctx.fillText(line, x, y + index * 58 * S));
      return;
    }
    ctx.font = `750 ${40 * S}px ${fontFamily("english")}`;
    const english = wrapText(ctx, copy.english.headline, maxWidth, 2);
    english.forEach((line, index) => ctx.fillText(line, x, y + index * 48 * S));
    const chineseY = y + Math.max(1, english.length) * 48 * S + 14 * S;
    ctx.font = `650 ${34 * S}px ${fontFamily("chinese")}`;
    ctx.fillStyle = rgba(state.theme.ink, .82);
    wrapText(ctx, copy.chinese.headline || copy.english.headline, maxWidth, 2).forEach((line, index) => ctx.fillText(line, x, chineseY + index * 42 * S));
  }
  function drawFeatureBlock(ctx, x, y, maxWidth, S, index) {
    const copy = Core.campaignCopy(state);
    if (state.language.mode === "bilingual") {
      const english = copy.english.features[index] || ""; const chinese = copy.chinese.features[index] || "";
      ctx.font = `700 ${18 * S}px ${fontFamily("english")}`; ctx.fillStyle = state.theme.ink;
      wrapText(ctx, english, maxWidth, 2).forEach((line, lineIndex) => ctx.fillText(line, x, y + lineIndex * 23 * S));
      ctx.font = `600 ${18 * S}px ${fontFamily("chinese")}`; ctx.fillStyle = rgba(state.theme.ink, .76);
      wrapText(ctx, chinese || english, maxWidth, 2).forEach((line, lineIndex) => ctx.fillText(line, x, y + (52 + lineIndex * 23) * S));
      return;
    }
    const features = featureCopies(); const feature = features[index] || "";
    ctx.font = `700 ${22 * S}px ${fontFamily()}`; ctx.fillStyle = state.theme.ink;
    wrapText(ctx, feature, maxWidth, 2).forEach((line, lineIndex) => ctx.fillText(line, x, y + lineIndex * 28 * S));
  }

  function drawStatus(ctx, text, x, y, scale, theme) {
    fitText(ctx, text, 360 * scale, 24 * scale, 16 * scale, 800); const width = Math.min(400 * scale, ctx.measureText(text).width + 42 * scale);
    roundRect(ctx, x, y, width, 56 * scale, 28 * scale, theme.accent); ctx.fillStyle = theme.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + 21 * scale, y + 29 * scale); return width;
  }
  function drawPoster(target, preset = state.preset) {
    const [width, height] = PRESETS[preset]; target.width = width; target.height = height;
    const ctx = target.getContext("2d"); const theme = state.theme; const S = preset === "poster" ? width / 1800 : width / 1080;
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = theme.paper; ctx.fillRect(0, 0, width, height);
    if (preset === "poster") drawPrintPoster(ctx, width, height, S, theme);
    else if (preset === "landscape") drawLandscape(ctx, width, height, S, theme);
    else drawSocial(ctx, width, height, S, theme, preset);
    ctx.fillStyle = rgba(theme.ink, .23); ctx.font = `${Math.round(12 * S)}px ${fontFamily("english")}`; ctx.textAlign = "right";
    ctx.fillText(`Generated locally · ${state.template.name} ${state.template.version}`, width - 62 * S, height - 14 * S);
  }
  function drawFactsRibbon(ctx, width, top, height, S, theme, preset = "poster") {
    const facts = Core.resolvedPropertyFacts(state, preset); ctx.fillStyle = theme.ink; ctx.fillRect(0, top, width, height);
    if (!facts.length) return;
    facts.forEach((fact, index) => {
      const cellWidth = width / facts.length; const left = index * cellWidth; const center = left + cellWidth / 2;
      if (index) { ctx.fillStyle = rgba(theme.paper, .18); ctx.fillRect(left, top + 26 * S, Math.max(1, 1.5 * S), height - 52 * S); }
      const iconSize = Math.min(48 * S, cellWidth * .22); drawIcon(ctx, fact.icon, center - iconSize / 2, top + 23 * S, iconSize, theme.paper, rgba(theme.ink, .28));
      ctx.textAlign = "center"; ctx.fillStyle = theme.paper; fitText(ctx, fact.value, cellWidth - 20 * S, 27 * S, 15 * S, 800); ctx.fillText(fact.value, center, top + 101 * S);
      ctx.font = `700 ${12 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent;
      wrapText(ctx, moduleCopy(fact, "labelEn", "labelZh"), cellWidth - 18 * S, 2).forEach((line, lineIndex) => ctx.fillText(line, center, top + (126 + lineIndex * 15) * S));
    });
  }
  function drawModuleHeader(ctx, title, x, y, width, S, theme) {
    roundRect(ctx, x, y, width, 42 * S, 11 * S, theme.ink); ctx.fillStyle = theme.paper; ctx.textAlign = "left"; ctx.font = `800 ${15 * S}px ${fontFamily()}`;
    ctx.fillText(title, x + 18 * S, y + 27 * S);
  }
  function planEntries() {
    const interiors = (state.media.gallery || []).map((photo, index) => ({
      plan: {role: "interior", name: photo.name, dataUrl: photo.dataUrl, fit: "crop", focal: [.5, .5], captionEn: `Interior photo ${index + 1}`, captionZh: `室内照片 ${index + 1}`, noteEn: "", noteZh: ""},
      image: images.gallery[index],
    })).filter(item => item.plan.dataUrl).slice(0, 1);
    const plans = (state.media.floorplans || []).map((plan, index) => ({plan, image: images.floorplans[index]})).filter(item => item.plan.dataUrl || item.plan.name);
    return [...interiors, ...plans];
  }
  function spotlightEntries() {
    return (state.modules.spotlights || []).map((spotlight, index) => ({spotlight, image: images.spotlights[index]})).filter(item => item.spotlight.visible !== false && item.spotlight.dataUrl && (item.spotlight.titleEn || item.spotlight.titleZh));
  }
  function drawPlansModule(ctx, x, y, width, height, S, theme) {
    const entries = planEntries(); if (!entries.length) return;
    const includesInterior = entries.some(item => item.plan.role === "interior");
    drawModuleHeader(ctx, includesInterior ? localized("INTERIOR & SPACE PLANS", "室内照片与户型图") : localized("SPACE PLANS", "空间户型"), x, y, width, S, theme);
    const gap = 16 * S; const top = y + 54 * S; const cardWidth = (width - gap * (entries.length - 1)) / entries.length; const captionHeight = 52 * S; const imageHeight = height - 54 * S - captionHeight;
    entries.forEach(({plan, image}, index) => {
      const left = x + index * (cardWidth + gap); ctx.save(); ctx.strokeStyle = rgba(theme.ink, .22); ctx.lineWidth = 1.5 * S; ctx.strokeRect(left, top, cardWidth, imageHeight);
      drawFittedImage(ctx, image, left + 2 * S, top + 2 * S, cardWidth - 4 * S, imageHeight - 4 * S, plan.fit, plan.focal); ctx.restore();
      ctx.textAlign = "left"; ctx.fillStyle = theme.ink; ctx.font = `750 ${16 * S}px ${fontFamily()}`; const caption = moduleCopy(plan, "captionEn", "captionZh") || plan.name;
      wrapText(ctx, caption, cardWidth, 1).forEach(line => ctx.fillText(line, left, top + imageHeight + 22 * S));
      ctx.fillStyle = rgba(theme.ink, .62); ctx.font = `500 ${12 * S}px ${fontFamily()}`; const note = moduleCopy(plan, "noteEn", "noteZh");
      if (note) wrapText(ctx, note, cardWidth, 1).forEach(line => ctx.fillText(line, left, top + imageHeight + 42 * S));
    });
  }
  function drawSpotlightsModule(ctx, x, y, width, height, S, theme) {
    const entries = spotlightEntries(); if (!entries.length) return;
    drawModuleHeader(ctx, localized("FEATURE SPOTLIGHTS", "重点卖点"), x, y, width, S, theme);
    const gap = 18 * S; const top = y + 54 * S; const cardWidth = (width - gap * (entries.length - 1)) / entries.length;
    entries.forEach(({spotlight, image}, index) => {
      const left = x + index * (cardWidth + gap); const imageSize = Math.min(height - 64 * S, cardWidth * .34); const imageX = left; const imageY = top + 4 * S;
      ctx.save(); ctx.beginPath();
      if (spotlight.mask === "circle") ctx.arc(imageX + imageSize / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2);
      else if (spotlight.mask === "rounded") ctx.roundRect(imageX, imageY, imageSize, imageSize, 18 * S);
      else ctx.rect(imageX, imageY, imageSize, imageSize);
      ctx.clip(); drawCover(ctx, image, imageX, imageY, imageSize, imageSize, spotlight.focal); ctx.restore();
      const textX = imageX + imageSize + 14 * S; const textWidth = cardWidth - imageSize - 14 * S; ctx.textAlign = "left"; ctx.fillStyle = theme.ink; ctx.font = `800 ${17 * S}px ${fontFamily()}`;
      wrapText(ctx, moduleCopy(spotlight, "titleEn", "titleZh"), textWidth, 2).forEach((line, lineIndex) => ctx.fillText(line, textX, imageY + (22 + lineIndex * 21) * S));
      ctx.fillStyle = rgba(theme.ink, .7); ctx.font = `500 ${13 * S}px ${fontFamily()}`;
      wrapText(ctx, moduleCopy(spotlight, "detailEn", "detailZh"), textWidth, 3).forEach((line, lineIndex) => ctx.fillText(line, textX, imageY + (72 + lineIndex * 17) * S));
    });
  }
  function socialFactsCopy(preset) {
    return Core.resolvedPropertyFacts(state, preset).map(fact => `${fact.value} ${moduleCopy(fact, "labelEn", "labelZh")}`).join("  •  ");
  }
  function drawIconGridPanel(ctx, title, items, x, y, width, height, S, theme) {
    if (!items.length) return;
    drawModuleHeader(ctx, title, x, y, width, S, theme);
    const columns = width < 330 * S ? 2 : Math.min(3, Math.max(2, Math.ceil(items.length / 2))); const rows = Math.ceil(items.length / columns);
    const cellWidth = width / columns; const cellHeight = (height - 50 * S) / Math.max(1, rows); const dense = rows >= 4;
    items.forEach((item, index) => {
      const column = index % columns; const row = Math.floor(index / columns); const centerX = x + column * cellWidth + cellWidth / 2; const top = y + 50 * S + row * cellHeight;
      const iconSize = Math.min((dense ? 18 : 30) * S, cellHeight * (dense ? .26 : .38)); drawIcon(ctx, item.icon, centerX - iconSize / 2, top + 3 * S, iconSize, theme.paper, rgba(theme.ink, .3));
      ctx.fillStyle = theme.ink; ctx.textAlign = "center";
      const label = moduleCopy(item, "labelEn", "labelZh");
      if (dense) { fitText(ctx, label, cellWidth - 9 * S, 9 * S, 7 * S, 700, fontFamily()); ctx.fillText(label, centerX, top + iconSize + 13 * S); }
      else { ctx.font = `700 ${12 * S}px ${fontFamily()}`; wrapText(ctx, label, cellWidth - 9 * S, 2).forEach((line, lineIndex) => ctx.fillText(line, centerX, top + iconSize + (17 + lineIndex * 13) * S)); }
      if (item.state === "unknown") { ctx.fillStyle = theme.accent; ctx.font = `800 ${8 * S}px ${fontFamily()}`; ctx.fillText(localized("VERIFY", "待确认"), centerX, top + cellHeight - 4 * S); }
    });
  }
  function drawChecklistPanel(ctx, title, items, x, y, width, height, S, theme, formatter, options = {}) {
    if (!items.length) return;
    drawModuleHeader(ctx, title, x, y, width, S, theme); const columns = items.length > 6 ? 2 : 1; const rows = Math.ceil(items.length / columns); const columnWidth = width / columns; const rowHeight = (height - 51 * S) / Math.max(1, rows);
    items.forEach((item, index) => {
      const column = Math.floor(index / rows); const row = index % rows; const left = x + column * columnWidth; const rowY = y + 51 * S + row * rowHeight; const iconSize = Math.min(16 * S, rowHeight * .6);
      drawIcon(ctx, item.icon || "circle-check", left + 2 * S, rowY + 2 * S, iconSize, theme.paper, rgba(theme.ink, .3)); ctx.fillStyle = theme.ink; ctx.textAlign = "left";
      const text = formatter ? formatter(item) : moduleCopy(item, "labelEn", "labelZh"); const maxWidth = columnWidth - 27 * S;
      if (!options.multiline) { fitText(ctx, text, maxWidth, 13 * S, 9 * S, 650, fontFamily()); ctx.fillText(text, left + 24 * S, rowY + 15 * S); return; }
      let fontSize = 11 * S; let lines = []; const maxLines = Math.max(1, Math.floor((rowHeight - 5 * S) / (11 * S)));
      while (fontSize >= 8 * S) { ctx.font = `650 ${fontSize}px ${fontFamily()}`; lines = wrapTextAll(ctx, text, maxWidth); if (lines.length <= maxLines) break; fontSize -= S; }
      if (lines.length > maxLines) { fitText(ctx, text, maxWidth, 9 * S, 7 * S, 650, fontFamily()); ctx.fillText(text, left + 24 * S, rowY + Math.min(rowHeight - 3 * S, 13 * S)); return; }
      const lineHeight = Math.max(9 * S, fontSize + 1 * S); const blockHeight = lines.length * lineHeight; const firstBaseline = rowY + Math.max(lineHeight, (rowHeight - blockHeight) / 2 + lineHeight * .8);
      lines.forEach((line, lineIndex) => ctx.fillText(line, left + 24 * S, firstBaseline + lineIndex * lineHeight));
    });
  }
  function drawApplicationRequirementsPanel(ctx, items, x, y, width, height, S, theme) {
    const disclaimerHeight = 34 * S;
    drawChecklistPanel(ctx, localized("APPLICATION REQUIREMENTS", "申请要求"), items, x, y, width, height - disclaimerHeight, S, theme, item => `${item.state === "conditional" ? localized("If requested: ", "按需提供：") : ""}${moduleCopy(item, "labelEn", "labelZh")}`);
    ctx.fillStyle = rgba(theme.ink, .62); ctx.textAlign = "left"; ctx.font = `500 ${8 * S}px ${fontFamily()}`;
    const disclosure = localized("Informational only — not a promise of acceptance.", "仅供参考，不代表承诺获批。");
    wrapText(ctx, disclosure, width - 8 * S, 2).forEach((line, index) => ctx.fillText(line, x + 4 * S, y + height - (16 - index * 10) * S));
  }
  function drawInformationModules(ctx, x, y, width, height, S, theme) {
    const lease = Core.activeLeaseDetails(state); const included = Core.activeIncludedCosts(state); const tenant = Core.activeTenantPaidCosts(state);
    const amenities = Core.activeAmenities(state); const requirements = Core.activeApplicationRequirements(state); const gap = 14 * S;
    const topPanels = [
      lease.length ? {weight: 2.2, draw: (left, panelWidth, panelHeight) => drawChecklistPanel(ctx, localized("LEASE DETAILS", "租约详情"), lease, left, y, panelWidth, panelHeight, S, theme, item => `${moduleCopy(item, "labelEn", "labelZh")}: ${moduleCopy(item, "valueEn", "valueZh")}`, {multiline: true})} : null,
      included.length ? {weight: 1.25, draw: (left, panelWidth, panelHeight) => drawIconGridPanel(ctx, localized("RENT INCLUDES", "租金包含"), included, left, y, panelWidth, panelHeight, S, theme)} : null,
      tenant.length ? {weight: 1.25, draw: (left, panelWidth, panelHeight) => drawIconGridPanel(ctx, localized("TENANT PAYS", "租客承担"), tenant, left, y, panelWidth, panelHeight, S, theme)} : null,
    ].filter(Boolean);
    const bottomPanels = [
      amenities.length ? {draw: (left, top, panelWidth, panelHeight) => drawChecklistPanel(ctx, localized("AMENITIES", "楼宇设施"), amenities, left, top, panelWidth, panelHeight, S, theme)} : null,
      requirements.length ? {draw: (left, top, panelWidth, panelHeight) => drawApplicationRequirementsPanel(ctx, requirements, left, top, panelWidth, panelHeight, S, theme)} : null,
    ].filter(Boolean);
    if (!topPanels.length && !bottomPanels.length) return;
    const topHeight = topPanels.length && bottomPanels.length ? height * .57 : topPanels.length ? height : 0; const bottomTop = y + (topHeight ? topHeight + gap : 0); const bottomHeight = height - topHeight - (topHeight && bottomPanels.length ? gap : 0);
    if (topPanels.length) {
      const weights = topPanels.reduce((sum, panel) => sum + panel.weight, 0); const available = width - gap * (topPanels.length - 1); let left = x;
      topPanels.forEach((panel, index) => { const panelWidth = index === topPanels.length - 1 ? x + width - left : available * panel.weight / weights; panel.draw(left, panelWidth, topHeight); left += panelWidth + gap; });
    }
    if (bottomPanels.length) {
      const panelWidth = (width - gap * (bottomPanels.length - 1)) / bottomPanels.length;
      bottomPanels.forEach((panel, index) => panel.draw(x + index * (panelWidth + gap), bottomTop, panelWidth, bottomHeight));
    }
  }
  function agentInitials() {
    return String(state.contact.name || "Agent").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("");
  }
  function drawAgentFooter(ctx, x, y, width, height, S, theme) {
    roundRect(ctx, x, y, width, height, 22 * S, theme.ink); const padding = 28 * S; const portraitMode = state.contact.portraitMode || "none";
    const portraitSize = portraitMode === "none" ? 0 : 190 * S; let textX = x + padding;
    if (portraitSize) {
      const portraitX = x + padding; const portraitY = y + (height - portraitSize) / 2; ctx.save(); ctx.beginPath(); ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2); ctx.clip();
      if ((portraitMode === "photo" || portraitMode === "illustrated") && images.portrait) drawCover(ctx, images.portrait, portraitX, portraitY, portraitSize, portraitSize, state.media.portraitFocal || [.5, .5]);
      else { ctx.fillStyle = theme.accent; ctx.fillRect(portraitX, portraitY, portraitSize, portraitSize); ctx.fillStyle = theme.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `800 ${58 * S}px ${serifFamily()}`; ctx.fillText(agentInitials(), portraitX + portraitSize / 2, portraitY + portraitSize / 2); }
      ctx.restore(); ctx.strokeStyle = theme.accent; ctx.lineWidth = 5 * S; ctx.beginPath(); ctx.arc(portraitX + portraitSize / 2, portraitY + portraitSize / 2, portraitSize / 2, 0, Math.PI * 2); ctx.stroke(); textX += portraitSize + 28 * S;
    }
    const ctaWidth = 390 * S; const textWidth = x + width - padding - ctaWidth - 24 * S - textX; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = theme.accent; ctx.font = `600 ${15 * S}px ${fontFamily()}`; const tagline = localized(state.contact.taglineEn, state.contact.taglineZh); if (tagline) ctx.fillText(tagline, textX, y + 43 * S);
    ctx.fillStyle = theme.paper; fitText(ctx, state.contact.name, textWidth, 36 * S, 24 * S, 800, serifFamily()); ctx.fillText(state.contact.name, textX, y + 85 * S);
    const professionalLine = [state.contact.title, state.contact.license, state.brand.name].filter(Boolean).join(" · "); fitText(ctx, professionalLine, textWidth, 14 * S, 10 * S, 700, fontFamily()); ctx.fillStyle = rgba(theme.paper, .82); ctx.fillText(professionalLine, textX, y + 113 * S);
    ctx.font = `600 ${14 * S}px ${fontFamily("english")}`; ctx.fillStyle = theme.paper; ctx.fillText(state.contact.phone, textX, y + 148 * S); ctx.fillText(state.contact.email, textX, y + 174 * S);
    const website = state.contact.website || state.brand.website; if (website) ctx.fillText(website, textX, y + 200 * S);
    ctx.font = `500 ${9 * S}px ${fontFamily()}`; ctx.fillStyle = rgba(theme.paper, .67); const disclaimer = state.compliance.disclaimer || Core.activeComplianceProfile(state).disclaimer;
    wrapText(ctx, disclaimer, textWidth, 2).forEach((line, index) => ctx.fillText(line, textX, y + (234 + index * 12) * S));

    const ctaX = x + width - padding - ctaWidth; roundRect(ctx, ctaX, y + 24 * S, ctaWidth, height - 48 * S, 18 * S, theme.paper); drawLogo(ctx, ctaX + 24 * S, y + 42 * S, ctaWidth - 48 * S, 56 * S, "light");
    ctx.fillStyle = theme.ink; ctx.textAlign = "left"; ctx.font = `800 ${23 * S}px ${serifFamily()}`; wrapText(ctx, localized(state.contact.ctaTitleEn, state.contact.ctaTitleZh), ctaWidth - 48 * S, 2).forEach((line, index) => ctx.fillText(line, ctaX + 24 * S, y + (128 + index * 27) * S));
    ctx.font = `600 ${12 * S}px ${fontFamily()}`; ctx.fillStyle = rgba(theme.ink, .72); wrapText(ctx, localized(state.contact.ctaBodyEn, state.contact.ctaBodyZh), ctaWidth - 48 * S, 3).forEach((line, index) => ctx.fillText(line, ctaX + 24 * S, y + (196 + index * 16) * S));
  }
  function drawPrintPoster(ctx, width, height, S, theme) {
    const l = state.listing; const margin = 64 * S; const heroH = 560 * S;
    drawCover(ctx, images.hero, 0, 0, width, heroH, state.focal);
    const overlay = ctx.createLinearGradient(0, 0, 0, heroH); overlay.addColorStop(0, rgba(theme.ink, .08)); overlay.addColorStop(.55, rgba(theme.ink, .2)); overlay.addColorStop(1, rgba(theme.ink, .95));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, heroH); drawStatus(ctx, statusCopy(), margin, 62 * S, S, theme); drawLogo(ctx, width - 350 * S, 54 * S, 270 * S, 84 * S, "dark");
    ctx.fillStyle = theme.paper; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; fitText(ctx, l.address, width - 2 * margin, 84 * S, 44 * S, 800, serifFamily());
    ctx.fillText(l.address, margin, 350 * S); ctx.font = `700 ${31 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent;
    ctx.fillText(localized(`UNIT ${l.unit}`, `${l.unit} 室`), margin, 410 * S); fitText(ctx, priceCopy(), width - 2 * margin, 57 * S, 34 * S, 800);
    ctx.fillStyle = theme.paper; ctx.fillText(priceCopy(), margin, 515 * S); ctx.textAlign = "right"; ctx.font = `700 ${19 * S}px ${fontFamily("english")}`; ctx.fillText(`MLS® ${l.mls}`, width - margin, 514 * S);

    const factsTop = heroH; const factsH = 154 * S; drawFactsRibbon(ctx, width, factsTop, factsH, S, theme, "poster");

    const contentTop = factsTop + factsH; ctx.fillStyle = theme.paper; ctx.fillRect(0, contentTop, width, height - contentTop); ctx.textAlign = "left";
    ctx.fillStyle = theme.ink; ctx.font = `700 ${16 * S}px ${fontFamily()}`; ctx.fillText(localized("A REMARKABLE PLACE TO LIVE", "值得珍藏的理想居所"), margin, contentTop + 38 * S);
    drawHeadlineBlock(ctx, margin, contentTop + 88 * S, width - 2 * margin, S);
    const dividerY = contentTop + 164 * S; ctx.fillStyle = theme.accent; ctx.fillRect(margin, dividerY, width - 2 * margin, 3 * S);
    const copy = Core.campaignCopy(state); const featureCount = Math.min(4, state.language.mode === "chinese" ? (copy.chinese.features.length || copy.english.features.length) : copy.english.features.length);
    const visibleFeatureCount = featureCount; const featureY = dividerY + 30 * S;
    Array.from({length: visibleFeatureCount}).forEach((_, index) => {
      const gap = 24 * S; const colW = (width - 2 * margin - gap * (visibleFeatureCount - 1)) / visibleFeatureCount; const x = margin + index * (colW + gap);
      drawFeatureBlock(ctx, x, featureY, colW, S, index);
    });

    let moduleY = featureY + (state.language.mode === "bilingual" ? 112 : 68) * S; const moduleWidth = width - 2 * margin; const sectionGap = 14 * S;
    const plansHeight = (state.language.mode === "bilingual" ? 260 : 286) * S;
    if (planEntries().length) { drawPlansModule(ctx, margin, moduleY, moduleWidth, plansHeight, S, theme); moduleY += plansHeight + sectionGap; }
    if (spotlightEntries().length) { drawSpotlightsModule(ctx, margin, moduleY, moduleWidth, 140 * S, S, theme); moduleY += 140 * S + sectionGap; }
    const footerY = 2040 * S; drawInformationModules(ctx, margin, moduleY, moduleWidth, footerY - moduleY - 16 * S, S, theme);
    drawAgentFooter(ctx, margin, footerY, moduleWidth, 292 * S, S, theme);
  }
  function compactResponsibilityCopy(preset) {
    if (preset !== "portrait" && preset !== "story") return "";
    const included = Core.activeIncludedCosts(state).slice(0, 2).map(item => moduleCopy(item, "labelEn", "labelZh"));
    const tenant = Core.activeTenantPaidCosts(state).slice(0, 2).map(item => moduleCopy(item, "labelEn", "labelZh"));
    const parts = [];
    if (included.length) parts.push(`${localized("Includes", "包含")}: ${included.join(", ")}`);
    if (tenant.length) parts.push(`${localized("Tenant pays", "租客承担")}: ${tenant.join(", ")}`);
    return parts.join("  •  ");
  }
  function drawSocial(ctx, width, height, S, theme, preset) {
    const l = state.listing; drawCover(ctx, images.hero, 0, 0, width, height, state.focal);
    const overlay = ctx.createLinearGradient(0, height * .1, 0, height); overlay.addColorStop(0, rgba(theme.ink, .04)); overlay.addColorStop(.42, rgba(theme.ink, .24)); overlay.addColorStop(1, rgba(theme.ink, .97));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, height); const margin = 60 * S; drawStatus(ctx, statusCopy(), margin, 54 * S, S, theme); drawLogo(ctx, width - 305 * S, 45 * S, 245 * S, 72 * S, "dark");
    const bottom = height - 198 * S; ctx.textAlign = "left"; ctx.fillStyle = theme.paper; fitText(ctx, l.address, width - 2 * margin, 60 * S, 34 * S, 800, serifFamily());
    const addressLines = wrapText(ctx, l.address, width - 2 * margin, 2); const lineH = 66 * S;
    addressLines.forEach((line, index) => ctx.fillText(line, margin, bottom - (addressLines.length - index) * lineH - 108 * S));
    ctx.font = `800 ${34 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; ctx.fillText(localized(`UNIT ${l.unit}`, `${l.unit} 室`), margin, bottom - 82 * S);
    fitText(ctx, priceCopy(), width - 2 * margin, 54 * S, 32 * S, 800); ctx.fillStyle = theme.paper; ctx.fillText(priceCopy(), margin, bottom);
    ctx.font = `700 ${16 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent;
    const facts = socialFactsCopy(preset); fitText(ctx, facts, width - 2 * margin, 16 * S, 10 * S, 700, fontFamily()); ctx.fillText(facts, margin, bottom + 38 * S);
    const responsibility = compactResponsibilityCopy(preset); if (responsibility) { ctx.fillStyle = theme.paper; fitText(ctx, responsibility, width - 2 * margin, 12 * S, 8 * S, 600, fontFamily()); ctx.fillText(responsibility, margin, bottom + 66 * S); }
    ctx.fillStyle = theme.ink; ctx.fillRect(0, height - 116 * S, width, 116 * S); ctx.font = `800 ${22 * S}px ${fontFamily()}`; ctx.fillStyle = theme.paper; ctx.fillText(state.contact.name, margin, height - 63 * S);
    ctx.textAlign = "right"; fitText(ctx, state.contact.phone, width * .42, 20 * S, 14 * S, 600, fontFamily("english")); ctx.fillText(state.contact.phone, width - margin, height - 63 * S);
  }
  function drawLandscape(ctx, width, height, S, theme) {
    const l = state.listing; drawCover(ctx, images.hero, 0, 0, width, height, state.focal); ctx.fillStyle = rgba(theme.ink, .95);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width * .69, 0); ctx.lineTo(width * .57, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
    const margin = 60 * S; drawStatus(ctx, statusCopy(), margin, 36 * S, S, theme); ctx.textAlign = "left"; ctx.fillStyle = theme.paper;
    fitText(ctx, l.address, 570 * S, 50 * S, 30 * S, 800, serifFamily()); wrapText(ctx, l.address, 570 * S, 2).forEach((line, index) => ctx.fillText(line, margin, (175 + index * 56) * S));
    ctx.font = `800 ${32 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; ctx.fillText(localized(`UNIT ${l.unit}`, `${l.unit} 室`), margin, 302 * S);
    fitText(ctx, priceCopy(), 570 * S, 52 * S, 31 * S, 800); ctx.fillStyle = theme.paper; ctx.fillText(priceCopy(), margin, 390 * S);
    ctx.font = `700 ${16 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; const facts = socialFactsCopy("landscape"); fitText(ctx, facts, 570 * S, 16 * S, 10 * S, 700, fontFamily()); ctx.fillText(facts, margin, 448 * S);
    ctx.fillStyle = theme.ink; ctx.fillRect(0, height - 82 * S, width, 82 * S); ctx.font = `800 ${19 * S}px ${fontFamily()}`; ctx.fillStyle = theme.paper; ctx.fillText(`${state.contact.name}  •  ${state.contact.phone}`, margin, height - 42 * S);
    drawLogo(ctx, width - 300 * S, 32 * S, 240 * S, 72 * S, "dark");
  }

  function updateArtworkDescription() {
    const facts = Core.resolvedPropertyFacts(state, state.preset).map(fact => `${moduleCopy(fact, "labelEn", "labelZh")}: ${fact.value}`);
    const plans = Core.activeFloorPlans(state).map(plan => moduleCopy(plan, "captionEn", "captionZh") || plan.name);
    const spots = Core.activeSpotlights(state).map(item => moduleCopy(item, "titleEn", "titleZh"));
    const tenantCosts = Core.activeTenantPaidCosts(state).map(item => moduleCopy(item, "labelEn", "labelZh"));
    const amenities = Core.activeAmenities(state).map(item => moduleCopy(item, "labelEn", "labelZh"));
    const requirements = Core.activeApplicationRequirements(state).map(item => moduleCopy(item, "labelEn", "labelZh"));
    document.getElementById("artwork-description").textContent = [
      `${statusCopy()} ${state.listing.address}, unit ${state.listing.unit}, ${priceCopy()}.`,
      facts.length ? `Property facts: ${facts.join("; ")}.` : "",
      plans.length ? `Floor plans: ${plans.join("; ")}.` : "",
      spots.length ? `Feature spotlights: ${spots.join("; ")}.` : "",
      tenantCosts.length ? `Tenant-paid costs: ${tenantCosts.join("; ")}.` : "",
      amenities.length ? `Amenities: ${amenities.join("; ")}.` : "",
      requirements.length ? `Application requirements: ${requirements.join("; ")}.` : "",
      `Agent contact: ${state.contact.name}, ${state.contact.phone}, ${state.contact.email}.`,
    ].filter(Boolean).join(" ");
  }
  function renderMlsImport() {
    const connected = Boolean(mlsContext && mlsContext.provider); const imported = state.mlsImport || {};
    document.getElementById("mls-provider-context").textContent = connected
      ? `${mlsContext.provider.name} · ${mlsContext.provider.board} · ${mlsContext.mode}`
      : "Not connected / 尚未连接";
    document.getElementById("mls-generate").disabled = !connected;
    const numberInput = document.getElementById("mls-number");
    if (imported.active && document.activeElement !== numberInput && !numberInput.value) numberInput.value = imported.listingNumber || "";
    const completeness = Core.mlsCompleteness(state); const summary = document.getElementById("mls-completeness");
    if (!imported.active) {
      summary.className = "validation-summary"; summary.innerHTML = "<strong>Manual workspace</strong>No authorized listing has been imported. / 尚未导入获授权房源。";
    } else {
      summary.className = `validation-summary ${completeness.blocked ? "is-blocked" : imported.stale || completeness.missing ? "has-warnings" : "is-ready"}`;
      const changes = imported.refresh && imported.refresh.changes ? imported.refresh.changes.length : 0;
      summary.innerHTML = `<strong>${escapeHtml(imported.provider.name)} · ${escapeHtml(imported.provider.board)} · ${escapeHtml(imported.listingNumber)}</strong>
        Imported ${completeness.imported} · Missing ${completeness.missing} · Stale ${completeness.stale} · Overridden ${completeness.overridden} · Blocked ${completeness.blocked}${changes ? ` · Refresh changes ${changes}` : ""}<br>
        获取 ${escapeHtml(imported.retrievedAt)} · 状态 ${escapeHtml(imported.status)}`;
    }
    const blocked = (imported.images || []).filter(image => !image.replaced && !image.confirmed && image.reuseAllowed !== true); const rights = document.getElementById("mls-rights");
    rights.innerHTML = blocked.map(image => `<div class="module-card mls-rights-row">
      <span><strong>${escapeHtml(image.sourceId)}</strong><small>${escapeHtml(image.role)} · rights: ${escapeHtml(image.rightsStatus)}</small></span>
      ${image.rightsStatus === "denied" ? "" : `<button class="button button-quiet" type="button" data-mls-rights="confirm" data-source-id="${escapeHtml(image.sourceId)}">Confirm rights / 确认权利</button>`}
      <button class="button button-quiet" type="button" data-mls-rights="replace" data-source-id="${escapeHtml(image.sourceId)}">Use local replacement / 使用本地替代图</button>
    </div>`).join("");
    const review = document.getElementById("mls-review-confirmed"); review.disabled = !imported.active || blocked.length > 0; review.checked = Boolean(imported.reviewConfirmed);
  }
  function render(options = {}) { drawPoster(canvas); updateArtworkDescription(); renderMlsImport(); updateValidation(); updateChangeSummary(); if (options.autosave !== false) scheduleAutosave(); }
  function mediaDescriptors() {
    const output = [];
    if (state.media.heroDataUrl || state.media.heroName) output.push({kind: "hero", name: state.media.heroName || "Hero photo", dataUrl: state.media.heroDataUrl});
    if (state.media.portraitDataUrl || state.media.portraitName) output.push({kind: "portrait", name: state.media.portraitName || "Agent portrait", dataUrl: state.media.portraitDataUrl});
    state.media.gallery.forEach((item, index) => output.push({kind: "gallery", index, name: item.name || `Interior ${index + 1}`, dataUrl: item.dataUrl}));
    if (state.media.logoLightDataUrl || state.media.logoLightName) output.push({kind: "logoLight", name: state.media.logoLightName || "Light logo", dataUrl: state.media.logoLightDataUrl});
    if (state.media.logoDarkDataUrl || state.media.logoDarkName) output.push({kind: "logoDark", name: state.media.logoDarkName || "Dark logo", dataUrl: state.media.logoDarkDataUrl});
    return output;
  }
  function renderMediaList() {
    const container = document.getElementById("media-list"); const items = mediaDescriptors();
    if (!items.length) { container.innerHTML = '<div class="field-note">No local media selected. Paths imported from YAML must be reselected in the browser.</div>'; return; }
    container.innerHTML = items.map(item => {
      const gallery = item.kind === "gallery"; const label = gallery ? `Interior ${item.index + 1}` : ({hero: "Hero", portrait: "Agent portrait", logoLight: "Light logo", logoDark: "Dark logo"}[item.kind]);
      return `<div class="media-row" data-kind="${item.kind}" data-index="${item.index == null ? "" : item.index}">
        ${item.dataUrl ? `<img src="${item.dataUrl}" alt="">` : '<span class="media-placeholder" aria-hidden="true"></span>'}
        <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(item.name)}${item.dataUrl ? "" : " · reselect file"}</small></span>
        <span class="media-row-actions">${gallery ? `<button class="icon-button" data-action="up" title="Move up" ${item.index === 0 ? "disabled" : ""}>↑</button><button class="icon-button" data-action="down" title="Move down" ${item.index === state.media.gallery.length - 1 ? "disabled" : ""}>↓</button><button class="icon-button" data-action="replace" title="Replace">↻</button>` : ""}<button class="icon-button" data-action="remove" title="Remove">×</button></span>
      </div>`;
    }).join("");
  }
  function moduleActions(collection, index, count, removable = true) {
    return `<span class="module-actions">
      <button class="icon-button" type="button" data-module-action="up" data-collection="${collection}" data-index="${index}" title="Move up" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="icon-button" type="button" data-module-action="down" data-collection="${collection}" data-index="${index}" title="Move down" ${index === count - 1 ? "disabled" : ""}>↓</button>
      ${removable ? `<button class="icon-button" type="button" data-module-action="remove" data-collection="${collection}" data-index="${index}" title="Remove">×</button>` : ""}
    </span>`;
  }
  function option(value, selected, label = value) { return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`; }
  function iconOptions(selected) { return ICON_NAMES.map(name => option(name, selected, name.replaceAll("-", " "))).join(""); }
  function renderFactsEditor() {
    const container = document.getElementById("facts-editor"); const facts = state.modules.propertyFacts;
    container.innerHTML = facts.length ? facts.map((fact, index) => {
      const value = fact.source ? Core.getPath(state, fact.source) : fact.value;
      return `<div class="module-card">
        <div class="module-card-header"><strong>${escapeHtml(fact.labelEn || `Fact ${index + 1}`)}</strong>${moduleActions("propertyFacts", index, facts.length)}</div>
        <div class="module-card-grid">
          <label>English label<input data-collection="propertyFacts" data-index="${index}" data-field="labelEn" value="${escapeHtml(fact.labelEn || "")}"></label>
          <label>中文标签<input lang="zh-Hans" data-collection="propertyFacts" data-index="${index}" data-field="labelZh" value="${escapeHtml(fact.labelZh || "")}"></label>
          ${fact.source ? `<label>Shared listing value<input value="${escapeHtml(value || "")}" disabled><small>${escapeHtml(fact.source)}</small></label>` : `<label>Shared value<input data-collection="propertyFacts" data-index="${index}" data-field="value" value="${escapeHtml(fact.value || "")}"></label>`}
          <label>Icon<select data-collection="propertyFacts" data-index="${index}" data-field="icon">${iconOptions(fact.icon)}</select></label>
          <label>Social priority<input type="number" min="1" max="8" data-collection="propertyFacts" data-index="${index}" data-field="priority" value="${Number(fact.priority || index + 1)}"></label>
          <label class="module-toggle"><input type="checkbox" data-collection="propertyFacts" data-index="${index}" data-field="visible" ${fact.visible !== false ? "checked" : ""}> Show this fact</label>
        </div>
      </div>`;
    }).join("") : '<div class="module-empty">No facts selected. Add a custom fact to rebuild the ribbon.</div>';
    document.getElementById("add-custom-fact").disabled = facts.length >= Core.MODULE_LIMITS.propertyFacts;
  }
  function renderPlansEditor() {
    const container = document.getElementById("plans-editor"); const plans = state.media.floorplans || [];
    const cards = plans.map((plan, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${plan.role === "technical2d" ? "Technical 2D plan" : "Furnished 3D plan"}</strong>${moduleActions("floorplans", index, plans.length)}</div>
      <div class="module-card-grid">
        ${plan.dataUrl ? `<img class="module-thumb span-2" src="${plan.dataUrl}" alt="${escapeHtml(plan.captionEn || plan.name || "Floor plan")}">` : ""}
        <label class="inline-upload span-2">${plan.dataUrl ? "Replace image" : "Choose local image"}<input type="file" data-module-file="floorplans" data-index="${index}" accept="image/jpeg,image/png,image/webp"></label>
        <label>Plan role<select data-collection="floorplans" data-index="${index}" data-field="role">${option("furnished3d", plan.role, "Furnished 3D")}${option("technical2d", plan.role, "Technical 2D")}</select></label>
        <label>Image treatment<select data-collection="floorplans" data-index="${index}" data-field="fit">${option("contain", plan.fit, "Contain")}${option("fit-width", plan.fit, "Fit width")}${option("crop", plan.fit, "Crop")}</select></label>
        <label>English caption<input data-collection="floorplans" data-index="${index}" data-field="captionEn" value="${escapeHtml(plan.captionEn || "")}"></label>
        <label>中文说明<input lang="zh-Hans" data-collection="floorplans" data-index="${index}" data-field="captionZh" value="${escapeHtml(plan.captionZh || "")}"></label>
        <label>English source / measurement note<input data-collection="floorplans" data-index="${index}" data-field="noteEn" value="${escapeHtml(plan.noteEn || "")}"></label>
        <label>中文来源 / 尺寸备注<input lang="zh-Hans" data-collection="floorplans" data-index="${index}" data-field="noteZh" value="${escapeHtml(plan.noteZh || "")}"></label>
        <label>Horizontal focus<input type="range" min="0" max="100" data-collection="floorplans" data-index="${index}" data-field="focalX" value="${Math.round((plan.focal || [.5, .5])[0] * 100)}"></label>
        <label>Vertical focus<input type="range" min="0" max="100" data-collection="floorplans" data-index="${index}" data-field="focalY" value="${Math.round((plan.focal || [.5, .5])[1] * 100)}"></label>
      </div>
      ${plan.pixelWidth ? `<p class="field-note">${plan.pixelWidth} × ${plan.pixelHeight} px · stored locally</p>` : ""}
    </div>`).join("");
    const add = plans.length < Core.MODULE_LIMITS.floorPlans ? '<button class="button button-quiet" type="button" data-module-action="add-plan">Add floor-plan slot</button>' : "";
    container.innerHTML = cards || '<div class="module-empty">No plan slots. Add one when a plan is available.</div>'; container.insertAdjacentHTML("beforeend", add);
  }
  function renderSpotlightsEditor() {
    const container = document.getElementById("spotlights-editor"); const items = state.modules.spotlights;
    container.innerHTML = items.length ? items.map((item, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${escapeHtml(item.titleEn || `Feature spotlight ${index + 1}`)}</strong>${moduleActions("spotlights", index, items.length)}</div>
      <div class="module-card-grid">
        ${item.dataUrl ? `<img class="module-thumb span-2" src="${item.dataUrl}" alt="${escapeHtml(item.titleEn || item.name || "Feature spotlight")}">` : ""}
        <label class="inline-upload span-2">${item.dataUrl ? "Replace image" : "Choose local image"}<input type="file" data-module-file="spotlights" data-index="${index}" accept="image/jpeg,image/png,image/webp"></label>
        <label>English title<input data-collection="spotlights" data-index="${index}" data-field="titleEn" value="${escapeHtml(item.titleEn || "")}"></label>
        <label>中文标题<input lang="zh-Hans" data-collection="spotlights" data-index="${index}" data-field="titleZh" value="${escapeHtml(item.titleZh || "")}"></label>
        <label class="span-2">English detail<textarea rows="2" data-collection="spotlights" data-index="${index}" data-field="detailEn">${escapeHtml(item.detailEn || "")}</textarea></label>
        <label class="span-2">中文详情<textarea rows="2" lang="zh-Hans" data-collection="spotlights" data-index="${index}" data-field="detailZh">${escapeHtml(item.detailZh || "")}</textarea></label>
        <label>Image mask<select data-collection="spotlights" data-index="${index}" data-field="mask">${option("circle", item.mask, "Circle")}${option("rounded", item.mask, "Rounded square")}${option("rectangle", item.mask, "Rectangle")}</select></label>
        <label class="module-toggle"><input type="checkbox" data-collection="spotlights" data-index="${index}" data-field="visible" ${item.visible !== false ? "checked" : ""}> Show this callout</label>
        <label>Horizontal focus<input type="range" min="0" max="100" data-collection="spotlights" data-index="${index}" data-field="focalX" value="${Math.round((item.focal || [.5, .5])[0] * 100)}"></label>
        <label>Vertical focus<input type="range" min="0" max="100" data-collection="spotlights" data-index="${index}" data-field="focalY" value="${Math.round((item.focal || [.5, .5])[1] * 100)}"></label>
      </div>
    </div>`).join("") : '<div class="module-empty">No feature spotlights. Add one when you have a differentiating image and reviewed copy.</div>';
    document.getElementById("add-spotlight").disabled = items.length >= Core.MODULE_LIMITS.spotlights;
  }
  function renderLeaseEditor() {
    const container = document.getElementById("lease-editor"); const items = state.modules.leaseDetails;
    container.innerHTML = items.length ? items.map((item, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${escapeHtml(item.labelEn || `Lease row ${index + 1}`)}</strong>${moduleActions("leaseDetails", index, items.length)}</div>
      <div class="module-card-grid">
        <label>English label<input maxlength="58" data-collection="leaseDetails" data-index="${index}" data-field="labelEn" value="${escapeHtml(item.labelEn || "")}"></label>
        <label>中文标签<input maxlength="58" lang="zh-Hans" data-collection="leaseDetails" data-index="${index}" data-field="labelZh" value="${escapeHtml(item.labelZh || "")}"></label>
        <label>English value<input maxlength="58" data-collection="leaseDetails" data-index="${index}" data-field="valueEn" value="${escapeHtml(item.valueEn || "")}"></label>
        <label>中文内容<input maxlength="58" lang="zh-Hans" data-collection="leaseDetails" data-index="${index}" data-field="valueZh" value="${escapeHtml(item.valueZh || "")}"></label>
        <label>Row state<select data-collection="leaseDetails" data-index="${index}" data-field="state">${option("active", item.state, "Active")}${option("not-applicable", item.state, "Not applicable")}${option("hidden", item.state, "Hidden")}</select></label>
      </div>
    </div>`).join("") : '<div class="module-empty">No lease details. Sale campaigns collapse this module automatically.</div>';
    document.getElementById("add-lease-detail").disabled = items.length >= Core.MODULE_LIMITS.leaseDetails;
  }
  function renderCostEditor(containerId, collectionName, itemName, emptyText, buttonId) {
    const container = document.getElementById(containerId); const items = state.modules[collectionName];
    container.innerHTML = items.length ? items.map((item, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${escapeHtml(item.labelEn || `${itemName} ${index + 1}`)}</strong>${moduleActions(collectionName, index, items.length)}</div>
      <div class="module-card-grid">
        <label>English label<input data-collection="${collectionName}" data-index="${index}" data-field="labelEn" value="${escapeHtml(item.labelEn || "")}"></label>
        <label>中文标签<input lang="zh-Hans" data-collection="${collectionName}" data-index="${index}" data-field="labelZh" value="${escapeHtml(item.labelZh || "")}"></label>
        <label>Icon<select data-collection="${collectionName}" data-index="${index}" data-field="icon">${iconOptions(item.icon)}</select></label>
        <label>Responsibility state<select data-collection="${collectionName}" data-index="${index}" data-field="state">${option(collectionName === "includedCosts" ? "included" : "tenant-paid", item.state, collectionName === "includedCosts" ? "Included" : "Tenant paid")}${option("unknown", item.state, "Unknown — verify")}${option("hidden", item.state, "Hidden")}</select></label>
      </div>
    </div>`).join("") : `<div class="module-empty">${escapeHtml(emptyText)}</div>`;
    document.getElementById(buttonId).disabled = items.length >= Core.MODULE_LIMITS[collectionName];
  }
  function renderAmenitiesEditor() {
    const items = state.modules.amenities; const container = document.getElementById("amenities-editor");
    container.innerHTML = items.length ? items.map((item, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${escapeHtml(item.labelEn || `Amenity ${index + 1}`)}</strong>${moduleActions("amenities", index, items.length)}</div>
      <div class="module-card-grid">
        <label>English label<input data-collection="amenities" data-index="${index}" data-field="labelEn" value="${escapeHtml(item.labelEn || "")}"></label>
        <label>中文标签<input lang="zh-Hans" data-collection="amenities" data-index="${index}" data-field="labelZh" value="${escapeHtml(item.labelZh || "")}"></label>
        <label>Icon<select data-collection="amenities" data-index="${index}" data-field="icon">${iconOptions(item.icon)}</select></label>
        <label>State<select data-collection="amenities" data-index="${index}" data-field="state">${option("active", item.state, "Active")}${option("hidden", item.state, "Hidden")}</select></label>
      </div>
    </div>`).join("") : '<div class="module-empty">No amenities selected. The poster will remove this panel.</div>';
    document.getElementById("add-amenity").disabled = items.length >= Core.MODULE_LIMITS.amenities;
  }
  function renderRequirementsEditor() {
    const items = state.modules.applicationRequirements; const container = document.getElementById("requirements-editor");
    container.innerHTML = items.length ? items.map((item, index) => `<div class="module-card">
      <div class="module-card-header"><strong>${escapeHtml(item.labelEn || `Requirement ${index + 1}`)}</strong>${moduleActions("applicationRequirements", index, items.length)}</div>
      <div class="module-card-grid">
        <label>English wording<input data-collection="applicationRequirements" data-index="${index}" data-field="labelEn" value="${escapeHtml(item.labelEn || "")}"></label>
        <label>中文内容<input lang="zh-Hans" data-collection="applicationRequirements" data-index="${index}" data-field="labelZh" value="${escapeHtml(item.labelZh || "")}"></label>
        <label>Checklist icon<select data-collection="applicationRequirements" data-index="${index}" data-field="icon">${iconOptions(item.icon)}</select></label>
        <label>Requirement state<select data-collection="applicationRequirements" data-index="${index}" data-field="state">${option("required", item.state, "Required")}${option("conditional", item.state, "Conditional")}${option("hidden", item.state, "Hidden")}</select></label>
      </div>
    </div>`).join("") : '<div class="module-empty">No application requirements selected. The poster will remove this panel.</div>';
    document.getElementById("add-requirement").disabled = items.length >= Core.MODULE_LIMITS.applicationRequirements;
  }
  function renderModuleEditors() {
    renderFactsEditor(); renderPlansEditor(); renderSpotlightsEditor(); renderLeaseEditor();
    renderCostEditor("costs-editor", "includedCosts", "Included cost", "No rent inclusions selected. The poster will remove this panel.", "add-included-cost");
    renderCostEditor("tenant-costs-editor", "tenantPaidCosts", "Tenant-paid cost", "No tenant-paid costs selected. The poster will remove this panel.", "add-tenant-cost");
    renderAmenitiesEditor(); renderRequirementsEditor();
  }
  function updateFocalUI() {
    const x = Math.round(state.focal[0] * 100); const y = Math.round(state.focal[1] * 100);
    focusX.value = x; focusY.value = y; document.getElementById("focus-x-output").value = `${x}%`; document.getElementById("focus-y-output").value = `${y}%`;
    focalMarker.style.left = `${x}%`; focalMarker.style.top = `${y}%`;
    focalPad.style.backgroundImage = state.media.heroDataUrl ? `linear-gradient(rgba(16,44,43,.08),rgba(16,44,43,.08)),url("${state.media.heroDataUrl}")` : "";
    focalMarker.style.display = state.media.heroDataUrl ? "block" : "none"; focalEmpty.hidden = Boolean(state.media.heroDataUrl);
  }
  function syncControls() {
    document.querySelectorAll("[data-path]").forEach(input => {
      const value = Core.getPath(state, input.dataset.path); if (value == null) return;
      if (input.type === "checkbox") input.checked = Boolean(value); else input.value = value;
    });
    const profileSelect = document.getElementById("compliance-profile"); const customProfile = state.compliance.profile;
    if (customProfile && ![...profileSelect.options].some(option => option.value === state.compliance.profileId)) {
      const option = new Option(customProfile.name || "Custom profile", state.compliance.profileId); option.dataset.custom = "true"; profileSelect.add(option);
    }
    profileSelect.value = state.compliance.profileId;
    document.querySelectorAll("[data-lock]").forEach(input => { input.checked = state.template.lockedFields.includes(input.dataset.lock); });
    document.getElementById("preset-select").value = state.preset;
    document.getElementById("portrait-focus-x").value = Math.round((state.media.portraitFocal || [.5, .5])[0] * 100);
    document.getElementById("portrait-focus-y").value = Math.round((state.media.portraitFocal || [.5, .5])[1] * 100);
    updateFocalUI(); applyLocks(); renderMediaList(); renderModuleEditors();
    document.documentElement.style.setProperty("--accent", state.theme.accent); document.documentElement.style.setProperty("--ink", state.theme.ink); document.documentElement.style.setProperty("--paper", state.theme.paper);
  }
  function applyLocks() {
    document.querySelectorAll("[data-path]").forEach(input => { input.disabled = state.template.lockedFields.includes(input.dataset.path); });
  }
  function updateValidation() {
    const result = Core.validateProject(state); const container = document.getElementById("validation-summary");
    container.className = `validation-summary ${result.errors.length ? "is-blocked" : result.warnings.length ? "has-warnings" : "is-ready"}`;
    if (result.errors.length) container.innerHTML = `<strong>Export blocked · ${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}</strong><ul>${result.errors.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${result.warnings.length ? `<strong>Warnings</strong><ul>${result.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}`;
    else if (result.warnings.length) container.innerHTML = `<strong>Ready with ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}</strong><ul>${result.warnings.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    else container.innerHTML = "<strong>Preflight passed</strong>Configured required fields and media are ready for export.";
    document.getElementById("active-profile").textContent = `Compliance: ${result.profile.name} ${result.profile.version} · Template: ${state.template.name} ${state.template.version} · Language: ${state.language.mode}`;
    return result;
  }
  function exportGuard() {
    const result = updateValidation();
    if (!result.errors.length) return true;
    document.getElementById("compliance-section").open = true; setStatus(`Export blocked: correct ${result.errors.length} preflight issue${result.errors.length === 1 ? "" : "s"}.`); return false;
  }
  function updateChangeSummary() {
    const container = document.getElementById("change-summary");
    if (!state.review.baseline) { container.textContent = "No comparison project loaded."; return []; }
    const changes = Core.diffProjects(state.review.baseline, state); container.innerHTML = changes.length
      ? `<strong>${changes.length} changed field${changes.length === 1 ? "" : "s"}</strong><ul>${changes.slice(0, 20).map(change => `<li>${escapeHtml(change.path)}</li>`).join("")}</ul>${changes.length > 20 ? `<p>And ${changes.length - 20} more.</p>` : ""}`
      : "No differences from the comparison project.";
    return changes;
  }
  async function hydrateImages() {
    images.hero = await loadImage(state.media.heroDataUrl);
    images.portrait = await loadImage(state.media.portraitDataUrl);
    images.logoLight = await loadImage(state.media.logoLightDataUrl); images.logoDark = await loadImage(state.media.logoDarkDataUrl);
    images.gallery = await Promise.all(state.media.gallery.map(item => loadImage(item.dataUrl)));
    images.floorplans = await Promise.all((state.media.floorplans || []).map(item => loadImage(item.dataUrl)));
    images.spotlights = await Promise.all((state.modules.spotlights || []).map(item => loadImage(item.dataUrl)));
    updateFocalUI(); renderMediaList();
  }
  async function commitMlsState(candidate) {
    const previous = state; state = candidate;
    try { await hydrateImages(); }
    catch (_) {
      state = previous; await hydrateImages().catch(() => {});
      const error = new Error("A provider image could not be decoded; the project was not changed. / 供应商图片无法解码，项目未被更改。"); error.code = "MLS_IMAGE_INVALID"; throw error;
    }
  }
  async function setNamedMedia(kind, file) {
    const dataUrl = await readFile(file); state.media[`${kind}DataUrl`] = dataUrl; state.media[`${kind}Name`] = file.name; state.media[`${kind}Type`] = file.type; images[kind] = await loadImage(dataUrl);
    invalidateMlsReview();
    updateFocalUI(); renderMediaList(); render(); setStatus(`${file.name} loaded locally.`);
  }
  async function addGallery(files) {
    const available = Math.max(0, 4 - state.media.gallery.length); const selected = [...files].slice(0, available);
    for (const file of selected) { const dataUrl = await readFile(file); state.media.gallery.push({name: file.name, type: file.type, dataUrl}); images.gallery.push(await loadImage(dataUrl)); }
    if (selected.length) invalidateMlsReview();
    if (files.length > available) setStatus("Only four interior photos are supported; additional files were skipped."); else setStatus(`${selected.length} interior photo${selected.length === 1 ? "" : "s"} loaded locally.`);
    renderMediaList(); render();
  }
  async function replaceGallery(index) {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
    input.addEventListener("change", async () => { const file = input.files[0]; if (!file) return; const dataUrl = await readFile(file); state.media.gallery[index] = {name: file.name, type: file.type, dataUrl}; images.gallery[index] = await loadImage(dataUrl); invalidateMlsReview(); renderMediaList(); render(); setStatus("Interior photo replaced locally."); });
    input.click();
  }
  function removeMedia(kind, index) {
    if (kind === "gallery") { state.media.gallery.splice(index, 1); images.gallery.splice(index, 1); }
    else { state.media[`${kind}DataUrl`] = ""; state.media[`${kind}Name`] = ""; state.media[`${kind}Type`] = ""; images[kind] = null; }
    invalidateMlsReview();
    renderMediaList(); updateFocalUI(); render(); setStatus("Media removed from this project.");
  }
  function collectionFor(name) { return name === "floorplans" ? state.media.floorplans : state.modules[name]; }
  function markMlsModuleOverride(name) { Core.recordMlsOverride(state, `modules.${name}`, state.modules[name]); }
  function moduleImageCollection(name) { return name === "floorplans" ? images.floorplans : name === "spotlights" ? images.spotlights : null; }
  function newPlan(role = "furnished3d") {
    return {role, name: "", type: "", dataUrl: "", fit: "contain", focal: [.5, .5], captionEn: role === "technical2d" ? "Technical 2D plan" : "Furnished 3D plan", captionZh: role === "technical2d" ? "二维技术户型图" : "三维家具户型图", noteEn: "", noteZh: "", pixelWidth: 0, pixelHeight: 0};
  }
  document.addEventListener("input", event => {
    const input = event.target; const collectionName = input.dataset.collection; if (!collectionName || input.dataset.moduleFile) return;
    const collection = collectionFor(collectionName); const item = collection && collection[Number(input.dataset.index)]; if (!item) return;
    if (input.dataset.field === "focalX" || input.dataset.field === "focalY") {
      const axis = input.dataset.field === "focalX" ? 0 : 1; if (!Array.isArray(item.focal)) item.focal = [.5, .5]; item.focal[axis] = Number(input.value) / 100;
    } else if (input.type === "checkbox") item[input.dataset.field] = input.checked;
    else if (input.type === "number") item[input.dataset.field] = Number(input.value);
    else item[input.dataset.field] = input.value;
    if (collectionName !== "floorplans") Core.recordMlsOverride(state, `modules.${collectionName}`, state.modules[collectionName]);
    render();
  });
  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-module-action]"); if (!button) return; const action = button.dataset.moduleAction;
    if (action === "add-plan") {
      const plans = state.media.floorplans; if (plans.length >= Core.MODULE_LIMITS.floorPlans) return;
      plans.push(newPlan(plans.some(plan => plan.role === "furnished3d") ? "technical2d" : "furnished3d")); images.floorplans.push(null); invalidateMlsReview();
    } else {
      const collectionName = button.dataset.collection; const collection = collectionFor(collectionName); const index = Number(button.dataset.index); if (!collection || !collection[index]) return;
      const imageCollection = moduleImageCollection(collectionName);
      if (action === "remove") { collection.splice(index, 1); if (imageCollection) imageCollection.splice(index, 1); }
      else if (action === "up" && index > 0) { [collection[index - 1], collection[index]] = [collection[index], collection[index - 1]]; if (imageCollection) [imageCollection[index - 1], imageCollection[index]] = [imageCollection[index], imageCollection[index - 1]]; }
      else if (action === "down" && index < collection.length - 1) { [collection[index + 1], collection[index]] = [collection[index], collection[index + 1]]; if (imageCollection) [imageCollection[index + 1], imageCollection[index]] = [imageCollection[index], imageCollection[index + 1]]; }
    }
    if (button.dataset.collection && button.dataset.collection !== "floorplans") markMlsModuleOverride(button.dataset.collection);
    else if (button.dataset.collection === "floorplans") invalidateMlsReview();
    renderModuleEditors(); render(); setStatus("Module order and visibility updated locally.");
  });
  document.addEventListener("change", async event => {
    const input = event.target; const collectionName = input.dataset.moduleFile; if (!collectionName || !input.files || !input.files[0]) return;
    const file = input.files[0]; const index = Number(input.dataset.index); const collection = collectionFor(collectionName); if (!collection || !collection[index]) return;
    const dataUrl = await readFile(file); const image = await loadImage(dataUrl); Object.assign(collection[index], {name: file.name, type: file.type, dataUrl, pixelWidth: image.naturalWidth, pixelHeight: image.naturalHeight});
    moduleImageCollection(collectionName)[index] = image; invalidateMlsReview(); renderModuleEditors(); render(); setStatus(`${file.name} loaded locally with its pixel dimensions.`);
  });
  document.getElementById("add-custom-fact").addEventListener("click", () => {
    if (state.modules.propertyFacts.length >= Core.MODULE_LIMITS.propertyFacts) return;
    state.modules.propertyFacts.push({id: `custom-${Date.now()}`, icon: "building-bank", value: "", labelEn: "Custom fact", labelZh: "自定义信息", visible: true, priority: state.modules.propertyFacts.length + 1}); markMlsModuleOverride("propertyFacts"); renderModuleEditors(); render();
  });
  document.getElementById("add-spotlight").addEventListener("click", () => {
    if (state.modules.spotlights.length >= Core.MODULE_LIMITS.spotlights) return;
    state.modules.spotlights.push({id: `spotlight-${Date.now()}`, name: "", type: "", dataUrl: "", titleEn: "Feature spotlight", titleZh: "重点卖点", detailEn: "", detailZh: "", mask: "circle", focal: [.5, .5], visible: true, pixelWidth: 0, pixelHeight: 0}); images.spotlights.push(null); markMlsModuleOverride("spotlights"); renderModuleEditors(); render();
  });
  document.getElementById("add-lease-detail").addEventListener("click", () => {
    if (state.modules.leaseDetails.length >= Core.MODULE_LIMITS.leaseDetails) return;
    state.modules.leaseDetails.push({id: `custom-${Date.now()}`, labelEn: "Custom condition", labelZh: "自定义条款", valueEn: "", valueZh: "", state: "active"}); markMlsModuleOverride("leaseDetails"); renderModuleEditors(); render();
  });
  document.getElementById("add-included-cost").addEventListener("click", () => {
    if (state.modules.includedCosts.length >= Core.MODULE_LIMITS.includedCosts) return;
    state.modules.includedCosts.push({id: `custom-${Date.now()}`, icon: "receipt", labelEn: "Custom inclusion", labelZh: "自定义包含项目", state: "included"}); markMlsModuleOverride("includedCosts"); renderModuleEditors(); render();
  });
  document.getElementById("add-tenant-cost").addEventListener("click", () => {
    if (state.modules.tenantPaidCosts.length >= Core.MODULE_LIMITS.tenantPaidCosts) return;
    state.modules.tenantPaidCosts.push({id: `custom-tenant-${Date.now()}`, icon: "receipt", labelEn: "Custom tenant cost", labelZh: "自定义租客费用", state: "tenant-paid"}); markMlsModuleOverride("tenantPaidCosts"); renderModuleEditors(); render();
  });
  document.getElementById("add-amenity").addEventListener("click", () => {
    if (state.modules.amenities.length >= Core.MODULE_LIMITS.amenities) return;
    state.modules.amenities.push({id: `custom-amenity-${Date.now()}`, icon: "building-community", labelEn: "Custom amenity", labelZh: "自定义设施", state: "active"}); markMlsModuleOverride("amenities"); renderModuleEditors(); render();
  });
  document.getElementById("add-requirement").addEventListener("click", () => {
    if (state.modules.applicationRequirements.length >= Core.MODULE_LIMITS.applicationRequirements) return;
    state.modules.applicationRequirements.push({id: `custom-requirement-${Date.now()}`, icon: "circle-check", labelEn: "Custom requirement", labelZh: "自定义申请要求", state: "required"}); markMlsModuleOverride("applicationRequirements"); renderModuleEditors(); render();
  });

  document.getElementById("mls-connect").addEventListener("click", async () => {
    const button = document.getElementById("mls-connect"); button.disabled = true; setStatus("Connecting to the loopback MLS connector… / 正在连接本机 MLS 连接器…");
    try {
      mlsContext = await mlsClient.connect(document.getElementById("mls-connector-url").value);
      if (!mlsContext.provider || !mlsContext.provider.id || !mlsContext.provider.board) throw Mls.connectorError("MLS_CONNECTOR_UNAVAILABLE");
      renderMlsImport(); setStatus(`Connected locally to ${mlsContext.provider.name} / ${mlsContext.provider.board}. No credential entered the browser.`);
    } catch (error) { mlsContext = null; renderMlsImport(); setStatus(error.message); }
    finally { button.disabled = false; }
  });
  document.getElementById("mls-generate").addEventListener("click", async () => {
    if (!mlsContext || !mlsContext.provider) return;
    const listingNumber = document.getElementById("mls-number").value.trim();
    if (!listingNumber) { setStatus("Enter one exact MLS listing number. / 请输入一个准确的 MLS 房源编号。"); return; }
    if (!(await prepareAction("before-authorized-mls-import", {requireSaved: true}))) return;
    const button = document.getElementById("mls-generate"); button.disabled = true; setStatus("Retrieving one authorized provider record… / 正在获取一条获授权供应商记录…");
    try {
      const response = await mlsClient.lookup(document.getElementById("mls-connector-url").value, mlsContext.provider.id, listingNumber);
      const plan = Core.buildMlsImportPlan(state, response, {providerId: mlsContext.provider.id, board: mlsContext.provider.board, listingNumber});
      const protectedMedia = Boolean(state.media.heroDataUrl || state.media.gallery.length || Core.activeFloorPlans(state).length);
      const hasOverrides = Core.mlsCompleteness(state).overridden > 0;
      const needsConfirmation = plan.refresh.requiresConfirmation || hasOverrides || (protectedMedia && plan.images.length);
      let overwriteProtected = false;
      if (needsConfirmation) {
        overwriteProtected = window.confirm(`The authorized refresh has ${plan.refresh.changes.length} field change(s). Continuing may overwrite reviewed edits or local listing images.\n\n获授权刷新包含 ${plan.refresh.changes.length} 项字段变化，继续可能覆盖人工修改或本地房源图片。是否继续？`);
        if (!overwriteProtected) { setStatus("MLS import cancelled; the current project remains unchanged. / 已取消导入，当前项目未更改。"); return; }
      }
      const candidate = Core.applyMlsImport(state, plan, {overwriteUserOverrides: overwriteProtected || !plan.refresh.sameListing, overwriteLocalImages: overwriteProtected || !protectedMedia});
      Recovery.ensureProjectId(candidate); await commitMlsState(candidate); syncControls(); render();
      setStatus(`Exact authorized match imported from ${plan.provider.name} / ${plan.provider.board}. Review every field and image right before export. / 已导入唯一匹配记录，请逐项核对。`);
    } catch (error) {
      const copy = Mls.ERROR_COPY[error.code]; setStatus(copy ? `${copy[0]} / ${copy[1]}` : `${error.message} / MLS 导入失败。`);
    } finally { button.disabled = !mlsContext; renderMlsImport(); }
  });
  document.getElementById("mls-rights").addEventListener("click", async event => {
    const button = event.target.closest("[data-mls-rights]"); if (!button) return;
    try {
      const candidate = button.dataset.mlsRights === "confirm"
        ? Core.confirmMlsImageRights(state, button.dataset.sourceId)
        : Core.resolveMlsImageWithReplacement(state, button.dataset.sourceId);
      await commitMlsState(candidate); syncControls(); render(); setStatus("Image-rights decision recorded locally; human review is required again. / 图片权利决定已记录，需重新人工核对。");
    } catch (error) { const copy = Mls.ERROR_COPY[error.code]; setStatus(copy ? `${copy[0]} / ${copy[1]}` : error.message); }
  });
  document.getElementById("mls-review-confirmed").addEventListener("change", event => {
    state.mlsImport.reviewConfirmed = event.target.checked; state.mlsImport.reviewedAt = event.target.checked ? new Date().toISOString() : ""; render();
    setStatus(event.target.checked ? "Authorized listing review recorded locally. / 获授权房源人工核对已记录。" : "Authorized listing review reopened. / 已重新打开房源核对。 ");
  });

  document.querySelectorAll("[data-path]").forEach(input => input.addEventListener("input", () => {
    if (state.template.lockedFields.includes(input.dataset.path)) { syncControls(); return; }
    Core.setPath(state, input.dataset.path, input.type === "checkbox" ? input.checked : input.value);
    Core.recordMlsOverride(state, input.dataset.path, input.type === "checkbox" ? input.checked : input.value);
    if (state.modules.propertyFacts.some(fact => fact.source === input.dataset.path)) renderFactsEditor();
    if (input.dataset.path === "listing.status" && !state.compliance.profile) {
      const id = Core.profileForStatus(input.value); state.compliance.profileId = id; state.compliance.disclaimer = Core.COMPLIANCE_PROFILES[id].disclaimer; syncControls();
    }
    if (input.dataset.color) document.documentElement.style.setProperty(`--${input.dataset.color}`, input.value);
    render();
  }));
  document.querySelectorAll("[data-lock]").forEach(input => input.addEventListener("change", () => {
    const lock = input.dataset.lock; const set = new Set(state.template.lockedFields); input.checked ? set.add(lock) : set.delete(lock); state.template.lockedFields = [...set]; applyLocks(); render();
  }));
  document.getElementById("preset-select").addEventListener("change", event => { state.preset = event.target.value; render(); });
  document.getElementById("hero-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("hero", event.target.files[0]));
  document.getElementById("portrait-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("portrait", event.target.files[0]));
  document.getElementById("logo-light-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("logoLight", event.target.files[0]));
  document.getElementById("logo-dark-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("logoDark", event.target.files[0]));
  document.getElementById("gallery-upload").addEventListener("change", event => event.target.files.length && addGallery(event.target.files));
  ["x", "y"].forEach((axis, index) => document.getElementById(`portrait-focus-${axis}`).addEventListener("input", event => {
    if (!Array.isArray(state.media.portraitFocal)) state.media.portraitFocal = [.5, .5]; state.media.portraitFocal[index] = Number(event.target.value) / 100; render();
  }));
  document.getElementById("media-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]"); if (!button) return; const row = button.closest("[data-kind]"); const kind = row.dataset.kind; const index = Number(row.dataset.index);
    if (button.dataset.action === "remove") removeMedia(kind, index);
    else if (button.dataset.action === "replace") replaceGallery(index);
    else if (button.dataset.action === "up" && index > 0) { [state.media.gallery[index - 1], state.media.gallery[index]] = [state.media.gallery[index], state.media.gallery[index - 1]]; [images.gallery[index - 1], images.gallery[index]] = [images.gallery[index], images.gallery[index - 1]]; invalidateMlsReview(); renderMediaList(); render(); }
    else if (button.dataset.action === "down" && index < state.media.gallery.length - 1) { [state.media.gallery[index + 1], state.media.gallery[index]] = [state.media.gallery[index], state.media.gallery[index + 1]]; [images.gallery[index + 1], images.gallery[index]] = [images.gallery[index], images.gallery[index + 1]]; invalidateMlsReview(); renderMediaList(); render(); }
  });
  function setFocalFromEvent(event) {
    const rect = focalPad.getBoundingClientRect(); state.focal = [Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))]; updateFocalUI(); render();
  }
  focalPad.addEventListener("click", setFocalFromEvent);
  focalPad.addEventListener("keydown", event => {
    const delta = event.shiftKey ? .05 : .01; let [x, y] = state.focal;
    if (event.key === "ArrowLeft") x -= delta; else if (event.key === "ArrowRight") x += delta; else if (event.key === "ArrowUp") y -= delta; else if (event.key === "ArrowDown") y += delta; else return;
    event.preventDefault(); state.focal = [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))]; updateFocalUI(); render();
  });
  [focusX, focusY].forEach(input => input.addEventListener("input", () => { state.focal = [Number(focusX.value) / 100, Number(focusY.value) / 100]; updateFocalUI(); render(); }));

  function projectPayload() { Recovery.ensureProjectId(state); const payload = Core.clone(state); payload.schemaVersion = Core.PROJECT_SCHEMA_VERSION; payload.appVersion = Core.APP_VERSION; return payload; }
  restoreDraftButton.addEventListener("click", async () => { if (pendingSnapshot) await restoreRecoverySnapshot(pendingSnapshot); });
  downloadRecoveryButton.addEventListener("click", () => {
    if (!pendingSnapshot) return; downloadBlob(new Blob([JSON.stringify(pendingSnapshot, null, 2)], {type: "application/json"}), `${slug()}.recovery.json`); setStatus("Recovery copy downloaded. / 恢复副本已下载。");
  });
  discardDraftButton.addEventListener("click", async () => {
    if (!pendingSnapshot || !draftStore) return;
    const conflict = pendingRecoveryMode === "conflict";
    const message = conflict
      ? "Keep this tab's version and overwrite the newer draft after your next edit? / 保留本标签页版本，并在下次编辑时覆盖较新草稿吗？"
      : "Discard this locally recovered draft? This cannot be undone unless you downloaded a copy. / 放弃这个本地恢复草稿？如未下载副本，此操作无法撤销。";
    if (!window.confirm(message)) return;
    if (!conflict) await draftStore.delete(pendingSnapshot.projectId);
    hideRecoveryPanel(); autosaveEnabled = true; if (conflict) stateRevision += 1; dirtySinceSave = stateRevision > persistedRevision;
    if (dirtySinceSave) await saveRecoverySnapshot(conflict ? "cross-tab-version-kept" : "after-recovery-choice", {force: true});
    else setAutosaveState("Draft discarded; autosave remains ready. / 草稿已放弃，自动保存仍然可用。", "saved");
  });
  document.getElementById("clear-drafts").addEventListener("click", async () => {
    if (!draftStore) { setAutosaveState("Local recovery storage is unavailable. / 本地恢复存储不可用。", "warning"); return; }
    if (!window.confirm("Clear every locally recovered project on this device? Portable files will not be affected. / 清除此设备上的所有本地恢复项目？已下载的项目文件不会受影响。")) return;
    await draftStore.clear(); hideRecoveryPanel(); autosaveEnabled = true; stateRevision = 0; persistedRevision = 0; dirtySinceSave = false; lastSavedFingerprint = ""; setAutosaveState("All local recovery drafts cleared. / 所有本地恢复草稿已清除。", "saved");
  });
  document.getElementById("save-project").addEventListener("click", async () => { await prepareAction("before-project-download"); downloadBlob(new Blob([JSON.stringify(projectPayload(), null, 2)], {type: "application/json"}), `${slug()}.realtor-poster.json`); setStatus("Versioned portable project downloaded."); });
  document.getElementById("open-project").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!window.confirm("Replace the current workspace with this project? A recovery snapshot will be saved first. / 用该项目替换当前工作区？系统会先保存恢复快照。")) { event.target.value = ""; return; }
    if (!(await prepareAction("before-open-project", {requireSaved: true}))) { event.target.value = ""; return; }
    try { state = Core.normalizeProject(JSON.parse(await readFile(file, "text")), DEFAULT_PROJECT); Recovery.ensureProjectId(state); hideRecoveryPanel(); autosaveEnabled = true; await hydrateImages(); syncControls(); render(); setStatus("Project opened locally."); }
    catch (error) { setStatus(`Could not open project: ${error.message}`); }
    event.target.value = "";
  });
  document.getElementById("import-listing").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!window.confirm("Replace the current workspace with this listing? A recovery snapshot will be saved first. / 用该房源替换当前工作区？系统会先保存恢复快照。")) { event.target.value = ""; return; }
    if (!(await prepareAction("before-import-listing", {requireSaved: true}))) { event.target.value = ""; return; }
    try {
      const text = await readFile(file, "text"); const raw = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : Core.parseSimpleYaml(text);
      state = Core.projectFromListingData(raw, DEFAULT_PROJECT); state.projectId = Recovery.newProjectId("project"); hideRecoveryPanel(); autosaveEnabled = true; await hydrateImages(); syncControls(); render(); setStatus("Listing data imported. Reselect local image files referenced by path.");
    } catch (error) { setStatus(`Could not import listing: ${error.message}`); }
    event.target.value = "";
  });
  document.getElementById("export-yaml").addEventListener("click", async () => { await prepareAction("before-yaml-export"); const yaml = `${Core.toSimpleYaml(Core.toListingData(state))}\n`; downloadBlob(new Blob([yaml], {type: "text/yaml"}), `${slug()}.yaml`); setStatus("Python-compatible YAML downloaded."); });
  document.getElementById("export-json").addEventListener("click", async () => { await prepareAction("before-json-export"); downloadBlob(new Blob([JSON.stringify(Core.toListingData(state), null, 2)], {type: "application/json"}), `${slug()}.listing.json`); setStatus("Python-compatible listing JSON downloaded."); });

  document.getElementById("save-template").addEventListener("click", async () => {
    await prepareAction("before-template-export");
    const template = Core.buildTemplate(state);
    downloadBlob(new Blob([JSON.stringify(template, null, 2)], {type: "application/json"}), `${slug()}.brand-template.json`); setStatus("Versioned brand template downloaded.");
  });
  document.getElementById("duplicate-template").addEventListener("click", () => {
    state = Core.duplicateTemplate(state); syncControls(); render(); setStatus("Template duplicated. Rename or change its version before export.");
  });
  document.getElementById("open-template").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!window.confirm("Apply this template to the current project? A recovery snapshot will be saved first. / 将此模板应用到当前项目？系统会先保存恢复快照。")) { event.target.value = ""; return; }
    if (!(await prepareAction("before-template-import", {requireSaved: true}))) { event.target.value = ""; return; }
    try {
      const template = JSON.parse(await readFile(file, "text")); state = Core.applyTemplate(state, template);
      images.logoLight = await loadImage(state.media.logoLightDataUrl); images.logoDark = await loadImage(state.media.logoDarkDataUrl); syncControls(); render(); setStatus("Brand template applied without changing saved projects.");
    } catch (error) { setStatus(`Could not import template: ${error.message}`); }
    event.target.value = "";
  });
  document.getElementById("save-compliance").addEventListener("click", async () => {
    await prepareAction("before-compliance-export");
    const profile = Core.activeComplianceProfile(state); const payload = {kind: "realtor-poster-compliance", schemaVersion: 1, profile: {...profile, disclaimer: state.compliance.disclaimer}};
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"}), `${profile.id}.compliance-profile.json`); setStatus("Compliance profile downloaded.");
  });
  document.getElementById("open-compliance").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!window.confirm("Apply this compliance profile? A recovery snapshot will be saved first. / 应用此合规配置？系统会先保存恢复快照。")) { event.target.value = ""; return; }
    if (!(await prepareAction("before-compliance-import", {requireSaved: true}))) { event.target.value = ""; return; }
    try {
      const payload = JSON.parse(await readFile(file, "text")); if (payload.kind !== "realtor-poster-compliance" || !payload.profile) throw new Error("Not a Realtor Poster compliance profile");
      state.compliance.profile = payload.profile; state.compliance.profileId = payload.profile.id || "custom"; state.compliance.disclaimer = payload.profile.disclaimer || "";
      const select = document.getElementById("compliance-profile"); if (![...select.options].some(option => option.value === state.compliance.profileId)) select.add(new Option(payload.profile.name || "Custom profile", state.compliance.profileId));
      syncControls(); render(); setStatus("Compliance profile imported.");
    } catch (error) { setStatus(`Could not import compliance profile: ${error.message}`); }
    event.target.value = "";
  });
  document.getElementById("compliance-profile").addEventListener("change", event => {
    const profile = Core.COMPLIANCE_PROFILES[event.target.value]; if (!profile) return; state.compliance.profile = null; state.compliance.profileId = profile.id; state.compliance.disclaimer = profile.disclaimer; syncControls(); render();
  });
  document.getElementById("open-baseline").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!(await prepareAction("before-baseline-import", {requireSaved: true}))) { event.target.value = ""; return; }
    try { state.review.baseline = Core.normalizeProject(JSON.parse(await readFile(file, "text")), DEFAULT_PROJECT); updateChangeSummary(); scheduleAutosave(); setStatus("Comparison project loaded locally."); }
    catch (error) { setStatus(`Could not compare project: ${error.message}`); }
    event.target.value = "";
  });

  function canvasBytes(target) { return new Promise(resolve => target.toBlob(async blob => resolve(new Uint8Array(await blob.arrayBuffer())), "image/png")); }
  async function presetFile(preset) { const target = document.createElement("canvas"); drawPoster(target, preset); return {name: `${slug()}.${preset}.png`, data: await canvasBytes(target)}; }
  document.getElementById("download-png").addEventListener("click", async () => {
    if (!exportGuard()) return; await prepareAction("before-png-export"); canvas.toBlob(blob => { downloadBlob(blob, `${slug()}.${state.preset}.png`); setStatus("Validated PNG downloaded. Your editable draft remains saved locally."); }, "image/png");
  });
  document.getElementById("print-pdf").addEventListener("click", async () => {
    if (!exportGuard()) return; const popup = window.open("", "poster-print", "width=900,height=1000");
    if (!popup) { setStatus("Allow pop-ups to print or save the poster as PDF."); return; }
    await prepareAction("before-pdf-export");
    const data = canvas.toDataURL("image/png"); popup.document.write(`<!doctype html><title>${escapeHtml(slug())}</title><style>@page{margin:0}body{margin:0;display:grid;place-items:center;background:white}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}</style><img src="${data}" alt="Poster">`);
    popup.document.close(); popup.focus(); popup.onload = () => popup.print(); setStatus("Print dialog opened — choose Save as PDF.");
  });

  function jsonFile(name, value) { return {name, data: encoder.encode(`${JSON.stringify(value, null, 2)}\n`)}; }
  async function packageWithManifest(files) {
    const manifest = await Core.buildManifest(state, files); return [...files, jsonFile(`${slug()}.manifest.json`, manifest)];
  }
  document.getElementById("download-pack").addEventListener("click", async () => {
    if (!exportGuard()) return; await prepareAction("before-social-export"); setStatus("Rendering four social formats and provenance…"); const files = [];
    for (const preset of SOCIAL_PRESETS) files.push(await presetFile(preset)); files.push(jsonFile(`${slug()}.listing.json`, Core.toListingData(state)));
    downloadBlob(new Blob([Core.makeZip(await packageWithManifest(files))], {type: "application/zip"}), `${slug()}.social-pack.zip`); setStatus("Validated social ZIP with manifest downloaded.");
  });
  document.getElementById("download-manifest").addEventListener("click", async () => {
    if (!exportGuard()) return; await prepareAction("before-manifest-export"); const file = {name: `${slug()}.${state.preset}.png`, data: await canvasBytes(canvas)}; const manifest = await Core.buildManifest(state, [file]);
    downloadBlob(new Blob([`${JSON.stringify(manifest, null, 2)}\n`], {type: "application/json"}), `${slug()}.manifest.json`); setStatus("Provenance manifest downloaded.");
  });
  function proofHtml(files, changes) {
    const imagesHtml = files.filter(file => file.name.endsWith(".png")).map(file => `<figure><img src="${escapeHtml(file.name)}" alt="${escapeHtml(file.name)}"><figcaption>${escapeHtml(file.name)}</figcaption></figure>`).join("");
    const changesHtml = changes.length ? `<ul>${changes.map(change => `<li>${escapeHtml(change.path)}</li>`).join("")}</ul>` : "<p>No baseline changes recorded.</p>";
    const factsHtml = Core.resolvedPropertyFacts(state, "poster").map(fact => `<li>${escapeHtml(fact.labelEn)} / ${escapeHtml(fact.labelZh)}: ${escapeHtml(fact.value)}</li>`).join("");
    const plansHtml = Core.activeFloorPlans(state).map(plan => `<li>${escapeHtml(plan.captionEn || plan.name)} / ${escapeHtml(plan.captionZh || "")} · ${escapeHtml(plan.pixelWidth || "unknown")} × ${escapeHtml(plan.pixelHeight || "unknown")} px</li>`).join("");
    const spotsHtml = Core.activeSpotlights(state).map(item => `<li>${escapeHtml(item.titleEn)} / ${escapeHtml(item.titleZh)}</li>`).join("");
    const leaseHtml = Core.activeLeaseDetails(state).map(item => `<li>${escapeHtml(item.labelEn)}: ${escapeHtml(item.valueEn)} / ${escapeHtml(item.valueZh)}</li>`).join("");
    const costsHtml = Core.activeIncludedCosts(state).map(item => `<li>${escapeHtml(item.labelEn)} / ${escapeHtml(item.labelZh)}${item.state === "unknown" ? " · VERIFY" : ""}</li>`).join("");
    const tenantHtml = Core.activeTenantPaidCosts(state).map(item => `<li>${escapeHtml(item.labelEn)} / ${escapeHtml(item.labelZh)}${item.state === "unknown" ? " · VERIFY" : ""}</li>`).join("");
    const amenitiesHtml = Core.activeAmenities(state).map(item => `<li>${escapeHtml(item.labelEn)} / ${escapeHtml(item.labelZh)}</li>`).join("");
    const requirementsHtml = Core.activeApplicationRequirements(state).map(item => `<li>${escapeHtml(item.labelEn)} / ${escapeHtml(item.labelZh)} · ${escapeHtml(item.state)}</li>`).join("");
    return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(state.listing.address)} campaign proof</title><style>body{font:15px/1.45 Arial,sans-serif;margin:36px;color:#102c2b}h1,h2{font-family:Georgia,serif}header,section{margin-bottom:28px}dl{display:grid;grid-template-columns:160px 1fr;max-width:800px}dt{font-weight:700}figure{display:inline-block;width:30%;min-width:240px;vertical-align:top;margin:1%}img{max-width:100%;max-height:520px;object-fit:contain;box-shadow:0 5px 24px #0002}figcaption{font-size:12px;margin-top:6px}.module-grid{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:18px}.module-grid h3{margin-bottom:4px}.module-grid ul{margin-top:4px}@media print{figure,.module-grid>div{break-inside:avoid}}</style><header><h1>${escapeHtml(state.listing.address)} · Campaign proof</h1><p>Generated locally by Realtor Poster Studio ${Core.APP_VERSION} · Daniel Xu</p></header><section><h2>Listing facts</h2><dl><dt>Status</dt><dd>${escapeHtml(state.listing.status)}</dd><dt>Price</dt><dd>${escapeHtml(priceCopy())}</dd><dt>MLS®</dt><dd>${escapeHtml(state.listing.mls)}</dd><dt>Agent</dt><dd>${escapeHtml(state.contact.name)}</dd><dt>Brokerage</dt><dd>${escapeHtml(state.brand.name)}</dd><dt>Compliance</dt><dd>${escapeHtml(Core.activeComplianceProfile(state).name)}</dd><dt>Review</dt><dd>${escapeHtml(state.review.status)} · ${escapeHtml(state.review.reviewer || "Unassigned")} · ${escapeHtml(state.review.reviewedAt || "No date")}</dd></dl></section><section><h2>Structured campaign modules</h2><div class="module-grid"><div><h3>Property facts</h3><ul>${factsHtml || "<li>None</li>"}</ul></div><div><h3>Floor plans</h3><ul>${plansHtml || "<li>None</li>"}</ul></div><div><h3>Feature spotlights</h3><ul>${spotsHtml || "<li>None</li>"}</ul></div><div><h3>Lease details</h3><ul>${leaseHtml || "<li>None</li>"}</ul></div><div><h3>Rent inclusions</h3><ul>${costsHtml || "<li>None</li>"}</ul></div><div><h3>Tenant pays</h3><ul>${tenantHtml || "<li>None</li>"}</ul></div><div><h3>Amenities</h3><ul>${amenitiesHtml || "<li>None</li>"}</ul></div><div><h3>Application requirements</h3><ul>${requirementsHtml || "<li>None</li>"}</ul><p>${escapeHtml(state.compliance.applicationDisclaimer || "")}</p></div><div><h3>Agent CTA</h3><p>${escapeHtml(state.contact.name)} · ${escapeHtml(state.contact.phone)} · ${escapeHtml(state.contact.email)} · ${escapeHtml(state.contact.website || state.brand.website || "")}</p><p>${escapeHtml(state.contact.ctaTitleEn || "")} / ${escapeHtml(state.contact.ctaTitleZh || "")}</p></div></div></section><section><h2>Change summary</h2>${changesHtml}</section><section><h2>Artwork</h2>${imagesHtml}</section><section><h2>Reviewer notes</h2><p>${escapeHtml(state.review.notes || "No notes.")}</p><p><strong>Internal review only.</strong> This record is not an electronic signature or legal, regulatory, MLS®, or brokerage approval.</p></section>`;
  }
  document.getElementById("download-approval").addEventListener("click", async () => {
    if (!exportGuard()) return; await prepareAction("before-approval-export"); setStatus("Building review package and integrity records…"); const files = [];
    for (const preset of Object.keys(PRESETS)) files.push(await presetFile(preset));
    const changes = state.review.baseline ? Core.diffProjects(state.review.baseline, state) : [];
    files.push(jsonFile(`${slug()}.listing.json`, Core.toListingData(state))); files.push(jsonFile(`${slug()}.project.json`, projectPayload()));
    files.push(jsonFile(`${slug()}.approval.json`, Core.buildApprovalRecord(state, changes)));
    files.push({name: `${slug()}.proof.html`, data: encoder.encode(proofHtml(files, changes))}); const packaged = await packageWithManifest(files);
    const checksums = await Promise.all(packaged.map(async file => `${await Core.sha256Bytes(file.data)}  ${file.name}`)); packaged.push({name: "SHA256SUMS.txt", data: encoder.encode(`${checksums.join("\n")}\n`)});
    downloadBlob(new Blob([Core.makeZip(packaged)], {type: "application/zip"}), `${slug()}.approval-package.zip`); setStatus("Review package downloaded with proof, source data, manifest, approval record, and SHA-256 catalog.");
  });

  document.getElementById("reset-button").addEventListener("click", async () => {
    if (!window.confirm("Start a new workspace? The current project will remain available as a recovery draft. / 新建工作区？当前项目会保留为可恢复草稿。")) return;
    if (!(await prepareAction("before-reset", {requireSaved: true}))) return; state = Core.normalizeProject(DEFAULT_PROJECT, DEFAULT_PROJECT); state.projectId = Recovery.newProjectId("project"); hideRecoveryPanel(); autosaveEnabled = true;
    await hydrateImages(); syncControls(); render({autosave: false}); stateRevision = 0; persistedRevision = 0; dirtySinceSave = false; setAutosaveState("New workspace ready; the previous project remains recoverable. / 新工作区已就绪，原项目仍可恢复。", "saved"); setStatus("Workspace reset as a new project.");
  });

  async function hydrateIcons() {
    const loaded = await Promise.all(ICON_NAMES.map(name => loadImage(`assets/icons/${name}.svg`).catch(() => null)));
    ICON_NAMES.forEach((name, index) => { images.icons[name] = loaded[index]; });
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && dirtySinceSave) saveRecoverySnapshot("visibility-hidden", {force: true}); });
  window.addEventListener("pagehide", () => { if (dirtySinceSave) saveRecoverySnapshot("page-hide", {force: true}); });
  window.addEventListener("beforeunload", event => { if (!dirtySinceSave) return; event.preventDefault(); event.returnValue = ""; });

  Promise.all([hydrateImages(), hydrateIcons(), initializeRecovery()]).then(() => { syncControls(); render({autosave: false}); });
})();
