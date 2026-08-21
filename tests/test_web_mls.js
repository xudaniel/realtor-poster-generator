"use strict";

const assert = require("assert");
const Mls = require("../web/mls.js");

(async () => {
  assert.equal(Mls.connectorBase("http://127.0.0.1:8766/"), "http://127.0.0.1:8766");
  assert.equal(Mls.connectorBase("https://localhost:9443"), "https://localhost:9443");
  assert.throws(() => Mls.connectorBase("https://provider.example"), error => error.code === "MLS_INSECURE_URL");
  assert.throws(() => Mls.connectorBase("file:///tmp/connector"), error => error.code === "MLS_INSECURE_URL");

  const calls = [];
  const client = Mls.createClient(async (url, options) => {
    calls.push({url, options});
    return {ok: true, status: 200, json: async () => url.endsWith("/v1/context")
      ? {provider: {id: "synthetic", name: "Synthetic", board: "BOARD"}}
      : {provider: {id: "synthetic", name: "Synthetic", board: "BOARD"}, matches: []}};
  });
  const context = await client.connect("http://localhost:8766");
  assert.equal(context.provider.board, "BOARD");
  await client.lookup("http://localhost:8766", "synthetic", "SYN-1");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "http://localhost:8766/v1/listings/lookup");
  assert.deepEqual(JSON.parse(calls[1].options.body), {providerId: "synthetic", listingNumber: "SYN-1"});
  assert.doesNotMatch(calls[1].options.body, /token|secret|credential|password/i);

  const authClient = Mls.createClient(async () => ({ok: false, status: 401, json: async () => ({error: {code: "MLS_AUTH_EXPIRED"}})}));
  await assert.rejects(() => authClient.connect("http://127.0.0.1:8766"), error => error.code === "MLS_AUTH_EXPIRED" && /授权已过期/.test(error.message));
  const rateClient = Mls.createClient(async () => ({ok: false, status: 429, json: async () => ({})}));
  await assert.rejects(() => rateClient.connect("http://127.0.0.1:8766"), error => error.code === "MLS_RATE_LIMITED");
  const outageClient = Mls.createClient(async () => { throw new Error("offline"); });
  await assert.rejects(() => outageClient.connect("http://127.0.0.1:8766"), error => error.code === "MLS_CONNECTOR_UNAVAILABLE");

  console.log("Browser MLS connector tests passed.");
})().catch(error => { console.error(error); process.exit(1); });
