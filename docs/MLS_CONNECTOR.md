# 授权 MLS 连接器协议

[English](MLS_CONNECTOR.en.md) · [中文 README](../README.md) · [中文产品需求文档](../PRD.md)

此 v2.0 候选协议实现 [Issue #22](https://github.com/xudaniel/realtor-poster-generator/issues/22)：用户在已有合法授权的前提下，通过数据商或经纪公司连接器，以一个 MLS 号码取得房源并生成可编辑项目。它不会抓取房源网页、绕过访问控制，也不会把数据商凭据放入本仓库或 GitHub Pages。

## 信任边界

- 手工编辑、画布渲染、本地恢复与导出仍在当前设备完成。
- 只有用户选择“Authorized connector”并按“Generate”后，编辑器才会发起网络请求。
- 编辑器只向连接器发送一个标准化 MLS 号码。身份验证必须在编辑器外完成，并通过安全的连接器会话 Cookie 表示。
- 连接器负责保存数据商凭据、检查 MLS/Board 会员权限、限流、审计、字段授权和图片许可。
- 编辑器不接收 API Key 或 Bearer Token。包含账号、密码、查询参数或 URL 片段的连接器地址会被拒绝。
- 生产连接器必须使用 HTTPS；只有 `localhost`、`127.0.0.1` 或 `[::1]` 本地开发环境可使用 HTTP。

内置 `DEMO1234` 是完全虚构、只在内存中运行的开发样例，不发送网络请求，也不得被当作真实房源。

## 接口

编辑器发送：

```http
POST /v1/listings:resolve
Content-Type: application/json
Accept: application/json
X-Realtor-Poster-Protocol: 1.0

{"mlsNumber":"C1234567"}
```

请求使用 `credentials: include`、`cache: no-store`、`redirect: error`、15 秒超时并关闭 Referrer。连接器必须仅允许明确的编辑器来源，并按部署环境配置安全、合适的 SameSite 会话 Cookie。

## 成功返回结构

完整 JSON 示例见 [English protocol](MLS_CONNECTOR.en.md#success-envelope)。关键要求如下：

- `protocolVersion` 必须为 `1.0`，`matchCount` 必须严格等于 `1`。
- `provider.id`、`provider.name` 与 `provider.board` 必填。
- `match.confirmed` 必须为 `true`；其 `providerId`、`board`、`mlsNumber`、`status`、`address`、`unit` 六项必须与返回房源完全一致。
- `listing.unit` 必须存在；无单元号时返回明确空字符串。
- 当前支持 `FOR LEASE`、`FOR SALE`、`JUST LISTED`、`OPEN HOUSE`；撤销、过期或不支持的状态会被拒绝。
- 返回 MLS 号码必须等于用户请求号码的标准化结果。
- 每张图片必须包含角色、唯一来源编号与明确的 `rights.exportAllowed`。允许导出的图片必须由连接器以受支持的 Base64 `data:image/...` 嵌入，提供正数来源尺寸，并保留顺序、说明、许可依据及确认时间。最多允许使用一张主图、四张室内图和两张户型图；户型图必须注明 `furnished3d` 或 `technical2d`。允许和禁用素材合计最多 20 条。
- 不允许导出的图片可以不返回图像内容；编辑器会把它记录为禁用素材，绝不会静默放进海报。
- 返回体上限为 12 MiB。

## 错误约定

编辑器把下列 HTTP 状态转换为中英双语提示，并保留当前编辑内容：

| HTTP | 含义 |
|---|---|
| `401`、`403` | 连接器会话未获授权 |
| `404` | 未找到房源 |
| `409` | 匹配到多套房源，必须阻止导入 |
| `410` | 房源已撤销、过期或不可用 |
| `429` | 数据源达到限流 |
| 其他非 2xx | 数据源不可用 |

无效、不完整或超出大小限制的返回也会被拒绝，且不会替换当前项目。

## 确定性映射与人工审核

- 数据商字段按固定映射写入现有项目结构，不推断、不翻译、不摘要、不改写。
- 用户已保存的经纪人、品牌、模板、主题及合规资料继续保留。
- 每个导入的房源、内容和结构化模块字段都保存数据商、MLS 系统、号码、获取时间、原始值及后续本地修改。
- 图片保存来源编号、顺序、尺寸、说明、许可依据和许可确认时间。
- 刷新时先比较新数据与当前可编辑项目，确认后才替换已有或本地修改字段。
- 导入与刷新前使用同一 IndexedDB 恢复机制保存快照，完成后再保存新项目。
- 用户必须明确核对房源事实、当前状态、披露内容和图片使用权，之后才可发布导出；任何导入字段或图片修改都会使该次审核失效。

## 测试

测试只能使用虚构样例与模拟连接器返回：

```bash
node tests/test_web_mls.js
```

不得把真实数据商凭据、私有房源内容或生产会话资料放入测试、Issue、日志、截图或 Pull Request。

Copyright © 2026 **Daniel Xu**。根据 [MIT License](../LICENSE) 发布。
