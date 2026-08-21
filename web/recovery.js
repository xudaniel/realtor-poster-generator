(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RealtorPosterRecovery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SNAPSHOT_KIND = "realtor-poster-recovery";
  const RECOVERY_SCHEMA_VERSION = 1;
  const DATABASE_NAME = "realtor-poster-studio";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "drafts";
  const CHANNEL_NAME = "realtor-poster-recovery";

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function newProjectId(prefix = "project") {
    const uuid = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return `${prefix}-${uuid}`;
  }

  function ensureProjectId(project, createId = newProjectId) {
    if (!project || typeof project !== "object" || Array.isArray(project)) throw new Error("A project object is required");
    if (!String(project.projectId || "").trim()) project.projectId = createId("project");
    return project.projectId;
  }

  function projectName(project) {
    const address = String(project && project.listing && project.listing.address || "").trim();
    const unit = String(project && project.listing && project.listing.unit || "").trim();
    return [address || "Untitled listing", unit && `Unit ${unit}`].filter(Boolean).join(" · ");
  }

  function createSnapshot(project, options = {}) {
    const projectCopy = clone(project);
    const projectId = ensureProjectId(projectCopy, options.createId || newProjectId);
    const savedAt = options.savedAt || new Date().toISOString();
    const savedAtMs = Number.isFinite(options.savedAtMs) ? options.savedAtMs : Date.parse(savedAt);
    return {
      kind: SNAPSHOT_KIND,
      recoverySchemaVersion: RECOVERY_SCHEMA_VERSION,
      projectSchemaVersion: Number(projectCopy.schemaVersion || 0),
      appVersion: String(projectCopy.appVersion || ""),
      projectId,
      projectName: projectName(projectCopy),
      savedAt,
      savedAtMs: Number.isFinite(savedAtMs) ? savedAtMs : Date.now(),
      reason: String(options.reason || "autosave"),
      scrollY: Math.max(0, Number(options.scrollY || 0)),
      tabId: String(options.tabId || ""),
      project: projectCopy,
    };
  }

  function validateSnapshot(snapshot, options = {}) {
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return {ok: false, error: "Recovery record is not an object."};
    if (snapshot.kind !== SNAPSHOT_KIND) return {ok: false, error: "Recovery record type is not supported."};
    if (Number(snapshot.recoverySchemaVersion) > RECOVERY_SCHEMA_VERSION) return {ok: false, error: "Recovery record was created by a newer version."};
    if (!snapshot.project || typeof snapshot.project !== "object" || Array.isArray(snapshot.project)) return {ok: false, error: "Recovery record does not contain a project."};
    if (!String(snapshot.projectId || "").trim()) return {ok: false, error: "Recovery record has no project identifier."};
    if (snapshot.project.projectId && snapshot.project.projectId !== snapshot.projectId) return {ok: false, error: "Recovery project identifier does not match its record."};
    if (Number.isFinite(options.maxProjectSchemaVersion) && Number(snapshot.projectSchemaVersion || 0) > options.maxProjectSchemaVersion) {
      return {ok: false, error: "Project data was created by a newer version."};
    }
    if (!Number.isFinite(Number(snapshot.savedAtMs))) return {ok: false, error: "Recovery record has no valid saved time."};
    return {ok: true, error: ""};
  }

  function newestSnapshot(snapshots) {
    return (snapshots || []).slice().sort((left, right) => Number(right.savedAtMs || 0) - Number(left.savedAtMs || 0))[0] || null;
  }

  function snapshotFingerprint(snapshot) {
    return snapshot ? `${snapshot.projectId}:${Number(snapshot.savedAtMs || 0)}` : "";
  }

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Browser storage request failed"));
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error || new Error("Browser storage transaction was aborted"));
      transaction.onerror = () => reject(transaction.error || new Error("Browser storage transaction failed"));
    });
  }

  class IndexedDbDraftStore {
    constructor(indexedDb = globalThis.indexedDB, options = {}) {
      if (!indexedDb || typeof indexedDb.open !== "function") throw new Error("IndexedDB is unavailable in this browser.");
      this.indexedDb = indexedDb;
      this.databaseName = options.databaseName || DATABASE_NAME;
      this.databaseVersion = options.databaseVersion || DATABASE_VERSION;
      this.storeName = options.storeName || STORE_NAME;
      this.databasePromise = null;
    }

    open() {
      if (this.databasePromise) return this.databasePromise;
      this.databasePromise = new Promise((resolve, reject) => {
        const request = this.indexedDb.open(this.databaseName, this.databaseVersion);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(this.storeName)) {
            const store = database.createObjectStore(this.storeName, {keyPath: "projectId"});
            store.createIndex("savedAtMs", "savedAtMs");
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { this.databasePromise = null; reject(request.error || new Error("Could not open browser recovery storage")); };
        request.onblocked = () => { this.databasePromise = null; reject(new Error("Browser recovery storage upgrade is blocked by another tab")); };
      });
      return this.databasePromise;
    }

    async save(snapshot) {
      const validation = validateSnapshot(snapshot);
      if (!validation.ok) throw new Error(validation.error);
      const database = await this.open();
      const transaction = database.transaction(this.storeName, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(this.storeName).put(clone(snapshot));
      await done;
      return snapshot;
    }

    async get(projectId) {
      const database = await this.open();
      const transaction = database.transaction(this.storeName, "readonly");
      const done = transactionDone(transaction);
      const result = await requestResult(transaction.objectStore(this.storeName).get(projectId));
      await done;
      return result || null;
    }

    async list() {
      const database = await this.open();
      const transaction = database.transaction(this.storeName, "readonly");
      const done = transactionDone(transaction);
      const store = transaction.objectStore(this.storeName);
      let records;
      if (typeof store.getAll === "function") records = await requestResult(store.getAll());
      else records = await new Promise((resolve, reject) => {
        const output = []; const request = store.openCursor();
        request.onsuccess = () => { const cursor = request.result; if (!cursor) { resolve(output); return; } output.push(cursor.value); cursor.continue(); };
        request.onerror = () => reject(request.error || new Error("Could not list browser recovery records"));
      });
      await done;
      return records.slice().sort((left, right) => Number(right.savedAtMs || 0) - Number(left.savedAtMs || 0));
    }

    async latest() { return newestSnapshot(await this.list()); }

    async delete(projectId) {
      const database = await this.open();
      const transaction = database.transaction(this.storeName, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(this.storeName).delete(projectId);
      await done;
    }

    async clear() {
      const database = await this.open();
      const transaction = database.transaction(this.storeName, "readwrite");
      const done = transactionDone(transaction);
      transaction.objectStore(this.storeName).clear();
      await done;
    }
  }

  return {
    SNAPSHOT_KIND, RECOVERY_SCHEMA_VERSION, DATABASE_NAME, STORE_NAME, CHANNEL_NAME,
    newProjectId, ensureProjectId, projectName, createSnapshot, validateSnapshot,
    newestSnapshot, snapshotFingerprint, IndexedDbDraftStore,
  };
});
