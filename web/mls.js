(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.RealtorPosterMls = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ERROR_COPY = Object.freeze({
    MLS_NOT_FOUND: ["Listing not found for this provider and board.", "该供应商和地产局中未找到此房源。"],
    MLS_AMBIGUOUS: ["More than one listing matched. Import is blocked.", "匹配到多个房源，已阻止导入。"],
    MLS_INCOMPLETE_IDENTITY: ["Provider, board, number, status, address, and unit context are required.", "必须保留供应商、board、编号、状态、地址和单元上下文。"],
    MLS_PROVIDER_MISMATCH: ["The response provider does not match this connector.", "响应供应商与当前连接器不一致。"],
    MLS_BOARD_MISMATCH: ["The response board does not match this connector.", "响应 board 与当前连接器不一致。"],
    MLS_NUMBER_MISMATCH: ["The returned listing number is not the exact requested number.", "返回的房源编号与请求编号不完全一致。"],
    MLS_EXPIRED: ["The listing is expired.", "该房源已过期。"],
    MLS_WITHDRAWN: ["The listing is withdrawn.", "该房源已撤销。"],
    MLS_UNAUTHORIZED: ["The connector is not authorized for this listing.", "连接器无权访问此房源。"],
    MLS_AUTH_EXPIRED: ["Provider authorization expired. Reconnect locally.", "供应商授权已过期，请在本机重新连接。"],
    MLS_RATE_LIMITED: ["Provider rate limit reached. Try again later.", "已达到供应商调用限额，请稍后重试。"],
    MLS_PROVIDER_UNAVAILABLE: ["The provider is temporarily unavailable.", "供应商服务暂时不可用。"],
    MLS_CONNECTOR_UNAVAILABLE: ["Local connector unavailable. Start it on this device.", "本机连接器不可用，请先在此设备上启动。"],
    MLS_INSECURE_URL: ["Only a connector on localhost or 127.0.0.1 is allowed.", "只允许连接 localhost 或 127.0.0.1 上的本机连接器。"],
    MLS_IMAGE_REPLACEMENT_REQUIRED: ["Upload a local replacement for this image role first.", "请先为此图片角色上传本地替代图。"],
    MLS_IMAGE_RIGHTS_DENIED: ["Provider rights prohibit reuse; use a local replacement.", "供应商权利明确禁止复用，请使用本地替代图。"],
    MLS_IMAGE_INVALID: ["A provider image could not be decoded; the project was not changed.", "供应商图片无法解码，项目未被更改。"],
  });

  function connectorBase(value) {
    let url;
    try { url = new URL(String(value || "")); } catch (_) { throw connectorError("MLS_INSECURE_URL"); }
    if (!/^https?:$/.test(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw connectorError("MLS_INSECURE_URL");
    url.pathname = url.pathname.replace(/\/$/, ""); url.search = ""; url.hash = ""; return url.toString().replace(/\/$/, "");
  }
  function connectorError(code, detail = "") {
    const copy = ERROR_COPY[code] || [detail || code, detail || code]; const error = new Error(`${copy[0]} / ${copy[1]}`);
    error.code = code; return error;
  }
  function statusCode(response, body) {
    if (body && body.error && body.error.code) return body.error.code;
    return ({401: "MLS_AUTH_EXPIRED", 403: "MLS_UNAUTHORIZED", 404: "MLS_NOT_FOUND", 410: "MLS_WITHDRAWN", 429: "MLS_RATE_LIMITED"})[response.status]
      || (response.status >= 500 ? "MLS_PROVIDER_UNAVAILABLE" : "MLS_CONNECTOR_UNAVAILABLE");
  }
  function createClient(fetchImpl) {
    if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");
    async function request(base, path, options = {}) {
      let response;
      try { response = await fetchImpl(`${connectorBase(base)}${path}`, options); }
      catch (_) { throw connectorError("MLS_CONNECTOR_UNAVAILABLE"); }
      let body = {};
      try { body = await response.json(); } catch (_) { /* status mapping supplies safe copy */ }
      if (!response.ok) throw connectorError(statusCode(response, body), body && body.error && body.error.message);
      return body;
    }
    return {
      connect(base) { return request(base, "/v1/context", {headers: {Accept: "application/json"}}); },
      lookup(base, providerId, listingNumber) {
        return request(base, "/v1/listings/lookup", {
          method: "POST", headers: {Accept: "application/json", "Content-Type": "application/json"},
          body: JSON.stringify({providerId: String(providerId || ""), listingNumber: String(listingNumber || "").trim()}),
        });
      },
    };
  }

  return {ERROR_COPY, connectorBase, connectorError, createClient};
});
