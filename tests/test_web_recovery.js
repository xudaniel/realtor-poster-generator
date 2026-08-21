"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const Recovery = require("../web/recovery.js");

function project(overrides = {}) {
  return {
    schemaVersion: 4,
    appVersion: "1.4.0",
    projectId: "project-listing-a",
    listing: {address: "88 Harbour Street", unit: "2608", price: "$3,850"},
    media: {
      heroName: "hero.png",
      heroDataUrl: "data:image/png;base64,AAEC",
      gallery: [{name: "living.png", type: "image/png", dataUrl: "data:image/png;base64,AwQF"}],
      floorplans: [{role: "technical2d", name: "plan.png", dataUrl: "data:image/png;base64,BgcI"}],
    },
    modules: {spotlights: [{id: "laundry", name: "laundry.png", dataUrl: "data:image/png;base64,CQoL", titleEn: "Laundry"}]},
    ...overrides,
  };
}

class FakeIndexedDb {
  constructor() { this.databases = new Map(); this.failWrites = false; }
  open(name) {
    const request = {};
    queueMicrotask(() => {
      let database = this.databases.get(name);
      const created = !database;
      if (!database) {
        const stores = new Map();
        database = {
          objectStoreNames: {contains: storeName => stores.has(storeName)},
          createObjectStore: storeName => { const records = new Map(); stores.set(storeName, records); return {createIndex() {}}; },
          transaction: (storeName, mode) => {
            const transaction = {error: null};
            const records = stores.get(storeName);
            const finish = error => queueMicrotask(() => {
              if (error) { transaction.error = error; if (transaction.onerror) transaction.onerror(); }
              else if (transaction.oncomplete) transaction.oncomplete();
            });
            const requestFor = operation => {
              const child = {};
              queueMicrotask(() => {
                try { child.result = operation(); if (child.onsuccess) child.onsuccess(); finish(); }
                catch (error) { child.error = error; if (child.onerror) child.onerror(); finish(error); }
              });
              return child;
            };
            transaction.objectStore = () => ({
              put: value => {
                queueMicrotask(() => {
                  if (this.failWrites) { finish(Object.assign(new Error("quota full"), {name: "QuotaExceededError"})); return; }
                  records.set(value.projectId, JSON.parse(JSON.stringify(value))); finish();
                });
              },
              get: key => requestFor(() => records.has(key) ? JSON.parse(JSON.stringify(records.get(key))) : undefined),
              getAll: () => requestFor(() => [...records.values()].map(value => JSON.parse(JSON.stringify(value)))),
              delete: key => queueMicrotask(() => { records.delete(key); finish(); }),
              clear: () => queueMicrotask(() => { records.clear(); finish(); }),
            });
            return transaction;
          },
        };
        this.databases.set(name, database);
      }
      request.result = database;
      if (created && request.onupgradeneeded) request.onupgradeneeded();
      if (request.onsuccess) request.onsuccess();
    });
    return request;
  }
}

(async () => {
  assert.equal(Recovery.SNAPSHOT_KIND, "realtor-poster-recovery");
  assert.equal(Recovery.RECOVERY_SCHEMA_VERSION, 1);

  const source = project();
  const snapshot = Recovery.createSnapshot(source, {
    reason: "before-png-export",
    savedAt: "2026-08-20T20:30:00.000Z",
    scrollY: 480,
    tabId: "tab-test",
  });
  assert.deepEqual(Recovery.validateSnapshot(snapshot, {maxProjectSchemaVersion: 4}), {ok: true, error: ""});
  assert.equal(snapshot.projectId, "project-listing-a");
  assert.equal(snapshot.projectName, "88 Harbour Street · Unit 2608");
  assert.equal(snapshot.reason, "before-png-export");
  assert.equal(snapshot.scrollY, 480);
  assert.equal(snapshot.project.media.heroDataUrl, source.media.heroDataUrl);
  assert.equal(snapshot.project.media.gallery[0].dataUrl, source.media.gallery[0].dataUrl);
  assert.equal(snapshot.project.media.floorplans[0].dataUrl, source.media.floorplans[0].dataUrl);
  assert.equal(snapshot.project.modules.spotlights[0].dataUrl, source.modules.spotlights[0].dataUrl);
  snapshot.project.listing.price = "$4,000";
  assert.equal(source.listing.price, "$3,850", "snapshots must not mutate live editor state");

  const generated = project({projectId: ""});
  const id = Recovery.ensureProjectId(generated, prefix => `${prefix}-generated`);
  assert.equal(id, "project-generated");
  assert.equal(generated.projectId, "project-generated");

  const older = Recovery.createSnapshot(project({projectId: "project-old"}), {savedAtMs: 100, savedAt: "1970-01-01T00:00:00.100Z"});
  const newer = Recovery.createSnapshot(project({projectId: "project-new"}), {savedAtMs: 200, savedAt: "1970-01-01T00:00:00.200Z"});
  assert.equal(Recovery.newestSnapshot([older, newer]).projectId, "project-new");
  assert.equal(Recovery.snapshotFingerprint(newer), "project-new:200");

  assert.equal(Recovery.validateSnapshot({...snapshot, kind: "other"}).ok, false);
  assert.equal(Recovery.validateSnapshot({...snapshot, recoverySchemaVersion: 99}).ok, false);
  assert.equal(Recovery.validateSnapshot({...snapshot, projectSchemaVersion: 5}, {maxProjectSchemaVersion: 4}).ok, false);
  assert.equal(Recovery.validateSnapshot({...snapshot, project: null}).ok, false);
  assert.equal(Recovery.validateSnapshot({...snapshot, projectId: "project-mismatch"}).ok, false);

  const indexedDb = new FakeIndexedDb();
  const store = new Recovery.IndexedDbDraftStore(indexedDb, {databaseName: "recovery-integration"});
  await store.open();
  await store.save(older); await store.save(newer);
  assert.equal((await store.get("project-old")).projectName, older.projectName);
  assert.deepEqual((await store.list()).map(item => item.projectId), ["project-new", "project-old"]);
  assert.equal((await store.latest()).projectId, "project-new");
  await store.delete("project-old");
  assert.equal(await store.get("project-old"), null);
  await store.clear();
  assert.deepEqual(await store.list(), []);
  indexedDb.failWrites = true;
  await assert.rejects(store.save(newer), /quota full/);

  const app = fs.readFileSync(path.join(__dirname, "../web/app.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "../web/index.html"), "utf8");
  assert.match(app, /before-png-export/);
  assert.match(app, /before-pdf-export/);
  assert.match(app, /before-reset/);
  assert.match(app, /before-open-project", \{requireSaved: true\}/);
  assert.match(app, /before-import-listing", \{requireSaved: true\}/);
  assert.match(app, /before-template-import", \{requireSaved: true\}/);
  assert.match(app, /before-compliance-import", \{requireSaved: true\}/);
  assert.match(app, /before-reset", \{requireSaved: true\}/);
  assert.match(app, /visibility-hidden/);
  assert.match(app, /BroadcastChannel/);
  assert.match(html, /id="restore-draft"/);
  assert.match(html, /src="recovery\.js"/);

  console.log("Browser recovery tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
