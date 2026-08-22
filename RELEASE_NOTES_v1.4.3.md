# Realtor Poster Generator v1.4.3

**Beds + room/den / 卧室 + 额外房间/书房**

- Release date / 发布日期：2026-08-22
- Issue / 议题：[Issue #27](https://github.com/xudaniel/realtor-poster-generator/issues/27)
- Project version / 项目版本：**1.4.3**
- Browser project schema / 浏览器项目结构：**6**

## English

### What changed

v1.4.3 represents main bedrooms and an additional room/den as two separate facts. The editor provides a **Main bedrooms** whole-number control from `0–20` and an **Additional room / den** whole-number control from `0–10`. Changing either value updates the preview immediately:

| Main bedrooms | Additional room / den | Display |
|---:|---:|---|
| 0 | 0 | `0` |
| 1 | 0 | `1` |
| 1 | 1 | `1 + 1` |
| 2 | 1 | `2 + 1` |

When an additional space is present, the property-facts ribbon uses the safe label **“Beds + room/den.”** A zero additional count has no trailing `+ 0`. The application never converts `2 + 1` into `3 bedrooms` and never claims that the additional room/den is a legal bedroom.

### Consistent artwork and accessible copy

The same structured expression appears in all five output formats:

- Print poster: 1800 × 2400
- Square: 1080 × 1080
- Portrait: 1080 × 1350
- Story: 1080 × 1920
- Landscape: 1200 × 630

English, Chinese, and bilingual canvas descriptions state the two meanings separately, for example `2 bedrooms + 1 additional room/den` and `2 间卧室 + 1 个额外房间/书房`. The preflight action for an invalid count opens and focuses the relevant control, and the controls and derived preview remain usable on mobile and at 200% zoom.

### Data compatibility and migration

Schema 6 stores the browser values as `listing.beds` and `listing.bedsAdditional`. Listing JSON/YAML interchange uses `beds` and `beds_additional`. Both counts are preserved in:

```yaml
listing:
  beds: 2
  beds_additional: 1
```

- portable JSON and YAML projects;
- IndexedDB autosave and recovery;
- approved-baseline comparison;
- provenance manifests; and
- complete approval packages.

A schema-5 or older project with one bedroom value reopens with the same main count and `0` additional rooms. An explicit legacy compound value such as `1 + 1` is split into the two fields and still displays as `1 + 1`. Migration does not add, reinterpret, or discard either component.

### MLS provenance and review integrity

Authorized MLS import accepts an additional-room value only when the configured provider explicitly supplies either a separate additional count or an explicit compound value. The original explicit provider value remains visible in field-level provenance. If the provider omits the additional count, the import neither creates nor overwrites that field from provider data; it does not infer `+1` from descriptions, remarks, photographs, floor plans, or generative AI.

Editing either imported count records a local override, clears the previous MLS review confirmation and review time, and reopens the established human-review gate. Export remains blocked until the authorized listing facts, corrections, disclosures, and image rights are reviewed again. This workflow records provenance and review state; it does not grant legal, MLS®, board, brokerage, regulatory, or copyright approval.

### Validation

- Main bedrooms: non-negative whole number from `0–20`
- Additional room / den: non-negative whole number from `0–10`
- Decimals, negative values, missing required main counts, and values above either bound fail before export
- The two counts remain separate throughout validation and rendering

## 中文

### 本次更新

v1.4.3 把主卧室与额外房间/书房作为两个独立房屋事实。编辑器提供 `0–20` 的“主卧室”整数控件，以及 `0–10` 的“额外房间/书房”整数控件；修改任一数量都会立即更新预览：

| 主卧室 | 额外房间/书房 | 显示 |
|---:|---:|---|
| 0 | 0 | `0` |
| 1 | 0 | `1` |
| 1 | 1 | `1 + 1` |
| 2 | 1 | `2 + 1` |

存在额外空间时，房屋数据栏使用安全标签 **“卧室 + 额外房间/书房”**。额外数量为零时不会显示 `+ 0`。系统绝不会把 `2 + 1` 转成 `3 间卧室`，也不会宣称额外房间/书房是法律意义上的卧室。

### 五种版式与无障碍说明一致

完整海报（1800 × 2400）、方形（1080 × 1080）、竖版（1080 × 1350）、限时动态（1080 × 1920）和横版（1200 × 630）都使用同一个结构化表达。英文、中文和双语画布说明会分别表达两个含义，例如 `2 bedrooms + 1 additional room/den` 与 `2 间卧室 + 1 个额外房间/书房`。

非法数量的预检操作会打开并聚焦到对应控件；两个控件和即时预览在手机与 200% 放大时仍可使用。

### 数据兼容与迁移

第 6 版浏览器项目结构使用 `listing.beds` 和 `listing.bedsAdditional`；房源 JSON/YAML 交换格式使用 `beds` 和 `beds_additional`。便携项目、IndexedDB 自动保存与恢复、已批准基准比较、来源清单和完整审批包都会分别保留两个数量。

新建 YAML/JSON 应分别填写两个字段，如 `beds: 2` 与 `beds_additional: 1`。明确复合值只作为旧资料或供应商原值的迁移兼容输入，不应与独立的 `beds_additional` 同时填写。

第 5 版及更早项目只有单一卧室值时，会按相同主卧室数量和 `0` 个额外房间重新打开。明确的旧式复合值（例如 `1 + 1`）会拆分到两个字段，并继续显示为 `1 + 1`。迁移不会相加、重新解释或丢弃任一部分。

### MLS 来源与核对完整性

获授权 MLS 导入只有在已配置供应商明确提供独立额外数量或明确复合值时，才会接收额外房间字段。逐字段来源会保留供应商的明确原值。供应商没有提供该值时，导入不会根据供应商资料新建或覆盖该字段，也不会从说明、备注、照片、户型图或生成式 AI 推断 `+1`。

导入后修改任一数量都会记录本地覆盖、清除此前的 MLS 核对确认与核对时间，并重新打开既有人工核对门禁。用户再次核对获授权房源事实、修正、披露和图片权利前，导出会继续被阻止。该流程只记录来源与核对状态，不代表法律、MLS、地产局、经纪公司、监管或版权批准。

### 验证范围

- 主卧室：`0–20` 的非负整数
- 额外房间/书房：`0–10` 的非负整数
- 小数、负数、缺失的必填主卧室值及超过上限的值会在导出前失败
- 验证与渲染全过程始终分别保留两个数量

## Upgrade notes / 升级说明

No manual conversion is required. Open an older portable project normally and save it to write schema 6. Review both bedroom controls before publication, especially after an authorized MLS import or migration of an explicit compound value.

无需手工转换。正常打开旧便携项目并保存，即可写入第 6 版结构。发布前应分别核对两个卧室相关控件，尤其是在获授权 MLS 导入或明确复合值迁移后。

Copyright © 2026 **Daniel Xu**. Released under the [MIT License](LICENSE).
