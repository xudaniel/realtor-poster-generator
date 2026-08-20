(() => {
  "use strict";

  const PRESETS = {
    poster: [1800, 2400],
    square: [1080, 1080],
    portrait: [1080, 1350],
    story: [1080, 1920],
    landscape: [1200, 630],
  };
  const SOCIAL_PRESETS = ["square", "portrait", "story", "landscape"];
  const DEFAULTS = {
    address: "88 Harbour Street", unit: "2608", status: "FOR LEASE", price: "$3,850 / month",
    mls: "C1234567", beds: "2 + Den", baths: "2", sqft: "815 sq. ft.", parking: "1",
    headline: "Lake views. Downtown energy. A home above it all.", agentName: "Daniel Xu",
    brokerage: "Harbour Realty Group", phone: "416-555-0198", email: "hello@example.com",
  };
  const state = {
    listing: {...DEFAULTS}, theme: {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"},
    focal: [0.5, 0.5], preset: "poster", heroDataUrl: "", logoDataUrl: "", hero: null, logo: null,
  };

  const canvas = document.getElementById("poster-canvas");
  const status = document.getElementById("status");
  const focalPad = document.getElementById("focal-pad");
  const focalMarker = document.getElementById("focal-marker");
  const focalEmpty = document.getElementById("focal-empty");
  const focusX = document.getElementById("focus-x");
  const focusY = document.getElementById("focus-y");
  const projectInputs = [...document.querySelectorAll("[data-field]")];

  function setStatus(message) { status.textContent = message; }
  function slug() {
    return (state.listing.address || "listing").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "listing";
  }
  function hexToRgb(hex) {
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }
  function rgba(hex, alpha) { return `rgba(${hexToRgb(hex).join(",")},${alpha})`; }
  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source;
    });
  }
  function readFile(file, mode = "data") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(reader.result);
      mode === "text" ? reader.readAsText(file) : reader.readAsDataURL(file);
    });
  }
  function downloadBlob(blob, filename) {
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }
  function roundRect(ctx, x, y, width, height, radius, fill) {
    ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fillStyle = fill; ctx.fill();
  }
  function fitText(ctx, text, maxWidth, startSize, minSize, weight = 700, family = "Arial") {
    let size = startSize;
    do { ctx.font = `${weight} ${size}px ${family}`; if (ctx.measureText(text).width <= maxWidth) return size; size -= 2; } while (size >= minSize);
    return minSize;
  }
  function wrapText(ctx, text, maxWidth, maxLines = 2) {
    const words = String(text).split(/\s+/); const lines = []; let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = word; if (lines.length === maxLines - 1) break; }
    }
    if (line && lines.length < maxLines) lines.push(line);
    const consumed = lines.join(" ").split(/\s+/).length;
    if (consumed < words.length) {
      let last = lines[lines.length - 1];
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last.trim()}…`;
    }
    return lines;
  }
  function drawCover(ctx, image, x, y, width, height, focal = [0.5, 0.5]) {
    if (!image) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "#9aaba8"); gradient.addColorStop(1, "#476260");
      ctx.fillStyle = gradient; ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "rgba(255,255,255,.11)";
      ctx.beginPath(); ctx.moveTo(x + width * .08, y + height * .78); ctx.lineTo(x + width * .38, y + height * .34);
      ctx.lineTo(x + width * .68, y + height * .78); ctx.closePath(); ctx.fill();
      return;
    }
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceW = width / scale; const sourceH = height / scale;
    const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceW, focal[0] * image.naturalWidth - sourceW / 2));
    const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceH, focal[1] * image.naturalHeight - sourceH / 2));
    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
  }
  function drawLogo(ctx, x, y, maxWidth, maxHeight) {
    if (!state.logo) return;
    const scale = Math.min(maxWidth / state.logo.naturalWidth, maxHeight / state.logo.naturalHeight, 1);
    const width = state.logo.naturalWidth * scale; const height = state.logo.naturalHeight * scale;
    ctx.drawImage(state.logo, x + (maxWidth - width) / 2, y + (maxHeight - height) / 2, width, height);
  }

  function drawPoster(target, preset = state.preset) {
    const [width, height] = PRESETS[preset]; target.width = width; target.height = height;
    const ctx = target.getContext("2d"); const l = state.listing; const theme = state.theme;
    const S = preset === "poster" ? width / 1800 : width / 1080;
    const px = value => value * S; const margin = px(62);
    ctx.clearRect(0, 0, width, height); ctx.fillStyle = theme.paper; ctx.fillRect(0, 0, width, height);
    if (preset === "poster") drawPrintPoster(ctx, width, height, S, l, theme);
    else if (preset === "landscape") drawLandscape(ctx, width, height, S, l, theme);
    else drawSocial(ctx, width, height, S, l, theme);
    ctx.fillStyle = rgba(theme.ink, .22); ctx.font = `${Math.round(px(12))}px Arial`;
    ctx.textAlign = "right"; ctx.fillText("Generated locally · Realtor Poster Studio", width - margin, height - px(14));
  }

  function drawStatus(ctx, text, x, y, scale, theme) {
    ctx.font = `800 ${24 * scale}px Arial`; const width = ctx.measureText(text).width + 42 * scale;
    roundRect(ctx, x, y, width, 56 * scale, 28 * scale, theme.accent);
    ctx.fillStyle = theme.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, x + 21 * scale, y + 29 * scale); return width;
  }

  function drawPrintPoster(ctx, width, height, S, l, theme) {
    const margin = 74 * S; const heroH = 910 * S;
    drawCover(ctx, state.hero, 0, 0, width, heroH, state.focal);
    const overlay = ctx.createLinearGradient(0, 0, 0, heroH);
    overlay.addColorStop(0, rgba(theme.ink, .1)); overlay.addColorStop(.58, rgba(theme.ink, .24)); overlay.addColorStop(1, rgba(theme.ink, .94));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, heroH);
    drawStatus(ctx, l.status, margin, 68 * S, S, theme); drawLogo(ctx, width - 350 * S, 58 * S, 270 * S, 82 * S);
    ctx.fillStyle = theme.paper; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    fitText(ctx, l.address, width - 2 * margin, 84 * S, 48 * S, 800, "Georgia");
    ctx.fillText(l.address, margin, 650 * S);
    ctx.font = `700 ${46 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(`UNIT ${l.unit}`, margin, 720 * S);
    ctx.font = `800 ${72 * S}px Arial`; ctx.fillStyle = theme.paper; ctx.fillText(l.price, margin, 822 * S);
    ctx.textAlign = "right"; ctx.font = `700 ${24 * S}px Arial`; ctx.fillText(`MLS® ${l.mls}`, width - margin, 814 * S);

    const factsTop = heroH; const factsH = 190 * S; ctx.fillStyle = theme.ink; ctx.fillRect(0, factsTop, width, factsH);
    const facts = [[l.beds, "BEDS"], [l.baths, "BATHS"], [l.sqft, "AREA"], [l.parking, "PARKING"]];
    facts.forEach(([value, label], index) => {
      const cellW = width / facts.length; const x = cellW * index + cellW / 2;
      if (index) { ctx.fillStyle = rgba(theme.paper, .2); ctx.fillRect(cellW * index, factsTop + 38 * S, 2 * S, 114 * S); }
      ctx.textAlign = "center"; ctx.fillStyle = theme.paper; fitText(ctx, value, cellW - 40 * S, 38 * S, 25 * S, 800);
      ctx.fillText(value, x, factsTop + 85 * S); ctx.font = `700 ${16 * S}px Arial`; ctx.fillStyle = theme.accent;
      ctx.fillText(label, x, factsTop + 128 * S);
    });

    const contentTop = factsTop + factsH; ctx.fillStyle = theme.paper; ctx.fillRect(0, contentTop, width, height - contentTop);
    ctx.textAlign = "left"; ctx.fillStyle = theme.ink; ctx.font = `700 ${25 * S}px Arial`; ctx.fillText("A REMARKABLE PLACE TO LIVE", margin, contentTop + 94 * S);
    ctx.font = `700 ${58 * S}px Georgia`; const lines = wrapText(ctx, l.headline, width - 2 * margin, 3);
    lines.forEach((line, i) => ctx.fillText(line, margin, contentTop + (174 + i * 70) * S));
    const dividerY = contentTop + 440 * S; ctx.fillStyle = theme.accent; ctx.fillRect(margin, dividerY, width - 2 * margin, 3 * S);

    const featureY = dividerY + 92 * S; const features = [
      ["LIGHT", "Floor-to-ceiling windows"], ["LOCATION", "Steps to transit and waterfront"],
      ["LAYOUT", "Flexible den and generous storage"], ["LIFESTYLE", "Amenities for work and wellness"],
    ];
    features.forEach(([title, copy], i) => {
      const col = i % 2; const row = Math.floor(i / 2); const x = margin + col * (width / 2 - margin / 2); const y = featureY + row * 138 * S;
      ctx.font = `800 ${17 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(title, x, y);
      ctx.font = `500 ${25 * S}px Arial`; ctx.fillStyle = theme.ink; ctx.fillText(copy, x, y + 42 * S);
    });

    const cardY = height - 360 * S; roundRect(ctx, margin, cardY, width - 2 * margin, 244 * S, 22 * S, theme.ink);
    ctx.fillStyle = theme.paper; ctx.font = `800 ${42 * S}px Georgia`; ctx.fillText(l.agentName, margin + 42 * S, cardY + 75 * S);
    ctx.font = `700 ${18 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(l.brokerage.toUpperCase(), margin + 42 * S, cardY + 114 * S);
    ctx.font = `500 ${21 * S}px Arial`; ctx.fillStyle = theme.paper; ctx.fillText(`${l.phone}   •   ${l.email}`, margin + 42 * S, cardY + 171 * S);
    drawLogo(ctx, width - margin - 300 * S, cardY + 52 * S, 250 * S, 120 * S);
  }

  function drawSocial(ctx, width, height, S, l, theme) {
    drawCover(ctx, state.hero, 0, 0, width, height, state.focal);
    const overlay = ctx.createLinearGradient(0, height * .12, 0, height);
    overlay.addColorStop(0, rgba(theme.ink, .04)); overlay.addColorStop(.42, rgba(theme.ink, .24)); overlay.addColorStop(1, rgba(theme.ink, .96));
    ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, height);
    const margin = 60 * S; drawStatus(ctx, l.status, margin, 54 * S, S, theme); drawLogo(ctx, width - 305 * S, 45 * S, 245 * S, 72 * S);
    const bottom = height - 198 * S;
    ctx.textAlign = "left"; ctx.fillStyle = theme.paper; fitText(ctx, l.address, width - 2 * margin, 62 * S, 36 * S, 800, "Georgia");
    const addressLines = wrapText(ctx, l.address, width - 2 * margin, 2); const lineH = 68 * S;
    addressLines.forEach((line, i) => ctx.fillText(line, margin, bottom - (addressLines.length - i) * lineH - 108 * S));
    ctx.font = `800 ${38 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(`UNIT ${l.unit}`, margin, bottom - 82 * S);
    fitText(ctx, l.price, width - 2 * margin, 58 * S, 34 * S, 800); ctx.fillStyle = theme.paper; ctx.fillText(l.price, margin, bottom);
    ctx.font = `700 ${18 * S}px Arial`; ctx.fillStyle = theme.accent;
    ctx.fillText(`${l.beds} BED  •  ${l.baths} BATH  •  ${l.sqft}`, margin, bottom + 55 * S);
    ctx.fillStyle = theme.ink; ctx.fillRect(0, height - 116 * S, width, 116 * S);
    ctx.font = `800 ${23 * S}px Arial`; ctx.fillStyle = theme.paper; ctx.fillText(l.agentName, margin, height - 63 * S);
    ctx.textAlign = "right"; fitText(ctx, l.phone, width * .42, 20 * S, 14 * S, 600); ctx.fillText(l.phone, width - margin, height - 63 * S);
  }

  function drawLandscape(ctx, width, height, S, l, theme) {
    drawCover(ctx, state.hero, 0, 0, width, height, state.focal);
    ctx.fillStyle = rgba(theme.ink, .94); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width * .67, 0); ctx.lineTo(width * .56, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
    const margin = 60 * S; drawStatus(ctx, l.status, margin, 36 * S, S, theme);
    ctx.textAlign = "left"; ctx.fillStyle = theme.paper; fitText(ctx, l.address, 560 * S, 52 * S, 31 * S, 800, "Georgia");
    const lines = wrapText(ctx, l.address, 560 * S, 2); lines.forEach((line, i) => ctx.fillText(line, margin, (175 + i * 58) * S));
    ctx.font = `800 ${34 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(`UNIT ${l.unit}`, margin, 304 * S);
    fitText(ctx, l.price, 560 * S, 56 * S, 32 * S, 800); ctx.fillStyle = theme.paper; ctx.fillText(l.price, margin, 395 * S);
    ctx.font = `700 ${17 * S}px Arial`; ctx.fillStyle = theme.accent; ctx.fillText(`${l.beds} BED  •  ${l.baths} BATH  •  ${l.sqft}`, margin, 452 * S);
    ctx.fillStyle = theme.ink; ctx.fillRect(0, height - 82 * S, width, 82 * S);
    ctx.font = `800 ${20 * S}px Arial`; ctx.fillStyle = theme.paper; ctx.fillText(`${l.agentName}  •  ${l.phone}`, margin, height - 42 * S);
    drawLogo(ctx, width - 300 * S, 32 * S, 240 * S, 72 * S);
  }

  function render() { drawPoster(canvas); }
  function syncControls() {
    projectInputs.forEach(input => { input.value = state.listing[input.dataset.field] ?? ""; });
    document.querySelector('[data-color="accent"]').value = state.theme.accent;
    document.querySelector('[data-color="ink"]').value = state.theme.ink;
    document.getElementById("preset-select").value = state.preset;
    focusX.value = Math.round(state.focal[0] * 100); focusY.value = Math.round(state.focal[1] * 100); updateFocalUI();
  }
  function updateFocalUI() {
    const x = Math.round(state.focal[0] * 100); const y = Math.round(state.focal[1] * 100);
    document.getElementById("focus-x-output").value = `${x}%`; document.getElementById("focus-y-output").value = `${y}%`;
    focalMarker.style.left = `${x}%`; focalMarker.style.top = `${y}%`;
  }
  async function setImage(kind, source) {
    state[`${kind}DataUrl`] = source; state[kind] = source ? await loadImage(source) : null;
    if (kind === "hero") {
      focalPad.style.backgroundImage = source ? `linear-gradient(rgba(16,44,43,.08),rgba(16,44,43,.08)),url("${source}")` : "";
      focalMarker.style.display = source ? "block" : "none"; focalEmpty.hidden = Boolean(source);
    }
    render();
  }

  projectInputs.forEach(input => input.addEventListener("input", () => { state.listing[input.dataset.field] = input.value; render(); }));
  document.querySelectorAll("[data-color]").forEach(input => input.addEventListener("input", () => {
    state.theme[input.dataset.color] = input.value; document.documentElement.style.setProperty(`--${input.dataset.color}`, input.value); render();
  }));
  document.getElementById("preset-select").addEventListener("change", event => { state.preset = event.target.value; render(); });
  document.getElementById("hero-upload").addEventListener("change", async event => {
    if (event.target.files[0]) { await setImage("hero", await readFile(event.target.files[0])); setStatus("Hero photo loaded locally."); }
  });
  document.getElementById("logo-upload").addEventListener("change", async event => {
    if (event.target.files[0]) { await setImage("logo", await readFile(event.target.files[0])); setStatus("Logo loaded locally."); }
  });
  function setFocalFromEvent(event) {
    const rect = focalPad.getBoundingClientRect(); state.focal = [
      Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    ]; focusX.value = Math.round(state.focal[0] * 100); focusY.value = Math.round(state.focal[1] * 100); updateFocalUI(); render();
  }
  focalPad.addEventListener("click", setFocalFromEvent);
  focalPad.addEventListener("keydown", event => {
    const delta = event.shiftKey ? .05 : .01; let [x, y] = state.focal;
    if (event.key === "ArrowLeft") x -= delta; else if (event.key === "ArrowRight") x += delta;
    else if (event.key === "ArrowUp") y -= delta; else if (event.key === "ArrowDown") y += delta; else return;
    event.preventDefault(); state.focal = [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
    focusX.value = Math.round(state.focal[0] * 100); focusY.value = Math.round(state.focal[1] * 100); updateFocalUI(); render();
  });
  [focusX, focusY].forEach(input => input.addEventListener("input", () => {
    state.focal = [Number(focusX.value) / 100, Number(focusY.value) / 100]; updateFocalUI(); render();
  }));

  document.getElementById("download-png").addEventListener("click", () => canvas.toBlob(blob => {
    downloadBlob(blob, `${slug()}.${state.preset}.png`); setStatus("PNG downloaded.");
  }, "image/png"));
  document.getElementById("print-pdf").addEventListener("click", () => {
    const popup = window.open("", "poster-print", "width=900,height=1000");
    if (!popup) { setStatus("Allow pop-ups to print or save the poster as PDF."); return; }
    const data = canvas.toDataURL("image/png");
    popup.document.write(`<!doctype html><title>${slug()}</title><style>@page{margin:0}body{margin:0;display:grid;place-items:center;background:white}img{display:block;max-width:100%;max-height:100vh;object-fit:contain}</style><img src="${data}" alt="Poster">`);
    popup.document.close(); popup.focus(); popup.onload = () => popup.print(); setStatus("Print dialog opened — choose Save as PDF.");
  });

  function projectPayload() {
    return {version: 1, listing: state.listing, theme: state.theme, focal: state.focal, preset: state.preset, heroDataUrl: state.heroDataUrl, logoDataUrl: state.logoDataUrl};
  }
  document.getElementById("save-project").addEventListener("click", () => {
    downloadBlob(new Blob([JSON.stringify(projectPayload(), null, 2)], {type: "application/json"}), `${slug()}.realtor-poster.json`); setStatus("Portable project downloaded.");
  });
  document.getElementById("open-project").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const saved = JSON.parse(await readFile(file, "text"));
      Object.assign(state.listing, saved.listing || {}); Object.assign(state.theme, saved.theme || {});
      if (Array.isArray(saved.focal) && saved.focal.length === 2) state.focal = saved.focal;
      if (PRESETS[saved.preset]) state.preset = saved.preset;
      await setImage("hero", saved.heroDataUrl || ""); await setImage("logo", saved.logoDataUrl || ""); syncControls(); render(); setStatus("Project opened locally.");
    } catch (error) { setStatus(`Could not open project: ${error.message}`); }
  });
  document.getElementById("reset-button").addEventListener("click", async () => {
    state.listing = {...DEFAULTS}; state.theme = {accent: "#d6a25e", ink: "#102c2b", paper: "#fffdf8"}; state.focal = [.5, .5]; state.preset = "poster";
    await setImage("hero", ""); await setImage("logo", ""); syncControls(); render(); setStatus("Workspace reset.");
  });

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function write16(view, offset, value) { view.setUint16(offset, value, true); }
  function write32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }
  function makeZip(files) {
    const encoder = new TextEncoder(); const prepared = files.map(file => ({...file, nameBytes: encoder.encode(file.name), crc: crc32(file.data)}));
    const localSize = prepared.reduce((sum, file) => sum + 30 + file.nameBytes.length + file.data.length, 0);
    const centralSize = prepared.reduce((sum, file) => sum + 46 + file.nameBytes.length, 0);
    const output = new Uint8Array(localSize + centralSize + 22); const view = new DataView(output.buffer); let offset = 0; const records = [];
    for (const file of prepared) {
      const start = offset; write32(view, offset, 0x04034b50); write16(view, offset + 4, 20); write16(view, offset + 6, 0x0800);
      write16(view, offset + 8, 0); write16(view, offset + 10, 0); write16(view, offset + 12, 0); write32(view, offset + 14, file.crc);
      write32(view, offset + 18, file.data.length); write32(view, offset + 22, file.data.length); write16(view, offset + 26, file.nameBytes.length); write16(view, offset + 28, 0);
      output.set(file.nameBytes, offset + 30); output.set(file.data, offset + 30 + file.nameBytes.length); offset += 30 + file.nameBytes.length + file.data.length;
      records.push({file, start});
    }
    const centralStart = offset;
    for (const {file, start} of records) {
      write32(view, offset, 0x02014b50); write16(view, offset + 4, 20); write16(view, offset + 6, 20); write16(view, offset + 8, 0x0800);
      write16(view, offset + 10, 0); write16(view, offset + 12, 0); write16(view, offset + 14, 0); write32(view, offset + 16, file.crc);
      write32(view, offset + 20, file.data.length); write32(view, offset + 24, file.data.length); write16(view, offset + 28, file.nameBytes.length);
      write16(view, offset + 30, 0); write16(view, offset + 32, 0); write16(view, offset + 34, 0); write16(view, offset + 36, 0); write32(view, offset + 38, 0); write32(view, offset + 42, start);
      output.set(file.nameBytes, offset + 46); offset += 46 + file.nameBytes.length;
    }
    write32(view, offset, 0x06054b50); write16(view, offset + 4, 0); write16(view, offset + 6, 0); write16(view, offset + 8, records.length);
    write16(view, offset + 10, records.length); write32(view, offset + 12, centralSize); write32(view, offset + 16, centralStart); write16(view, offset + 20, 0);
    return output;
  }
  function canvasBytes(target) {
    return new Promise(resolve => target.toBlob(async blob => resolve(new Uint8Array(await blob.arrayBuffer())), "image/png"));
  }
  document.getElementById("download-pack").addEventListener("click", async () => {
    setStatus("Rendering four social formats…"); const files = [];
    for (const preset of SOCIAL_PRESETS) {
      const target = document.createElement("canvas"); drawPoster(target, preset); files.push({name: `${slug()}.${preset}.png`, data: await canvasBytes(target)});
    }
    const listing = new TextEncoder().encode(JSON.stringify({...projectPayload(), heroDataUrl: "", logoDataUrl: ""}, null, 2));
    files.push({name: `${slug()}.listing.json`, data: listing});
    downloadBlob(new Blob([makeZip(files)], {type: "application/zip"}), `${slug()}.social-pack.zip`); setStatus("Social campaign ZIP downloaded.");
  });

  syncControls(); render();
})();
