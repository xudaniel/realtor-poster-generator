# Authorized MLS connector contract / 获授权 MLS 连接器合同

This contract is a provider-neutral boundary for v1.4.3. It is not an MLS feed, provider credential, licence, or permission grant. Each real provider requires an operator-authorized adapter that converts its official or contractual response into this shape. The editor never scrapes a public page or guesses a field.

本合同是 v1.4.3 的供应商中立边界，不是 MLS 数据源、供应商凭证、许可证或授权。每个真实供应商都需要一个经操作者授权的适配器，把官方或合同响应转换为此结构。编辑器不会抓取公开网页，也不会猜测字段。

The machine-readable field envelope is in [`mls-normalized-contract.schema.json`](mls-normalized-contract.schema.json). One lookup returns:

```json
{
  "provider": {"id": "provider-id", "name": "Provider name", "board": "BOARD"},
  "retrievedAt": "2026-08-21T12:00:00Z",
  "stale": false,
  "matches": [{
    "providerId": "provider-id",
    "board": "BOARD",
    "listingNumber": "EXACT-NUMBER",
    "status": "FOR LEASE",
    "address": "Literal provider value",
    "unit": "Literal provider value or an explicit empty string",
    "city": "Literal provider value",
    "postalCode": "Literal provider value",
    "price": "Literal provider value",
    "rentPeriod": "Literal provider value",
    "beds": "2",
    "bedsAdditional": "1",
    "baths": "2",
    "sqft": "800-899",
    "floor": "12th",
    "exposure": "South",
    "balcony": "Open balcony",
    "parking": "1 space",
    "availability": "Literal provider value",
    "openHouse": "Literal provider value",
    "descriptionEn": "Literal provider value",
    "descriptionZh": "Literal provider value when actually supplied",
    "headlineEn": "Literal provider value",
    "headlineZh": "Literal provider value when actually supplied",
    "featuresEn": ["Literal provider value"],
    "featuresZh": ["Literal provider value when actually supplied"],
    "sourceUpdatedAt": "2026-08-21T11:55:00Z",
    "propertyFacts": [],
    "spotlights": [],
    "leaseDetails": [],
    "includedCosts": [],
    "tenantPaidCosts": [],
    "amenities": [],
    "applicationRequirements": [],
    "images": [{
      "sourceId": "provider-image-id",
      "role": "hero",
      "order": 0,
      "caption": "Literal provider caption",
      "pixelWidth": 1800,
      "pixelHeight": 1200,
      "rightsStatus": "permitted",
      "reuseAllowed": true,
      "name": "listing-image.jpg",
      "type": "image/jpeg",
      "dataUrl": "data:image/jpeg;base64,..."
    }]
  }]
}
```

Rules / 规则:

- `matches` must contain exactly one record before import. / 导入前 `matches` 必须且只能包含一条记录。
- `providerId`, `board`, and `listingNumber` must exactly match the connection/request context. / `providerId`、`board` 和 `listingNumber` 必须与连接及请求上下文准确一致。
- `status`, `address`, and the presence of `unit` are mandatory identity context. An empty unit is permitted when it is the provider's explicit value. / `status`、`address` 以及明确存在的 `unit` 是必需身份上下文；供应商明确返回空单元时允许空字符串。
- Missing properties stay missing. Adapters must not translate, infer, summarize, or rewrite. / 缺失属性保持缺失；适配器不得翻译、推断、摘要或改写。
- `beds` is the main/legal bedroom count. `bedsAdditional` is optional and may be mapped only when the provider explicitly supplies an additional room or den count. An explicit compound `beds` value such as `2 + 1` is split into the two editor controls while the compound source value is retained in both provenance records. Adapters must supply either the compound form or the two separate fields, never both; ambiguous mixed records are blocked. / `beds` 是主要或法定卧室数量；`bedsAdditional` 为可选项，只有供应商明确提供额外房间或书房数量时才可映射。供应商明确返回 `2 + 1` 等组合值时，编辑器会拆分到两个控件，并在两项来源记录中保留原始组合值。适配器只能提供组合形式或两个独立字段，不能同时提供；含糊的混合记录会被阻止。
- Module arrays use the editor's documented v1.4 item shapes and limits. / 模块数组使用编辑器已有的 v1.4 项目结构及数量上限。
- `dataUrl` is optional. The editor places image bytes in exportable artwork only when `reuseAllowed` is true or the user explicitly confirms an eligible unknown-rights item. `denied` requires a local replacement. / `dataUrl` 可选；只有明确允许复用，或用户对可确认的未知权利图片作出明确确认时，图片才进入可导出的作品；`denied` 必须使用本地替代图。
- Credential-like keys are recursively removed by both connector and browser core. / 连接器和浏览器核心都会递归删除类似凭证的字段。

Stable error envelopes use `{"error":{"code":"MLS_...","message":"..."}}`. The browser owns safe bilingual user-facing copy; provider detail is never treated as proof of authorization or compliance.

稳定错误结构使用 `{"error":{"code":"MLS_...","message":"..."}}`。浏览器负责安全的中英双语提示；供应商详情不被当作授权或合规证明。
