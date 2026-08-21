# Realtor Poster Generator v1.4.2 Release Notes

[English](#english) · [中文](#中文)

**Release date:** 2026-08-21 · **Scope:** actionable export preflight ([#25](https://github.com/xudaniel/realtor-poster-generator/issues/25)) · **Browser identifier:** `1.4.2` · **Project schema:** 5

Created and maintained by **Daniel Xu**. Released under the [MIT License](LICENSE).

## English

### Release summary

v1.4.2 turns export preflight from a technical message box into a short, actionable checklist. The red panel now contains only true export blockers, every blocker explains the required resolution, and each action leads directly to the relevant editor control. Non-blocking MLS source changes appear separately in amber.

This is a user-experience point release. It does not weaken validation, approve listing facts or image rights, change the compliance rules, or change browser project schema 5.

### What changed

- **Blockers only in red:** the blocker count excludes warnings and always matches the rules that prevent export.
- **Direct resolution actions:** each blocker has a plain-language title, concise guidance, and a button that opens, scrolls to, and focuses the relevant field or section.
- **MLS review shortcut:** **Review MLS import** leads to the explicit review control. Completing review removes that blocker immediately; editing an imported field restores review as required.
- **Separate source-change warning:** **Changed since import** appears in an amber panel, lists every overridden field, and links to the first changed field.
- **Actionable image and compliance gates:** image rights, application-requirement confirmation, disclaimer, MLS source, and ordinary validated fields each resolve to the correct editor destination.
- **Clear states:** action-required, warning, ready-with-warnings, and passed states use correct singular/plural copy and update without a page reload.
- **Accessible interaction:** state changes use a live region; meaning is conveyed through text and symbols as well as colour; buttons have visible keyboard focus and place focus logically after activation.
- **Responsive layout:** action cards reflow on narrow screens and at 200% zoom without fixed-width copy or clipped controls.
- **Disclaimer preserved:** the legal/compliance explanation remains visible outside the fixable status cards.

### Verification

- Browser-core tests cover zero, one, and multiple blockers/warnings, blocker-only counts, direct destination metadata, changed-field discovery, and immediate review-state updates.
- Existing browser recovery, MLS connector, v1.4 layout-golden, Python renderer, batch, social, deterministic-render, and visual-regression suites remain part of release CI.
- Manual browser acceptance checks verify keyboard focus, scroll destinations, live blocker removal/restoration, mobile reflow, 200% zoom, and export behavior.

## 中文

### 发布摘要

v1.4.2 把导出预检从技术性消息框改造成简短、可直接处理的清单。红色面板现在只显示真正阻止导出的事项；每项都会说明需要完成什么，并提供直达相关编辑控件的操作。不会阻止导出的 MLS 来源变更则单独显示在琥珀色面板中。

这是一次用户体验小版本更新，不会削弱验证规则、自动批准房源资料或图片权利，也不改变合规规则和第 5 版浏览器项目结构。

### 本次改进

- **红色面板只显示阻止项：** 阻止项数量不包含普通提醒，并始终与真正阻止导出的规则一致。
- **直接处理操作：** 每个阻止项都有易懂标题、简短说明和按钮，可打开、滚动并聚焦到相关字段或区域。
- **MLS 核对捷径：** “核对 MLS 导入”会直达明确核对控件；完成核对后该阻止项立即消失，修改导入字段后则按规则重新要求核对。
- **单独显示来源变更：** “导入后已修改”使用琥珀色面板，列出全部人工覆盖字段，并链接到第一项。
- **图片和合规门禁可直接处理：** 图片权利、申请要求确认、免责声明、MLS 来源及普通验证字段都会指向正确编辑位置。
- **状态清晰：** 需要处理、普通提醒、可导出但有提醒以及预检通过等状态使用正确数量文案，并且无需刷新即可更新。
- **可访问交互：** 状态变化通过实时区域播报；含义同时依靠文字、符号和颜色表达；按钮有清楚的键盘焦点，操作后焦点位置符合逻辑。
- **自适应版式：** 操作卡片在窄屏和 200% 放大时自动重排，不使用会裁切文字或按钮的固定宽度。
- **保留免责声明：** 法律与合规说明继续显示在可处理状态卡片之外。

### 验证

- 浏览器核心测试覆盖零个、一个及多个阻止项/提醒，只统计阻止项、直达目标元数据、全部已改字段可发现性，以及核对状态即时更新。
- 既有浏览器恢复、MLS 连接器、v1.4 黄金版式、Python 渲染、批处理、社交尺寸、确定性渲染和视觉回归测试继续纳入发布 CI。
- 手工浏览器验收检查键盘焦点、滚动目标、阻止项即时移除/恢复、手机重排、200% 放大及导出行为。
