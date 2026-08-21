# Realtor Poster Generator v1.3.0 Release Notes

[English](#english) · [中文](#中文)

**Release candidate:** 2026-08-20 · **Pull request:** [#9](https://github.com/xudaniel/realtor-poster-generator/pull/9)

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE).

> These notes describe the v1.3.0 release candidate in pull request #9. The changes become part of the live editor after the pull request is reviewed and merged.

## English

### Release summary

Version 1.3.0 turns the browser editor into a complete, browser-local campaign workspace. Agents can build a listing campaign, reuse controlled brand assets, clear configurable compliance checks, create English and Chinese artwork, and package review evidence without uploading property or client data.

### Five critical enhancements

1. **Complete campaign projects** — Versioned JSON and YAML projects now preserve the full listing, four ordered interior photos, an optional floor plan, light and dark logos, crop settings, templates, compliance settings, and review records.
2. **Compliance profiles and export gates** — Built-in profiles for lease, sale, open house, and just listed campaigns apply required-field checks, including agent title and configurable licence/registration data. Blocking errors must be resolved before publication exports can be created.
3. **Reusable, controlled brand templates** — Versioned templates carry colours, typography, a default layout, contact details, and both logo variants. They can be duplicated, renamed, and selectively locked while listing-specific fields remain editable.
4. **English, Chinese, and bilingual artwork** — All three language modes are available across print, square, portrait, story, and landscape formats, with CJK-aware font fallback and independently measured English/Chinese headline and feature blocks.
5. **Review and approval packages** — Teams can compare a project with an approved baseline, record Draft, Changes Requested, or Approved status, and export a ZIP containing five proofs, source and project data, the review record, provenance details, and SHA-256 checksums.

### Privacy and compliance boundaries

- Listing data and images stay in the current browser tab; the editor contains no analytics or upload workflow.
- The approval record documents a team workflow. It does **not** constitute legal, regulatory, MLS®, or brokerage approval.
- Compliance profiles are configurable preflight aids and do not replace a qualified review of local advertising requirements.

### Upgrade notes

- Browser projects now use schema version 2. Older project files are normalized when opened; save them again to retain the current structure.
- Project files can contain embedded images and may therefore be large or sensitive. Store and share them accordingly.
- JSON remains the most complete portable format. YAML import and export are supported for human-readable workflows.

### Verification

- Browser-core tests cover validation, YAML round-trips, manifests, approval requirements, and project comparisons.
- Python tests run against Python 3.9, 3.11, and 3.12 in continuous integration.
- Export manifests and approval packages include local SHA-256 provenance data.

See the full [changelog](CHANGELOG.md), [English README](README.en.md), and [English PRD](PRD.en.md).

## 中文

### 发布摘要

1.3.0 将浏览器编辑器升级为完整的浏览器本地广告工作台。经纪人可以在不上传房源或客户资料的前提下制作整套房源广告、复用受控品牌资产、通过可配置合规检查、生成中英文版式，并打包审核证据。

### 五项关键增强

1. **完整广告项目** — 版本化 JSON 和 YAML 项目现在可以保留完整房源资料、四张有序室内照片、可选户型图、明暗两套标志、裁切设置、模板、合规设置及审核记录。
2. **合规配置与导出门禁** — 内置租赁、出售、开放日和刚刚上市配置，并执行包括经纪人职衔及可配置执照/注册资料在内的必填项检查；阻止性错误清除前不能生成发布用导出文件。
3. **可复用、可控制的品牌模板** — 版本化模板可保存颜色、字体、默认版式、联系资料和两套标志；模板支持复制、重命名和指定字段锁定，同时保留房源专属字段的编辑能力。
4. **英文、中文与双语版式** — 三种语言模式均支持打印、方形、竖版、故事和横版五种尺寸，并提供适合中日韩文字的字体回退；双语标题和特色会分别测量与换行。
5. **审核与审批包** — 团队可将项目与已批准基准比较，记录草稿、要求修改或已批准状态，并导出包含五张校样、源数据、项目数据、审核记录、来源信息和 SHA-256 校验值的 ZIP。

### 隐私与合规边界

- 房源资料和图片仅保留在当前浏览器标签页；编辑器不包含分析统计或上传流程。
- 审批记录用于记录团队工作流，**不代表**法律、监管机构、MLS® 或经纪公司批准。
- 合规配置是可调整的预检工具，不能替代对当地广告要求的专业审核。

### 升级说明

- 浏览器项目现使用第 2 版数据结构。旧项目打开时会自动规范化；建议重新保存，以保留当前结构。
- 项目文件可能包含内嵌图片，因此文件可能较大并涉及敏感资料，请谨慎保存和分享。
- JSON 仍是信息最完整的可移植格式；同时支持 YAML 导入导出，便于人工阅读和编辑。

### 验证情况

- 浏览器核心测试覆盖验证、YAML 往返、清单、审批要求和项目比较。
- 持续集成使用 Python 3.9、3.11 和 3.12 运行 Python 测试。
- 导出清单和审批包包含本地生成的 SHA-256 来源校验数据。

完整资料请参阅[更新记录](CHANGELOG.md)、[中文 README](README.md)和[中文产品需求文档](PRD.md)。
