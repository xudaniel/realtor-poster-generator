# Realtor Poster Generator v1.4.1 Release Notes

[English](#english) · [中文](#中文)

**Release date:** 2026-08-21 · **Scope:** authorized MLS/provider import ([#22](https://github.com/xudaniel/realtor-poster-generator/issues/22)) · **Browser identifier:** `1.4.1` · **Project schema:** 5

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE).

## English

### Release summary

v1.4.1 can create a complete editable poster from one exact, authorized provider record without storing the provider secret in GitHub Pages, browser projects, manifests, logs, fixtures, or the repository. Manual editing and all established v1.4 modules remain available.

### What is included

- **Loopback-only connector:** `realtor-poster-mls` binds to `127.0.0.1`, reads authorization from an environment variable, and calls one operator-fixed official or contractual HTTPS endpoint.
- **Exact identity:** import requires one provider + board + listing-number match with retained status, address, and unit context. Missing, multiple, mismatched, expired, withdrawn, suspended, or unauthorized records stop safely.
- **Deterministic mapping:** status, address, unit, city, postal code, price/period, MLS number, beds, baths, area, floor, exposure, balcony, parking, availability, open house, descriptions, facts, amenities, lease details, costs, requirements, and images are copied without guessing, translation, summary, or rewriting.
- **User-owned profile:** saved agent, brokerage, licence, brand, language, template, and compliance settings are preserved.
- **Field-level provenance:** schema 5 stores provider, board, listing number, retrieval/source times, original value, current value, and user-override state for each imported field.
- **Safe refresh:** same-listing refreshes produce a diff and require confirmation before protected edits or local listing images can be overwritten.
- **Image-rights gate:** source ID, order, caption, dimensions, rights status, confirmation, and replacement state are retained. Unknown or denied reuse blocks export until explicit confirmation is allowed or a local replacement is recorded.
- **Human-review gate:** every authorized import requires explicit review after the listing fields, status, disclosures, and image rights pass preflight.
- **Bilingual failures:** not-found, ambiguous, withdrawn, unauthorized, expired authorization, rate limit, connector failure, and provider outage paths have English/Chinese messages.

### Security and deployment boundary

Static GitHub Pages cannot safely hold a provider secret and usually cannot call a plain-HTTP loopback service from an HTTPS page. Authorized use therefore runs both the editor and connector locally. The browser client accepts only `localhost`, `127.0.0.1`, or `::1`; the connector's upstream target is fixed at launch and must use HTTPS. It does not scrape, guess listing numbers, search globally, obtain data rights, reuse credentials, bypass access controls, auto-publish, or guarantee compliance.

```bash
export MLS_PROVIDER_TOKEN="secret supplied securely by the provider"
realtor-poster-mls \
  --provider-id YOUR_PROVIDER \
  --provider-name "Your Authorized Provider" \
  --board YOUR_BOARD \
  --endpoint 'https://provider.example/listings/{listing_number}'
python3 scripts/serve_web.py
```

Open `http://127.0.0.1:8765`, connect `http://127.0.0.1:8766`, and enter one exact number. A real provider requires an authorized adapter that returns the normalized contract documented by this release.

### Verification

- Fully synthetic fixtures cover exact, ambiguous, incomplete, withdrawn, stale, authorization-expired, rate-limited, and provider-outage records.
- Browser core tests cover deterministic mapping, missing fields, user overrides, refresh diffs, image permission/confirmation/replacement, preflight, project round-trip, and provenance manifests.
- Connector tests verify loopback/public context, provider mismatch, HTTPS-only upstream configuration, environment-only authorization, and stable error mapping.
- Existing renderer, recovery, layout-golden, batch, social, deterministic-render, and visual-regression suites continue to pass.

## 中文

### 发布摘要

v1.4.1 可以从一条准确、获授权的供应商记录生成完整可编辑海报，同时不会把供应商密钥保存到 GitHub Pages、浏览器项目、来源清单、日志、测试夹具或仓库中。手工编辑以及 v1.4 的全部既有模块继续保留。

### 本次实现

- **仅回环地址连接器：** `realtor-poster-mls` 只监听 `127.0.0.1`，从环境变量读取授权，并只调用操作者启动时固定的官方或合同 HTTPS 接口。
- **准确身份匹配：** 只有“供应商 + board + 房源编号”唯一匹配且保留状态、地址和单元上下文时才能导入。缺失、多个结果、身份不符、过期、撤销、暂停或无权访问都会安全中止。
- **确定性映射：** 状态、地址、单元、城市、邮编、价格/周期、MLS、卧室、卫浴、面积、楼层、朝向、阳台、车位、入住日期、开放日、说明、房屋事实、设施、租约、费用、申请要求和图片均原样复制，不猜测、不自动翻译、不摘要、不改写。
- **用户资料不被覆盖：** 已保存的经纪人、经纪公司、执照、品牌、语言、模板和合规配置保持不变。
- **逐字段来源：** 第 5 版项目结构保存每个导入字段的供应商、board、MLS 号、获取/源更新时间、原值、当前值和人工覆盖状态。
- **安全刷新：** 同一房源刷新先显示差异；覆盖人工修改或本地房源图片前必须再次确认。
- **图片权利门禁：** 保存来源编号、顺序、说明、像素、权利状态、确认和替代状态。复用权利未知或被拒绝时，必须完成允许的明确确认或记录本地替代图，才能导出。
- **人工核对门禁：** 房源字段、状态、披露及图片权利通过预检后，仍须由用户明确核对。
- **双语错误：** 未找到、歧义、撤销、无权访问、授权过期、限流、连接器失败及供应商中断均提供中英文提示。

### 安全与部署边界

静态 GitHub Pages 无法安全保存供应商密钥，而且 HTTPS 页面通常不能调用普通 HTTP 本机服务。因此获授权使用需要在本机同时运行编辑器和连接器。浏览器客户端只接受 `localhost`、`127.0.0.1` 或 `::1`；连接器上游地址在启动时固定且必须使用 HTTPS。本功能不抓取网页、不猜号、不做全球编号搜索、不取得数据许可、不复用他人凭证、不绕过权限、不自动发布，也不保证合规。

真实供应商需要一个已获授权、能返回本版本标准化合同的适配器。所有最终广告仍须由负责的经纪人或经纪公司核对；本门禁不代表法律、监管、MLS、地产局、经纪公司或版权批准。

### 验证

- 完全合成的测试夹具覆盖唯一匹配、歧义、资料缺失、撤销、陈旧、授权过期、限流和供应商中断。
- 浏览器核心测试覆盖固定映射、缺失字段、人工覆盖、刷新差异、图片许可/确认/替代、导出门禁、项目往返和来源清单。
- 连接器测试覆盖本机公开上下文、供应商不符、HTTPS 上游、仅环境变量授权和稳定错误映射。
- 既有渲染、恢复、黄金版式、批处理、社交尺寸、确定性渲染和视觉回归测试继续通过。
