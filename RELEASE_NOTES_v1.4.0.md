# Realtor Poster Generator v1.4.0 Development Release Notes

[English](#english) · [中文](#中文)

**Development scope:** Stories 1–10 plus cross-cutting recovery · **Browser identifier:** `1.4.0-dev` · **Project schema:** 4

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE). The bundled Tabler icon subset is also MIT-licensed; its notice is stored in `web/assets/icons/TABLER-LICENSE`.

> These notes describe the complete v1.4 development candidate. They do not announce a final v1.4.0 GitHub release; merge, Pages deployment, and release publication remain separate review steps.

## English

### Release summary

The complete v1.4 candidate turns the browser poster into a dense, reference-informed property brief while preserving the project's original dark-green/gold visual system and browser-local privacy boundary. All facts, captions, conditions, requirements, and costs remain deterministic and user-supplied.

### Stories 1–10

1. **Complete property-facts ribbon ([#10](https://github.com/xudaniel/realtor-poster-generator/issues/10))** — Three to eight ordered facts, shared factual values, separate English/Chinese labels, accessible equivalents, hidden states, and four-fact social priority reduction.
2. **Paired 3D and 2D plans ([#11](https://github.com/xudaniel/realtor-poster-generator/issues/11))** — Independent plan slots with replace/remove/reorder controls, contain/fit-width/crop treatments, focal points, bilingual captions, source dimensions, low-resolution warnings, and asset hashes.
3. **Feature spotlights ([#12](https://github.com/xudaniel/realtor-poster-generator/issues/12))** — Up to three browser-local images with bilingual titles/details, focal controls, ordering, and circle, rounded-square, or rectangle masks.
4. **Structured lease details ([#13](https://github.com/xudaniel/realtor-poster-generator/issues/13))** — Literal user-entered lease rows with active, not-applicable, and hidden states; sale campaigns collapse the module.
5. **Rent inclusions ([#14](https://github.com/xudaniel/realtor-poster-generator/issues/14))** — Ordered standard/custom inclusions, locally bundled MIT-licensed Tabler icons, and an unknown/verify state.
6. **Tenant-paid costs ([#15](https://github.com/xudaniel/realtor-poster-generator/issues/15))** — Ordered bilingual cost categories; an active duplicate with rent inclusions is a blocking preflight error rather than an ambiguous warning.
7. **Building amenities ([#16](https://github.com/xudaniel/realtor-poster-generator/issues/16))** — Up to twelve ordered bilingual amenities with reusable local icons, custom entries, and clean empty-state collapse.
8. **Application requirements ([#17](https://github.com/xudaniel/realtor-poster-generator/issues/17))** — Up to ten ordered bilingual requirements, explicit user confirmation, and a visible informational disclaimer before export; the module does not perform eligibility screening.
9. **Agent profile and CTA footer ([#18](https://github.com/xudaniel/realtor-poster-generator/issues/18))** — Photo, illustrated, initials, and no-portrait modes with focal controls, safe fallback, credentials, brokerage, contacts, bilingual tagline/CTA copy, and logo.
10. **Original modular poster layout ([#19](https://github.com/xudaniel/realtor-poster-generator/issues/19))** — One original high-information print hierarchy integrating Stories 1–9, plus compact rent-included and tenant-paid summaries for social formats.

### Critical cross-cutting recovery

**Preserve and recover editor input ([#20](https://github.com/xudaniel/realtor-poster-generator/issues/20))** remains a v1.4 foundation rather than Story 11. The editor stores the complete schema-driven project and local images in IndexedDB after edits and before exports, reset, or project replacement. Reopening offers the newest local draft, restores scroll position, isolates projects by identifier, warns about cross-tab conflicts and storage failures, confirms destructive actions, and lets the user download or clear recovery data.

### Data, privacy, and review

- Project schema 4 preserves all ten story modules, plan/spotlight/portrait images, ordering, visibility, bilingual copy, crop settings, confirmations, and source dimensions.
- JSON/YAML interchange, approved-baseline comparisons, provenance manifests, and approval ZIPs retain the same structured module data.
- Images and recovery snapshots stay in browser-local storage on the current device; the editor has no cloud upload or analytics path.
- Asset SHA-256 hashes are calculated locally. Large images use IndexedDB rather than `localStorage`.
- The editor does not infer facts, translate claims, verify dimensions, screen applicants, or provide legal advice.

### Verification

- Browser core, recovery, and golden-layout suites cover schema migration, limits, visibility, sale collapse, bilingual completeness, blocking cost conflicts, application confirmation, portrait fallback, project round-trips, manifest assets, full image-bearing recovery snapshots, and minimum/typical/maximum/bilingual layout contracts.
- Python regression tests verify the static browser contract and the established renderer workflows.
- Design QA covers the 1800 × 2400 poster, editor interaction states, desktop and mobile resilience, recovery after reload, and console errors/warnings.

## 中文

### 开发版摘要

完整 v1.4 候选版把浏览器海报升级为信息密度更高、参考样图信息层级但保持原创的房源简报，同时延续深绿/金色视觉系统与浏览器本地隐私边界。所有事实、说明、租赁条件、申请要求和费用均由用户明确填写并确定性渲染。

### 故事 1–10

1. **完整房屋数据栏（[#10](https://github.com/xudaniel/realtor-poster-generator/issues/10)）** — 支持 3–8 项排序数据、跨语言共用事实值、独立中英文标签、无障碍文字、隐藏状态，以及社交尺寸按优先级精简为四项。
2. **三维与二维双户型图（[#11](https://github.com/xudaniel/realtor-poster-generator/issues/11)）** — 两个独立户型图槽支持替换、删除、排序、等比适应、按宽度适应、裁切、焦点、中英文说明、原始像素尺寸、低分辨率警告和资源哈希。
3. **重点卖点图文（[#12](https://github.com/xudaniel/realtor-poster-generator/issues/12)）** — 最多三张浏览器本地图片，支持中英文标题/详情、焦点、排序，以及圆形、圆角方形和矩形遮罩。
4. **结构化租约详情（[#13](https://github.com/xudaniel/realtor-poster-generator/issues/13)）** — 用户原样填写的租约条目可设为启用、不适用或隐藏；出售项目自动收起。
5. **租金包含项目（[#14](https://github.com/xudaniel/realtor-poster-generator/issues/14)）** — 支持标准/自定义项目排序、MIT 许可 Tabler 本地图标和待确认状态。
6. **租客承担费用（[#15](https://github.com/xudaniel/realtor-poster-generator/issues/15)）** — 支持双语费用分类和排序；与租金包含项目重复时作为阻止导出的错误。
7. **大楼设施（[#16](https://github.com/xudaniel/realtor-poster-generator/issues/16)）** — 最多十二项排序双语设施、可复用本地图标、自定义项目和无内容时自动收起。
8. **申请要求（[#17](https://github.com/xudaniel/realtor-poster-generator/issues/17)）** — 最多十项排序双语要求；导出前必须明确确认并显示信息性免责声明；系统不自动判断申请资格。
9. **经纪人资料与行动号召页脚（[#18](https://github.com/xudaniel/realtor-poster-generator/issues/18)）** — 支持照片、插画、姓名首字母和无头像四种模式，并提供焦点、安全回退、职衔、经纪公司、联系方式、双语标语/行动号召和标志。
10. **原创模块化海报版式（[#19](https://github.com/xudaniel/realtor-poster-generator/issues/19)）** — 用一套原创高信息量打印版式整合故事 1–9，并在社交版式加入紧凑的租金包含与租客承担摘要。

### 关键横向恢复能力

**保留并恢复编辑器输入（[#20](https://github.com/xudaniel/realtor-poster-generator/issues/20)）** 仍是 v1.4 横向基础能力，而不是 Story 11。编辑器会在修改后，以及导出、重置或替换项目前，把完整项目结构和本地图片保存到 IndexedDB。再次打开时可恢复最新草稿及滚动位置；不同项目按标识隔离；跨标签页冲突与存储失败会明确提示；破坏性操作需要确认；用户可下载或清除恢复数据。

### 数据、隐私与审核

- 第 4 版项目结构保存十个故事模块、户型图/卖点图/头像、顺序、显示状态、中英文文案、裁切设置、确认状态和原始像素尺寸。
- JSON/YAML 往返、已批准基准比较、来源清单和审批 ZIP 保留同一套结构化模块数据。
- 图片和恢复快照只保存在当前设备的浏览器本地存储；编辑器没有云端上传或分析路径。
- 资源 SHA-256 在本地计算；大体积图片使用 IndexedDB，而不是 `localStorage`。
- 编辑器不会推断房屋事实、自动翻译广告内容、核实尺寸、筛选申请人或提供法律意见。

### 验证

- 浏览器核心、恢复及黄金版式测试覆盖结构迁移、数量上限、显示状态、出售项目收起、中英文完整性、阻止费用冲突、申请确认、头像回退、项目往返、清单资源、包含图片的完整恢复快照，以及最小/典型/最大/双语版式契约。
- Python 回归测试验证静态浏览器契约及既有渲染流程。
- 设计检查覆盖 1800 × 2400 海报、编辑器交互状态、桌面与移动端适应、刷新恢复及控制台错误/警告。
