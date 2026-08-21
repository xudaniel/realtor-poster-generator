# Realtor Poster Generator v2.0 Candidate Release Notes

[English](#english) · [中文](#中文)

**Scope:** Authorized MLS-number import foundation · **Protocol:** `1.0` · **Issue:** [#22](https://github.com/xudaniel/realtor-poster-generator/issues/22)

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE).

> This is a candidate feature note, not a final v2.0 GitHub release. The current stable release remains v1.4.0; this work is based directly on that full Stories 1–10 and Issue #20 recovery foundation.

## English

### What is included

- Enter one MLS number after selecting an authorized connector and generate a complete, editable poster project.
- Use the bundled fictional `DEMO1234` provider to evaluate the flow without network access, credentials, or real listing data.
- Require one exact provider/board/MLS/status/address/unit match; ambiguous, missing, withdrawn, expired, unauthorized, rate-limited, and unavailable results are blocked with bilingual messages.
- Map provider facts deterministically into the existing project schema without inventing, translating, summarizing, or rewriting claims.
- Preserve saved agent, brand, template, theme, and compliance fields while filling listing facts, content modules, permitted images, and floor plans.
- Import only images with explicit export rights. Record blocked images and retain source ID, order, dimensions, caption, rights basis, and confirmation time.
- Show completeness, missing fields, stale source state, local overrides, blocked media, and refresh count.
- Record per-field provenance and local overrides in projects, listing interchange, manifests, and approval packages.
- Compare refresh data with the current editable values and request confirmation before replacing changes.
- Save recovery snapshots before import/refresh and the complete imported project afterward, using the existing Issue #20 recovery path.
- Block publication exports until a user explicitly reviews the imported facts, status, disclosures, and image rights; editing imported fields or media invalidates the recorded review.

### Security and privacy boundary

Manual editing and the demo provider remain on-device. A network request is made only after the user explicitly selects an authorized connector and presses Generate. Production connectors must use HTTPS, hold all provider credentials outside GitHub Pages, and authenticate the browser through a secure connector session. The editor accepts no API key or token and does not scrape listing pages.

See the [English connector protocol](docs/MLS_CONNECTOR.en.md).

### Verification

- Node unit tests cover strict endpoint validation, exact-match rejection, status/error handling, deterministic mapping, untranslated text, preserved agent/brand settings, image-rights exclusion, review invalidation, field provenance, refresh differences, connector request shape, round-trip recovery, and manifest provenance.
- CI syntax-checks the MLS module and runs the dedicated mock-only connector suite.
- No real provider credentials or real listing records are included.

## 中文

### 本候选版本包含

- 选择授权连接器后输入一个 MLS 号码，即可生成完整、可编辑的海报项目。
- 可使用内置虚构数据源 `DEMO1234` 体验全部流程；它不联网、不需要凭据，也不包含真实房源。
- 只有数据商、MLS 系统、号码、状态、地址和单元号六项精确一致，且只有一个匹配结果时才允许导入；多重匹配、未找到、撤销、过期、未授权、限流或数据源不可用均会被中英双语提示阻止。
- 通过固定字段映射写入现有项目结构，不猜测、不翻译、不摘要、不改写房源内容。
- 保留用户已保存的经纪人、品牌、模板、主题和合规资料，同时填充房源事实、内容模块、有许可的图片与户型图。
- 只有明确允许导出的图片才会进入海报；禁用图片仍会记录，所有素材保存来源编号、顺序、尺寸、说明、许可依据和确认时间。
- 完整度面板显示已导入字段、缺失项、数据是否过期、本地修改、禁用图片和刷新次数。
- 项目文件、房源交换数据、来源清单和审批包保存逐字段来源及本地覆盖记录。
- 刷新时先把新数据与当前可编辑值比较，用户确认后才替换本地修改。
- 导入或刷新前沿用 Issue #20 的恢复机制保存快照，完成后保存包含图片与来源信息的完整项目。
- 用户必须明确核对房源资料、当前状态、披露内容和图片使用权后才能发布导出；修改任何导入字段或图片都会使已有审核失效。

### 安全与隐私边界

手工编辑和虚构演示完全在本机运行。只有用户明确选择授权连接器并按“生成”后，才会发出网络请求。生产连接器必须使用 HTTPS，把数据商凭据保存在 GitHub Pages 之外，并通过安全的连接器会话认证浏览器。编辑器不接收 API Key 或 Token，也不抓取房源网页。

详见[中文连接器协议](docs/MLS_CONNECTOR.md)。

### 验证

- Node 单元测试覆盖连接器地址限制、精确匹配拒绝、状态与错误处理、确定性映射、不自动翻译、保留经纪人/品牌、图片许可过滤、修改后审核失效、逐字段来源、刷新差异、请求结构、项目往返和清单来源。
- CI 会检查 MLS 模块语法，并运行只使用模拟数据的连接器测试。
- 仓库不包含真实数据商凭据或真实房源记录。
