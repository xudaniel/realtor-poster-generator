(() => {
  "use strict";

  const Core = window.RealtorPosterCore;
  if (!Core) throw new Error("RealtorPosterCore is required");

  const PRESETS = {
    poster: [1800, 2400], square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1200, 630],
  };
  const SOCIAL_PRESETS = ["square", "portrait", "story", "landscape"];
  const STATUS_ZH = {"FOR LEASE": "出租", "FOR SALE": "出售", "JUST LISTED": "全新上市", "OPEN HOUSE": "开放参观"};

  const DEFAULT_PROJECT = {
    schemaVersion: Core.PROJECT_SCHEMA_VERSION, appVersion: Core.APP_VERSION,
    listing: {
      address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", city: "Toronto, ON", postalCode: "M5J 2N8",
      price: "$3,850", rentPeriod: "per month", mls: "C1234567", beds: "2", baths: "2", sqft: "815",
      floor: "26th", exposure: "South-East", parking: "1 Space", availability: "Immediately",
      headlineEn: "Lake views. Downtown energy. A home above it all.", headlineZh: "湖景之上，都市生活触手可及",
    },
    contact: {name: "Daniel Xu", title: "Sales Representative", license: "", phone: "416-555-0198", email: "hello@example.com"},
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
      logoLightDataUrl: "", logoLightName: "", logoLightType: "", logoDarkDataUrl: "", logoDarkName: "", logoDarkType: "",
    },
    compliance: {profileId: "lease", profile: null, disclaimer: Core.COMPLIANCE_PROFILES.lease.disclaimer},
    template: {name: "Harbour Editorial", version: "1.0.0", lockedFields: []},
    review: {status: "Draft", reviewer: "", reviewedAt: "", notes: "", baseline: null},
  };

  let state = Core.normalizeProject(DEFAULT_PROJECT, DEFAULT_PROJECT);
  const images = {hero: null, floorplan: null, logoLight: null, logoDark: null, gallery: []};
  const canvas = document.getElementById("poster-canvas");
  const status = document.getElementById("status");
  const focalPad = document.getElementById("focal-pad");
  const focalMarker = document.getElementById("focal-marker");
  const focalEmpty = document.getElementById("focal-empty");
  const focusX = document.getElementById("focus-x");
  const focusY = document.getElementById("focus-y");
  const encoder = new TextEncoder();

  function setStatus(message) { status.textContent = message; }
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
    else drawSocial(ctx, width, height, S, theme);
    ctx.fillStyle = rgba(theme.ink, .23); ctx.font = `${Math.round(12 * S)}px ${fontFamily("english")}`; ctx.textAlign = "right";
    ctx.fillText(`Generated locally · ${state.template.name} ${state.template.version}`, width - 62 * S, height - 14 * S);
  }
  function drawPrintPoster(ctx, width, height, S, theme) {
    const l = state.listing; const margin = 74 * S; const heroH = 860 * S;
    drawCover(ctx, images.hero, 0, 0, width, heroH, state.focal);
    const overlay = ctx.createLinearGradient(0, 0, 0, heroH); overlay.addColorStop(0, rgba(theme.ink, .08)); overlay.addColorStop(.55, rgba(theme.ink, .2)); overlay.addColorStop(1, rgba(theme.ink, .95));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, heroH); drawStatus(ctx, statusCopy(), margin, 62 * S, S, theme); drawLogo(ctx, width - 350 * S, 54 * S, 270 * S, 84 * S, "dark");
    ctx.fillStyle = theme.paper; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; fitText(ctx, l.address, width - 2 * margin, 84 * S, 44 * S, 800, serifFamily());
    ctx.fillText(l.address, margin, 615 * S); ctx.font = `700 ${38 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent;
    ctx.fillText(localized(`UNIT ${l.unit}`, `${l.unit} 室`), margin, 682 * S); fitText(ctx, priceCopy(), width - 2 * margin, 68 * S, 38 * S, 800);
    ctx.fillStyle = theme.paper; ctx.fillText(priceCopy(), margin, 780 * S); ctx.textAlign = "right"; ctx.font = `700 ${22 * S}px ${fontFamily("english")}`; ctx.fillText(`MLS® ${l.mls}`, width - margin, 778 * S);

    const factsTop = heroH; const factsH = 176 * S; ctx.fillStyle = theme.ink; ctx.fillRect(0, factsTop, width, factsH);
    const facts = [[l.beds, factLabel("BEDS", "卧室")], [l.baths, factLabel("BATHS", "卫浴")], [l.sqft, factLabel("SQ FT", "平方英尺")], [l.parking, factLabel("PARKING", "车位")]];
    facts.forEach(([value, label], index) => {
      const cellW = width / facts.length; const x = cellW * index + cellW / 2;
      if (index) { ctx.fillStyle = rgba(theme.paper, .2); ctx.fillRect(cellW * index, factsTop + 34 * S, 2 * S, 108 * S); }
      ctx.textAlign = "center"; ctx.fillStyle = theme.paper; fitText(ctx, value, cellW - 34 * S, 34 * S, 21 * S, 800); ctx.fillText(value, x, factsTop + 78 * S);
      ctx.font = `700 ${15 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; ctx.fillText(label, x, factsTop + 120 * S);
    });

    const contentTop = factsTop + factsH; ctx.fillStyle = theme.paper; ctx.fillRect(0, contentTop, width, height - contentTop); ctx.textAlign = "left";
    ctx.fillStyle = theme.ink; ctx.font = `700 ${21 * S}px ${fontFamily()}`; ctx.fillText(localized("A REMARKABLE PLACE TO LIVE", "值得珍藏的理想居所"), margin, contentTop + 72 * S);
    drawHeadlineBlock(ctx, margin, contentTop + 142 * S, width - 2 * margin, S);
    const dividerY = contentTop + 350 * S; ctx.fillStyle = theme.accent; ctx.fillRect(margin, dividerY, width - 2 * margin, 3 * S);
    const copy = Core.campaignCopy(state); const featureCount = Math.min(4, state.language.mode === "chinese" ? (copy.chinese.features.length || copy.english.features.length) : copy.english.features.length);
    const featureY = dividerY + 56 * S;
    Array.from({length: featureCount}).forEach((_, index) => {
      const col = index % 2; const row = Math.floor(index / 2); const colW = width / 2 - 1.5 * margin; const x = margin + col * (width / 2); const y = featureY + row * 102 * S;
      drawFeatureBlock(ctx, x, y, colW, S, index);
    });

    const photoItems = [...images.gallery.slice(0, 3), images.floorplan].filter(Boolean); const stripY = height - 690 * S; const stripH = 255 * S;
    if (photoItems.length) {
      const gap = 12 * S; const itemW = (width - 2 * margin - gap * (photoItems.length - 1)) / photoItems.length;
      photoItems.forEach((image, index) => drawCover(ctx, image, margin + index * (itemW + gap), stripY, itemW, stripH, [.5, .5]));
    } else {
      roundRect(ctx, margin, stripY, width - 2 * margin, stripH, 18 * S, rgba(theme.ink, .06)); ctx.fillStyle = rgba(theme.ink, .55); ctx.textAlign = "center";
      ctx.font = `700 ${24 * S}px ${fontFamily()}`; ctx.fillText(localized("Add interior photos and a floor plan", "添加室内照片与户型图"), width / 2, stripY + stripH / 2);
    }

    const cardY = height - 385 * S; roundRect(ctx, margin, cardY, width - 2 * margin, 270 * S, 22 * S, theme.ink); ctx.textAlign = "left";
    ctx.fillStyle = theme.paper; ctx.font = `800 ${38 * S}px ${fontFamily()}`; ctx.fillText(state.contact.name, margin + 40 * S, cardY + 62 * S);
    const professionalLine = [state.contact.title, state.contact.license, state.brand.name].filter(Boolean).join(" · ");
    fitText(ctx, professionalLine, width - 2 * margin - 390 * S, 16 * S, 12 * S, 700, fontFamily()); ctx.fillStyle = theme.accent; ctx.fillText(professionalLine, margin + 40 * S, cardY + 98 * S);
    ctx.font = `500 ${19 * S}px ${fontFamily("english")}`; ctx.fillStyle = theme.paper; ctx.fillText(`${state.contact.phone}   •   ${state.contact.email}`, margin + 40 * S, cardY + 142 * S);
    ctx.font = `500 ${13 * S}px ${fontFamily()}`; ctx.fillStyle = rgba(theme.paper, .75); const disclaimer = state.compliance.disclaimer || Core.activeComplianceProfile(state).disclaimer;
    wrapText(ctx, disclaimer, width - 2 * margin - 380 * S, 2).forEach((line, index) => ctx.fillText(line, margin + 40 * S, cardY + (191 + index * 18) * S));
    drawLogo(ctx, width - margin - 305 * S, cardY + 58 * S, 250 * S, 110 * S, "dark");
  }
  function drawSocial(ctx, width, height, S, theme) {
    const l = state.listing; drawCover(ctx, images.hero, 0, 0, width, height, state.focal);
    const overlay = ctx.createLinearGradient(0, height * .1, 0, height); overlay.addColorStop(0, rgba(theme.ink, .04)); overlay.addColorStop(.42, rgba(theme.ink, .24)); overlay.addColorStop(1, rgba(theme.ink, .97));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, height); const margin = 60 * S; drawStatus(ctx, statusCopy(), margin, 54 * S, S, theme); drawLogo(ctx, width - 305 * S, 45 * S, 245 * S, 72 * S, "dark");
    const bottom = height - 198 * S; ctx.textAlign = "left"; ctx.fillStyle = theme.paper; fitText(ctx, l.address, width - 2 * margin, 60 * S, 34 * S, 800, serifFamily());
    const addressLines = wrapText(ctx, l.address, width - 2 * margin, 2); const lineH = 66 * S;
    addressLines.forEach((line, index) => ctx.fillText(line, margin, bottom - (addressLines.length - index) * lineH - 108 * S));
    ctx.font = `800 ${34 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; ctx.fillText(localized(`UNIT ${l.unit}`, `${l.unit} 室`), margin, bottom - 82 * S);
    fitText(ctx, priceCopy(), width - 2 * margin, 54 * S, 32 * S, 800); ctx.fillStyle = theme.paper; ctx.fillText(priceCopy(), margin, bottom);
    ctx.font = `700 ${16 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent;
    ctx.fillText(`${l.beds} ${factLabel("BED", "卧室")}  •  ${l.baths} ${factLabel("BATH", "卫浴")}  •  ${l.sqft} ${factLabel("SQ FT", "平方英尺")}`, margin, bottom + 52 * S);
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
    ctx.font = `700 ${16 * S}px ${fontFamily()}`; ctx.fillStyle = theme.accent; ctx.fillText(`${l.beds} ${factLabel("BED", "卧室")}  •  ${l.baths} ${factLabel("BATH", "卫浴")}  •  ${l.sqft} ${factLabel("SQ FT", "平方英尺")}`, margin, 448 * S);
    ctx.fillStyle = theme.ink; ctx.fillRect(0, height - 82 * S, width, 82 * S); ctx.font = `800 ${19 * S}px ${fontFamily()}`; ctx.fillStyle = theme.paper; ctx.fillText(`${state.contact.name}  •  ${state.contact.phone}`, margin, height - 42 * S);
    drawLogo(ctx, width - 300 * S, 32 * S, 240 * S, 72 * S, "dark");
  }

  function render() { drawPoster(canvas); updateValidation(); updateChangeSummary(); }
  function mediaDescriptors() {
    const output = [];
    if (state.media.heroDataUrl || state.media.heroName) output.push({kind: "hero", name: state.media.heroName || "Hero photo", dataUrl: state.media.heroDataUrl});
    state.media.gallery.forEach((item, index) => output.push({kind: "gallery", index, name: item.name || `Interior ${index + 1}`, dataUrl: item.dataUrl}));
    if (state.media.floorplanDataUrl || state.media.floorplanName) output.push({kind: "floorplan", name: state.media.floorplanName || "Floor plan", dataUrl: state.media.floorplanDataUrl});
    if (state.media.logoLightDataUrl || state.media.logoLightName) output.push({kind: "logoLight", name: state.media.logoLightName || "Light logo", dataUrl: state.media.logoLightDataUrl});
    if (state.media.logoDarkDataUrl || state.media.logoDarkName) output.push({kind: "logoDark", name: state.media.logoDarkName || "Dark logo", dataUrl: state.media.logoDarkDataUrl});
    return output;
  }
  function renderMediaList() {
    const container = document.getElementById("media-list"); const items = mediaDescriptors();
    if (!items.length) { container.innerHTML = '<div class="field-note">No local media selected. Paths imported from YAML must be reselected in the browser.</div>'; return; }
    container.innerHTML = items.map(item => {
      const gallery = item.kind === "gallery"; const label = gallery ? `Interior ${item.index + 1}` : ({hero: "Hero", floorplan: "Floor plan", logoLight: "Light logo", logoDark: "Dark logo"}[item.kind]);
      return `<div class="media-row" data-kind="${item.kind}" data-index="${item.index == null ? "" : item.index}">
        ${item.dataUrl ? `<img src="${item.dataUrl}" alt="">` : '<span class="media-placeholder" aria-hidden="true"></span>'}
        <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(item.name)}${item.dataUrl ? "" : " · reselect file"}</small></span>
        <span class="media-row-actions">${gallery ? `<button class="icon-button" data-action="up" title="Move up" ${item.index === 0 ? "disabled" : ""}>↑</button><button class="icon-button" data-action="down" title="Move down" ${item.index === state.media.gallery.length - 1 ? "disabled" : ""}>↓</button><button class="icon-button" data-action="replace" title="Replace">↻</button>` : ""}<button class="icon-button" data-action="remove" title="Remove">×</button></span>
      </div>`;
    }).join("");
  }
  function updateFocalUI() {
    const x = Math.round(state.focal[0] * 100); const y = Math.round(state.focal[1] * 100);
    focusX.value = x; focusY.value = y; document.getElementById("focus-x-output").value = `${x}%`; document.getElementById("focus-y-output").value = `${y}%`;
    focalMarker.style.left = `${x}%`; focalMarker.style.top = `${y}%`;
    focalPad.style.backgroundImage = state.media.heroDataUrl ? `linear-gradient(rgba(16,44,43,.08),rgba(16,44,43,.08)),url("${state.media.heroDataUrl}")` : "";
    focalMarker.style.display = state.media.heroDataUrl ? "block" : "none"; focalEmpty.hidden = Boolean(state.media.heroDataUrl);
  }
  function syncControls() {
    document.querySelectorAll("[data-path]").forEach(input => { const value = Core.getPath(state, input.dataset.path); if (value != null) input.value = value; });
    const profileSelect = document.getElementById("compliance-profile"); const customProfile = state.compliance.profile;
    if (customProfile && ![...profileSelect.options].some(option => option.value === state.compliance.profileId)) {
      const option = new Option(customProfile.name || "Custom profile", state.compliance.profileId); option.dataset.custom = "true"; profileSelect.add(option);
    }
    profileSelect.value = state.compliance.profileId;
    document.querySelectorAll("[data-lock]").forEach(input => { input.checked = state.template.lockedFields.includes(input.dataset.lock); });
    document.getElementById("preset-select").value = state.preset; updateFocalUI(); applyLocks(); renderMediaList();
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
    images.hero = await loadImage(state.media.heroDataUrl); images.floorplan = await loadImage(state.media.floorplanDataUrl);
    images.logoLight = await loadImage(state.media.logoLightDataUrl); images.logoDark = await loadImage(state.media.logoDarkDataUrl);
    images.gallery = await Promise.all(state.media.gallery.map(item => loadImage(item.dataUrl)));
    updateFocalUI(); renderMediaList();
  }
  async function setNamedMedia(kind, file) {
    const dataUrl = await readFile(file); state.media[`${kind}DataUrl`] = dataUrl; state.media[`${kind}Name`] = file.name; state.media[`${kind}Type`] = file.type; images[kind] = await loadImage(dataUrl);
    updateFocalUI(); renderMediaList(); render(); setStatus(`${file.name} loaded locally.`);
  }
  async function addGallery(files) {
    const available = Math.max(0, 4 - state.media.gallery.length); const selected = [...files].slice(0, available);
    for (const file of selected) { const dataUrl = await readFile(file); state.media.gallery.push({name: file.name, type: file.type, dataUrl}); images.gallery.push(await loadImage(dataUrl)); }
    if (files.length > available) setStatus("Only four interior photos are supported; additional files were skipped."); else setStatus(`${selected.length} interior photo${selected.length === 1 ? "" : "s"} loaded locally.`);
    renderMediaList(); render();
  }
  async function replaceGallery(index) {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/jpeg,image/png,image/webp";
    input.addEventListener("change", async () => { const file = input.files[0]; if (!file) return; const dataUrl = await readFile(file); state.media.gallery[index] = {name: file.name, type: file.type, dataUrl}; images.gallery[index] = await loadImage(dataUrl); renderMediaList(); render(); setStatus("Interior photo replaced locally."); });
    input.click();
  }
  function removeMedia(kind, index) {
    if (kind === "gallery") { state.media.gallery.splice(index, 1); images.gallery.splice(index, 1); }
    else { state.media[`${kind}DataUrl`] = ""; state.media[`${kind}Name`] = ""; state.media[`${kind}Type`] = ""; images[kind] = null; }
    renderMediaList(); updateFocalUI(); render(); setStatus("Media removed from this project.");
  }

  document.querySelectorAll("[data-path]").forEach(input => input.addEventListener("input", () => {
    if (state.template.lockedFields.includes(input.dataset.path)) { syncControls(); return; }
    Core.setPath(state, input.dataset.path, input.value);
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
  document.getElementById("floorplan-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("floorplan", event.target.files[0]));
  document.getElementById("logo-light-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("logoLight", event.target.files[0]));
  document.getElementById("logo-dark-upload").addEventListener("change", event => event.target.files[0] && setNamedMedia("logoDark", event.target.files[0]));
  document.getElementById("gallery-upload").addEventListener("change", event => event.target.files.length && addGallery(event.target.files));
  document.getElementById("media-list").addEventListener("click", event => {
    const button = event.target.closest("button[data-action]"); if (!button) return; const row = button.closest("[data-kind]"); const kind = row.dataset.kind; const index = Number(row.dataset.index);
    if (button.dataset.action === "remove") removeMedia(kind, index);
    else if (button.dataset.action === "replace") replaceGallery(index);
    else if (button.dataset.action === "up" && index > 0) { [state.media.gallery[index - 1], state.media.gallery[index]] = [state.media.gallery[index], state.media.gallery[index - 1]]; [images.gallery[index - 1], images.gallery[index]] = [images.gallery[index], images.gallery[index - 1]]; renderMediaList(); render(); }
    else if (button.dataset.action === "down" && index < state.media.gallery.length - 1) { [state.media.gallery[index + 1], state.media.gallery[index]] = [state.media.gallery[index], state.media.gallery[index + 1]]; [images.gallery[index + 1], images.gallery[index]] = [images.gallery[index], images.gallery[index + 1]]; renderMediaList(); render(); }
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

  function projectPayload() { const payload = Core.clone(state); payload.schemaVersion = Core.PROJECT_SCHEMA_VERSION; payload.appVersion = Core.APP_VERSION; return payload; }
  document.getElementById("save-project").addEventListener("click", () => { downloadBlob(new Blob([JSON.stringify(projectPayload(), null, 2)], {type: "application/json"}), `${slug()}.realtor-poster.json`); setStatus("Versioned portable project downloaded."); });
  document.getElementById("open-project").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try { state = Core.normalizeProject(JSON.parse(await readFile(file, "text")), DEFAULT_PROJECT); await hydrateImages(); syncControls(); render(); setStatus("Project opened locally."); }
    catch (error) { setStatus(`Could not open project: ${error.message}`); }
  });
  document.getElementById("import-listing").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const text = await readFile(file, "text"); const raw = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : Core.parseSimpleYaml(text);
      state = Core.projectFromListingData(raw, DEFAULT_PROJECT); await hydrateImages(); syncControls(); render(); setStatus("Listing data imported. Reselect local image files referenced by path.");
    } catch (error) { setStatus(`Could not import listing: ${error.message}`); }
  });
  document.getElementById("export-yaml").addEventListener("click", () => { const yaml = `${Core.toSimpleYaml(Core.toListingData(state))}\n`; downloadBlob(new Blob([yaml], {type: "text/yaml"}), `${slug()}.yaml`); setStatus("Python-compatible YAML downloaded."); });
  document.getElementById("export-json").addEventListener("click", () => { downloadBlob(new Blob([JSON.stringify(Core.toListingData(state), null, 2)], {type: "application/json"}), `${slug()}.listing.json`); setStatus("Python-compatible listing JSON downloaded."); });

  document.getElementById("save-template").addEventListener("click", () => {
    const template = Core.buildTemplate(state);
    downloadBlob(new Blob([JSON.stringify(template, null, 2)], {type: "application/json"}), `${slug()}.brand-template.json`); setStatus("Versioned brand template downloaded.");
  });
  document.getElementById("duplicate-template").addEventListener("click", () => {
    state = Core.duplicateTemplate(state); syncControls(); render(); setStatus("Template duplicated. Rename or change its version before export.");
  });
  document.getElementById("open-template").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const template = JSON.parse(await readFile(file, "text")); state = Core.applyTemplate(state, template);
      images.logoLight = await loadImage(state.media.logoLightDataUrl); images.logoDark = await loadImage(state.media.logoDarkDataUrl); syncControls(); render(); setStatus("Brand template applied without changing saved projects.");
    } catch (error) { setStatus(`Could not import template: ${error.message}`); }
  });
  document.getElementById("save-compliance").addEventListener("click", () => {
    const profile = Core.activeComplianceProfile(state); const payload = {kind: "realtor-poster-compliance", schemaVersion: 1, profile: {...profile, disclaimer: state.compliance.disclaimer}};
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"}), `${profile.id}.compliance-profile.json`); setStatus("Compliance profile downloaded.");
  });
  document.getElementById("open-compliance").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const payload = JSON.parse(await readFile(file, "text")); if (payload.kind !== "realtor-poster-compliance" || !payload.profile) throw new Error("Not a Realtor Poster compliance profile");
      state.compliance.profile = payload.profile; state.compliance.profileId = payload.profile.id || "custom"; state.compliance.disclaimer = payload.profile.disclaimer || "";
      const select = document.getElementById("compliance-profile"); if (![...select.options].some(option => option.value === state.compliance.profileId)) select.add(new Option(payload.profile.name || "Custom profile", state.compliance.profileId));
      syncControls(); render(); setStatus("Compliance profile imported.");
    } catch (error) { setStatus(`Could not import compliance profile: ${error.message}`); }
  });
  document.getElementById("compliance-profile").addEventListener("change", event => {
    const profile = Core.COMPLIANCE_PROFILES[event.target.value]; if (!profile) return; state.compliance.profile = null; state.compliance.profileId = profile.id; state.compliance.disclaimer = profile.disclaimer; syncControls(); render();
  });
  document.getElementById("open-baseline").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try { state.review.baseline = Core.normalizeProject(JSON.parse(await readFile(file, "text")), DEFAULT_PROJECT); updateChangeSummary(); setStatus("Comparison project loaded locally."); }
    catch (error) { setStatus(`Could not compare project: ${error.message}`); }
  });

  function canvasBytes(target) { return new Promise(resolve => target.toBlob(async blob => resolve(new Uint8Array(await blob.arrayBuffer())), "image/png")); }
  async function presetFile(preset) { const target = document.createElement("canvas"); drawPoster(target, preset); return {name: `${slug()}.${preset}.png`, data: await canvasBytes(target)}; }
  document.getElementById("download-png").addEventListener("click", () => {
    if (!exportGuard()) return; canvas.toBlob(blob => { downloadBlob(blob, `${slug()}.${state.preset}.png`); setStatus("Validated PNG downloaded."); }, "image/png");
  });
  document.getElementById("print-pdf").addEventListener("click", () => {
    if (!exportGuard()) return; const popup = window.open("", "poster-print", "width=900,height=1000");
    if (!popup) { setStatus("Allow pop-ups to print or save the poster as PDF."); return; }
    const data = canvas.toDataURL("image/png"); popup.document.write(`<!doctype html><title>${escapeHtml(slug())}</title><style>@page{margin:0}body{margin:0;display:grid;place-items:center;background:white}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}</style><img src="${data}" alt="Poster">`);
    popup.document.close(); popup.focus(); popup.onload = () => popup.print(); setStatus("Print dialog opened — choose Save as PDF.");
  });

  function jsonFile(name, value) { return {name, data: encoder.encode(`${JSON.stringify(value, null, 2)}\n`)}; }
  async function packageWithManifest(files) {
    const manifest = await Core.buildManifest(state, files); return [...files, jsonFile(`${slug()}.manifest.json`, manifest)];
  }
  document.getElementById("download-pack").addEventListener("click", async () => {
    if (!exportGuard()) return; setStatus("Rendering four social formats and provenance…"); const files = [];
    for (const preset of SOCIAL_PRESETS) files.push(await presetFile(preset)); files.push(jsonFile(`${slug()}.listing.json`, Core.toListingData(state)));
    downloadBlob(new Blob([Core.makeZip(await packageWithManifest(files))], {type: "application/zip"}), `${slug()}.social-pack.zip`); setStatus("Validated social ZIP with manifest downloaded.");
  });
  document.getElementById("download-manifest").addEventListener("click", async () => {
    if (!exportGuard()) return; const file = {name: `${slug()}.${state.preset}.png`, data: await canvasBytes(canvas)}; const manifest = await Core.buildManifest(state, [file]);
    downloadBlob(new Blob([`${JSON.stringify(manifest, null, 2)}\n`], {type: "application/json"}), `${slug()}.manifest.json`); setStatus("Provenance manifest downloaded.");
  });
  function proofHtml(files, changes) {
    const imagesHtml = files.filter(file => file.name.endsWith(".png")).map(file => `<figure><img src="${escapeHtml(file.name)}" alt="${escapeHtml(file.name)}"><figcaption>${escapeHtml(file.name)}</figcaption></figure>`).join("");
    const changesHtml = changes.length ? `<ul>${changes.map(change => `<li>${escapeHtml(change.path)}</li>`).join("")}</ul>` : "<p>No baseline changes recorded.</p>";
    return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(state.listing.address)} campaign proof</title><style>body{font:15px/1.45 Arial,sans-serif;margin:36px;color:#102c2b}h1,h2{font-family:Georgia,serif}header,section{margin-bottom:28px}dl{display:grid;grid-template-columns:160px 1fr;max-width:800px}dt{font-weight:700}figure{display:inline-block;width:30%;min-width:240px;vertical-align:top;margin:1%}img{max-width:100%;max-height:520px;object-fit:contain;box-shadow:0 5px 24px #0002}figcaption{font-size:12px;margin-top:6px}@media print{figure{break-inside:avoid}}</style><header><h1>${escapeHtml(state.listing.address)} · Campaign proof</h1><p>Generated locally by Realtor Poster Studio ${Core.APP_VERSION} · Daniel Xu</p></header><section><h2>Listing facts</h2><dl><dt>Status</dt><dd>${escapeHtml(state.listing.status)}</dd><dt>Price</dt><dd>${escapeHtml(priceCopy())}</dd><dt>MLS®</dt><dd>${escapeHtml(state.listing.mls)}</dd><dt>Agent</dt><dd>${escapeHtml(state.contact.name)}</dd><dt>Brokerage</dt><dd>${escapeHtml(state.brand.name)}</dd><dt>Compliance</dt><dd>${escapeHtml(Core.activeComplianceProfile(state).name)}</dd><dt>Review</dt><dd>${escapeHtml(state.review.status)} · ${escapeHtml(state.review.reviewer || "Unassigned")} · ${escapeHtml(state.review.reviewedAt || "No date")}</dd></dl></section><section><h2>Change summary</h2>${changesHtml}</section><section><h2>Artwork</h2>${imagesHtml}</section><section><h2>Reviewer notes</h2><p>${escapeHtml(state.review.notes || "No notes.")}</p><p><strong>Internal review only.</strong> This record is not an electronic signature or legal, regulatory, MLS®, or brokerage approval.</p></section>`;
  }
  document.getElementById("download-approval").addEventListener("click", async () => {
    if (!exportGuard()) return; setStatus("Building review package and integrity records…"); const files = [];
    for (const preset of Object.keys(PRESETS)) files.push(await presetFile(preset));
    const changes = state.review.baseline ? Core.diffProjects(state.review.baseline, state) : [];
    files.push(jsonFile(`${slug()}.listing.json`, Core.toListingData(state))); files.push(jsonFile(`${slug()}.project.json`, projectPayload()));
    files.push(jsonFile(`${slug()}.approval.json`, Core.buildApprovalRecord(state, changes)));
    files.push({name: `${slug()}.proof.html`, data: encoder.encode(proofHtml(files, changes))}); const packaged = await packageWithManifest(files);
    const checksums = await Promise.all(packaged.map(async file => `${await Core.sha256Bytes(file.data)}  ${file.name}`)); packaged.push({name: "SHA256SUMS.txt", data: encoder.encode(`${checksums.join("\n")}\n`)});
    downloadBlob(new Blob([Core.makeZip(packaged)], {type: "application/zip"}), `${slug()}.approval-package.zip`); setStatus("Review package downloaded with proof, source data, manifest, approval record, and SHA-256 catalog.");
  });

  document.getElementById("reset-button").addEventListener("click", async () => {
    state = Core.normalizeProject(DEFAULT_PROJECT, DEFAULT_PROJECT); await hydrateImages(); syncControls(); render(); setStatus("Workspace reset.");
  });

  hydrateImages().then(() => { syncControls(); render(); });
})();
