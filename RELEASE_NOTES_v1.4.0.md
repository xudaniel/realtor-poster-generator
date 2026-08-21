# Realtor Poster Generator v1.4.0 Development Release Notes

[English](#english) · [中文](#中文)

**Development phase:** Stories 1–5 · **Browser identifier:** `1.4.0-dev` · **Project schema:** 3

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE). The bundled Tabler icon subset is also MIT-licensed; its notice is stored in `web/assets/icons/TABLER-LICENSE`.

> These are development notes for the first half of v1.4.0. They do not announce a final v1.4.0 GitHub release. Stories 6–10 remain outside this phase.

## English

### Release summary

The first v1.4 phase converts the browser poster from a general campaign layout into a denser, reference-informed property brief while preserving the project's original visual system and browser-local privacy boundary. Every fact, caption, condition, and cost remains deterministic and user-supplied.

### Stories 1–5

1. **Complete property-facts ribbon ([#10](https://github.com/xudaniel/realtor-poster-generator/issues/10))** — Supports three to eight ordered facts, shared factual values, separate English/Chinese labels, accessible equivalents, hidden states, and priority reduction to four facts on social formats.
2. **Paired 3D and 2D plans ([#11](https://github.com/xudaniel/realtor-poster-generator/issues/11))** — Adds independent plan slots with add/replace/remove/reorder controls, contain/fit-width/crop treatments, focal points, bilingual captions and notes, one-plan reflow, source dimensions, low-resolution warnings, and asset hashes.
3. **Feature spotlights ([#12](https://github.com/xudaniel/realtor-poster-generator/issues/12))** — Adds up to three browser-local images with bilingual titles/details, focal controls, ordering, and circle, rounded-square, or rectangle masks.
4. **Structured lease details ([#13](https://github.com/xudaniel/realtor-poster-generator/issues/13))** — Adds literal user-entered term, availability, deposit, payment, insurance, key, pet, smoking, parking, and custom rows with active, not-applicable, and hidden states. Sale campaigns collapse the module.
5. **Rent inclusions ([#14](https://github.com/xudaniel/realtor-poster-generator/issues/14))** — Adds ordered standard/custom inclusions, original local composition with MIT-licensed Tabler icons, an unknown/verify state, and duplicate warnings against tenant-paid data.

### Data, privacy, and review

- Project schema 3 preserves all five modules, plan/spotlight images, ordering, visibility, bilingual copy, crop settings, and source dimensions.
- Listing JSON/YAML interchange, approved-baseline comparisons, provenance manifests, and approval ZIPs retain the same module data.
- Plan and spotlight images never leave the browser tab. Asset SHA-256 hashes are calculated locally.
- The editor does not infer property facts, translate claims, verify dimensions, or provide legal advice about lease conditions.

### Verification target

- Browser core tests cover minimum/maximum facts, social priorities, one/two plans, low-resolution warnings, spotlight limits, bilingual completeness, lease collapse, cost conflicts, round-trips, and manifest assets.
- Visual QA compares the reference information hierarchy with the rendered original implementation at print-poster and editor-preview sizes.
- A final v1.4.0 release requires completion and verification of Stories 6–10.

## 中文

### 开发版摘要

v1.4 第一阶段把浏览器海报从通用广告版式升级为信息密度更高、参考样图信息层级但保持原创的房源简报。所有房屋数据、图片说明、租赁条件和费用仍由用户明确填写并确定性渲染，不由系统猜测或改写。

### 故事 1–5

1. **完整房屋数据栏（[#10](https://github.com/xudaniel/realtor-poster-generator/issues/10)）** — 支持 3–8 项排序数据、跨语言共用事实值、独立中英文标签、无障碍文字、隐藏状态，以及社交尺寸按优先级精简为四项。
2. **三维与二维双户型图（[#11](https://github.com/xudaniel/realtor-poster-generator/issues/11)）** — 两个独立户型图槽支持添加、替换、删除、排序、等比适应、按宽度适应、裁切、焦点、中英文说明、单图自动重排、原始像素尺寸、低分辨率警告和资源哈希。
3. **重点卖点图文（[#12](https://github.com/xudaniel/realtor-poster-generator/issues/12)）** — 最多三张浏览器本地图片，支持中英文标题/详情、焦点、排序，以及圆形、圆角方形和矩形遮罩。
4. **结构化租约详情（[#13](https://github.com/xudaniel/realtor-poster-generator/issues/13)）** — 支持用户原样填写租期、入住日期、押金、付款、保险、钥匙、宠物、吸烟、停车和自定义条目，并可设为启用、不适用或隐藏；出售项目自动收起。
5. **租金包含项目（[#14](https://github.com/xudaniel/realtor-poster-generator/issues/14)）** — 支持标准/自定义项目排序、MIT 许可 Tabler 本地图标、待确认状态，以及与租客承担费用重复时的警告。

### 数据、隐私与审核

- 第 3 版项目结构保存五类模块、户型图/卖点图、顺序、显示状态、中英文文案、裁切设置和原始像素尺寸。
- 房源 JSON/YAML 往返、已批准基准比较、来源清单和审批 ZIP 保留同一套模块数据。
- 户型图与卖点图片不会离开浏览器标签页；资源 SHA-256 在本地计算。
- 编辑器不会推断房屋事实、自动翻译广告内容、核实户型尺寸，也不会就租赁条件提供法律意见。

### 验证目标

- 浏览器核心测试覆盖最少/最多房屋数据、社交优先级、单/双户型图、低分辨率警告、卖点数量、中英文完整性、出售项目租约收起、费用冲突、项目往返及清单资源。
- 视觉检查会在打印海报和编辑器预览尺寸对比参考图的信息层级与原创实现。
- 正式发布 v1.4.0 前仍需完成并验证故事 6–10。
