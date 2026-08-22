# 房地产海报生成器 · Realtor Poster Generator

[![Tests](https://img.shields.io/github/actions/workflow/status/xudaniel/realtor-poster-generator/ci.yml?branch=main&label=tests)](https://github.com/xudaniel/realtor-poster-generator/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-d6a25e.svg)](LICENSE)
[![Browser local](https://img.shields.io/badge/privacy-browser--local-2f7654.svg)](web/)

由 **Daniel Xu** 创建并维护。Created and maintained by **Daniel Xu**.

[English README](README.en.md) · [v1.4.3 中英双语发布说明](RELEASE_NOTES_v1.4.3.md) · [v1.4.2 发布说明](RELEASE_NOTES_v1.4.2.md) · [中文产品需求文档](PRD.md) · [English PRD](PRD.en.md) · [在线可视化编辑器 / Live visual editor](https://xudaniel.github.io/realtor-poster-generator/) · [更新记录](CHANGELOG.md) · [参与贡献](CONTRIBUTING.md)

当前稳定版本：**1.4.3** · 浏览器项目结构：**第 6 版**

这是一个可重复使用、由结构化数据驱动的房地产租售海报生成工具。设计参考了用户提供样图的信息层级，例如醒目的租售状态、地址与价格、房屋数据栏、室内照片、户型图、详细信息分区、周边亮点和经纪人联系方式；整体构图、字体、配色、形状和排版均为重新设计，并非对参考图逐像素复制。

Python 流程使用 Pillow，浏览器流程使用 Canvas；两者都根据经过验证的 YAML、JSON 或表单数据确定性绘制地址、价格、MLS 编号、联系方式和房屋说明，不使用生成式人工智能改写文字，因此不会出现 AI 拼错地址、电话号码或价格的问题。

<p align="center">
  <img src="outputs/sample-poster.png" width="420" alt="房地产海报生成器的虚构房源示例">
</p>

## 无需安装：浏览器可视化编辑器

打开[在线编辑器](https://xudaniel.github.io/realtor-poster-generator/)，即可在浏览器中完成无需安装的可视化广告流程：

1. 填写完整房源、经纪人、品牌和中英文宣传资料；
2. 拖入主图、四张室内照片、三维家具户型图、二维技术户型图和明暗两套标志，并分别选择等比适应、按宽度适应或裁切；
3. 选择租赁、出售、开放日或刚刚上市合规配置，并在导出前完成错误与警告检查；
4. 保存可锁定品牌字段的版本化模板，切换英文、中文或双语版式；
5. 实时预览五种尺寸，下载 PNG、打印为 PDF，或导出社交媒体 ZIP、SHA-256 清单和完整审批包。

手工编辑模式下，照片、联系资料和项目文件只保存在当前设备的浏览器本地存储中，不会上传到服务器。MLS 导入只有在用户主动连接本机授权连接器并输入一个房源编号时才会向已配置供应商发出请求；编辑器没有分析代码。也可以完全离线运行：

```bash
python3 scripts/serve_web.py
```

然后打开 `http://127.0.0.1:8765`。浏览器项目可保存为 JSON 或 YAML，并保留表单、主题、焦点、图片、模板、合规配置及审核记录。审批包包含五张校样、源数据、审核记录、清单和校验值；它记录审批状态，但不代表法律或经纪公司批准。

v1.4 编辑器还会在修改后，以及替换项目、重置或导出前，把完整可编辑项目（包括浏览器本地图片）自动保存到 IndexedDB。再次打开编辑器时，中英双语恢复栏会显示最新草稿及保存时间。不同项目使用独立标识；另一标签页出现较新草稿时会发出冲突警告；存储失败不会静默忽略；用户仍可下载便携项目文件作为手动备份。点击“清除草稿”可删除本浏览器中的恢复副本。

## v1.4.3：卧室 + 额外房间/书房

v1.4.3 实现 [Issue #27](https://github.com/xudaniel/realtor-poster-generator/issues/27)。编辑器把“主卧室”和“额外房间/书房”作为两个独立的非负整数输入：主卧室范围为 `0–20`，额外房间/书房范围为 `0–10`。房屋数据栏使用安全标签 **“卧室 + 额外房间/书房”**；额外数量为 `0` 时只显示主卧室数量，额外数量为正数时按 `2 + 1` 这样的固定格式显示。两个数量永远不会相加为 `3 间卧室`，额外房间/书房也不会被描述为法律意义上的卧室。

第 6 版浏览器项目结构分别保存 `listing.beds` 与 `listing.bedsAdditional`；YAML/JSON 交换格式分别使用 `beds` 与 `beds_additional`。便携项目、IndexedDB 恢复、项目比较、来源清单和审批包都原样保留两个数量。第 5 版及更早的单一卧室值会迁移为相同主卧室数和 `0` 个额外房间；明确的旧式复合值（如 `1 + 1`）会拆分为两个字段，不改变海报显示。

完整海报、方形、竖版、限时动态和横版五种格式使用同一个结构化表达与无障碍说明，例如“`2 间卧室 + 1 个额外房间/书房`”。获授权 MLS 导入只有在供应商明确提供独立额外数量或明确复合值时才会写入该字段，并在逐字段来源中保留原始供应商值；系统不会从说明、备注、照片或户型图推断 `+1`。导入后修改任一数量都会记录本地覆盖、使既有 MLS 人工核对失效，并要求重新核对后再导出。

## v1.4.2：可直接处理的导出预检

v1.4.2 实现 [Issue #25](https://github.com/xudaniel/realtor-poster-generator/issues/25)。红色“需要处理”面板现在只显示真正阻止导出的事项；每个阻止项均使用易懂说明，并提供可直接打开、滚动和聚焦到相关控件的按钮。不会阻止导出的 MLS 来源变更会单独显示在琥珀色面板中，同时列出所有已修改字段并链接到第一项。数量、单复数文案、键盘焦点和实时区域会随项目修改即时更新；法律与合规说明仍保留在操作卡片之外。本次不改变验证或合规规则，浏览器项目结构继续使用第 5 版。

## v1.4.1：从获授权 MLS 记录生成

v1.4.1 实现 [Issue #22](https://github.com/xudaniel/realtor-poster-generator/issues/22)。静态 GitHub Pages 无法安全保存 MLS/供应商密钥，因此正式访问使用一个仅监听 `127.0.0.1` 的本机连接器。密钥只从环境变量读取；网页、仓库、日志、项目导出和来源清单都不会收到密钥。连接器只调用由操作者固定配置的官方或合同 HTTPS 接口，不提供抓取、全局编号搜索、猜号或绕过权限功能。

使用获授权连接器：

```bash
export MLS_PROVIDER_TOKEN="由供应商安全提供的密钥"
realtor-poster-mls \
  --provider-id YOUR_PROVIDER \
  --provider-name "Your Authorized Provider" \
  --board YOUR_BOARD \
  --endpoint 'https://provider.example/listings/{listing_number}'
python3 scripts/serve_web.py
```

然后打开 `http://127.0.0.1:8765`，在“获授权 MLS 导入”中连接 `http://127.0.0.1:8766`。供应商接口必须返回[标准化合同](docs/MLS_CONNECTOR_CONTRACT.md)；不同供应商需要经过授权的适配器。导入要求“供应商 + board + MLS 号”唯一匹配，并保留逐字段原值、获取时间、人工覆盖和图片权利状态。撤销、过期、歧义、无权访问和未解决图片权利会阻止导出；刷新会先显示差异；最后必须由用户明确核对。系统不会自动补写、翻译或改写供应商未提供的内容，也不代表法律、监管、MLS、地产局、经纪公司或版权批准。

## 主要功能

- 支持地址、单元号、租金、MLS、独立的主卧室与额外房间/书房数量、卫生间、面积、楼层、朝向、车位和可入住日期
- 支持房屋特色、大楼设施、水电费用、租赁条件和周边亮点
- 支持主图、最多四张室内照片、户型图和透明背景品牌标志
- 自动处理照片方向、等比例缩放、裁切和主图焦点
- 自动缩小字体、换行和限制列表长度，避免文字溢出
- 自动验证必填字段、电子邮箱、电话号码、数值和资源文件路径
- 可配置品牌颜色、字体、画布尺寸和输出分辨率
- 可同时导出 PNG、PDF 和带 SHA-256 校验值的清单文件
- 提供交互式经纪人填写脚本和可直接编辑的 YAML 模板
- 1.2 支持一次处理整个文件夹中的多套 YAML 或 JSON 房源
- 1.2 支持方形、竖版、限时动态和横版四种社交媒体尺寸
- 1.2 提供无需联网的主图焦点选择与完整海报预览页面
- 1.2 提供像素确定性测试、差异指标和可选视觉差异图
- 1.3 在浏览器中支持完整房源资料、室内照片、户型图、双标志和 YAML/JSON 往返
- 1.3 提供租赁、出售、开放日和刚刚上市合规配置、经纪人职衔/执照资料及导出门禁
- 1.3 提供可携带字体与默认版式的版本化品牌模板、选择性字段锁定，以及中英文独立排版的双语版式
- 1.3 提供基准项目比较、审核状态和带 SHA-256 校验的审批包
- v1.4 提供 3–8 项可排序房屋数据栏，并在社交尺寸中按优先级显示四项
- v1.4 提供可独立替换、排序、等比显示和焦点裁切的三维/二维双户型图
- v1.4 提供最多三项圆形、圆角方形或矩形重点卖点图文
- v1.4 提供最多九项可排序、隐藏或标记不适用的双语租约详情
- v1.4 提供带 MIT 许可 Tabler 图标、可排序并可标记待确认的租金包含项目
- v1.4 新增租客承担费用模块，并把与租金包含项目重复的费用作为阻止导出的错误
- v1.4 新增最多十二项双语设施、最多十项申请要求及发布前确认与免责声明门禁
- v1.4 新增照片、插画、姓名首字母或无头像四种经纪人资料页脚，以及双语行动号召
- v1.4 用原创深绿/金色模块化版式统一打印海报与社交尺寸，并在空间不足时按优先级收拢内容
- v1.4 横向恢复功能（[#20](https://github.com/xudaniel/realtor-poster-generator/issues/20)）会在生成、导出、刷新、重置或替换项目前保留可编辑字段与本地图片，不改变故事 1–10 的编号
- v1.4.1 新增仅本机运行的获授权 MLS 连接器、唯一匹配、确定性字段映射、逐字段来源、刷新差异、图片权利门禁和人工审核门禁
- v1.4.2 把阻止项与普通提醒分开，并为每个阻止项提供可用键盘操作、直达待处理字段的按钮
- v1.4.3 新增“卧室 + 额外房间/书房”结构化字段、安全的 `2 + 1` 显示、第 6 版项目迁移、五格式一致输出，以及明确来源且修改后重新核对的 MLS 流程

## v1.4 正式版：故事 1–10

v1.4.0 将浏览器项目结构升级至第 4 版。房屋数据、双户型图、重点卖点、租约详情、租金包含、租客承担费用、设施、申请要求及经纪人资料页脚都会进入项目文件、差异比较、来源清单和审批包。所有数值与文字均来自用户输入；系统不会翻译、推断或改写日期、金额、尺寸和租赁条件。

户型图、卖点图和经纪人头像仍只保存在当前设备的浏览器本地存储中。每张户型图会保存原始像素尺寸，并在当前输出尺寸可能不够清晰时给出警告；清单会记录嵌入图片的 SHA-256。Tabler 图标随应用本地提供并根据其 MIT 许可证使用。

申请要求是信息展示，不是自动资格审核。只要启用了申请要求，导出前就必须由用户确认要求并保留免责声明。经纪人头像若缺失或失效，版式会退回姓名首字母，不会显示损坏图片。

Issue #20 是 v1.4 的横向基础能力，不是 Story 11。系统把由项目结构驱动的完整数据保存为同一份恢复快照，因此编号故事中新加入的字段和图片会自动继承同一套保存与恢复路径，不会形成互相冲突的多套持久化机制。

## 快速开始

在项目目录中运行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/create_sample_assets.py
python3 generate_poster.py examples/sample_listing.yaml \
  --output outputs/sample-poster.png --pdf --social all
```

最后一条命令会生成：

- `outputs/sample-poster.png`
- `outputs/sample-poster.pdf`
- `outputs/sample-poster.square.png`，1080 × 1080
- `outputs/sample-poster.portrait.png`，1080 × 1350
- `outputs/sample-poster.story.png`，1080 × 1920
- `outputs/sample-poster.landscape.png`，1200 × 630
- `outputs/sample-poster.manifest.json`

示例房源、图片、品牌和联系方式均为虚构内容，只用于测试生成器，不应当作真实房地产广告发布。

## 为真实房源生成海报

### 方法一：使用交互式填写脚本

房地产经纪人可以直接回答终端中的问题，无需手动编辑 YAML：

```bash
python3 scripts/new_listing.py \
  --output listings/my-listing.yaml \
  --render outputs/my-listing.png \
  --pdf \
  --social all
```

脚本会依次询问：

- 地址、单元号、城市、邮编和宣传语
- 租金或售价、MLS、卧室、卫生间、面积、楼层和朝向
- 车位、可入住日期、租赁条件和水电费用
- 经纪人姓名、职位、电话、邮箱、公司和网站
- 主图、室内照片、户型图和品牌标志路径
- 房屋特色、大楼设施和周边亮点

完成后，脚本会保存 YAML 数据，并按指定参数生成 PNG、PDF 和社交媒体图片。

### 方法二：直接编辑模板

1. 复制 `input_template.yaml`。
2. 将房源照片、户型图和品牌标志放在数据文件附近，或填写正确的相对路径。
3. 替换模板中的所有占位内容。
4. 先验证数据：

```bash
python3 generate_poster.py my-listing.yaml --validate-only
```

5. 生成 PNG 和 PDF：

```bash
python3 generate_poster.py my-listing.yaml \
  --output outputs/my-listing.png --pdf
```

也可以安装为本地命令：

```bash
python -m pip install -e .
realtor-poster my-listing.yaml -o outputs/my-listing.png --pdf
```

## 1.2 批量生成

把多套房源 YAML 或 JSON 放入同一个文件夹，例如 `listings/`，然后直接把文件夹作为输入：

```bash
python3 generate_poster.py listings/ \
  --output outputs/batch \
  --pdf \
  --social all
```

程序会先验证所有房源；只要有一套资料无效，就不会开始渲染，从而避免交付一半成功、一半失败的广告包。全部资料通过后，每套房源会获得独立的 PNG、可选 PDF、社交媒体图片和清单文件，批次结果记录在：

```text
outputs/batch/batch-summary.json
```

只检查整个文件夹而不生成图片：

```bash
python3 generate_poster.py listings/ --validate-only
```

## 1.2 社交媒体尺寸

使用 `--social` 选择需要的尺寸：

```bash
# 一次生成全部四种尺寸
python3 generate_poster.py my-listing.yaml -o outputs/my-listing.png --social all

# 只生成方形和限时动态尺寸
python3 generate_poster.py my-listing.yaml -o outputs/my-listing.png \
  --social square --social story
```

| 参数 | 尺寸 | 建议用途 |
|---|---:|---|
| `square` | 1080 × 1080 | Instagram、Facebook 方形贴文 |
| `portrait` | 1080 × 1350 | Instagram 竖版贴文 |
| `story` | 1080 × 1920 | Instagram、Facebook 限时动态 |
| `landscape` | 1200 × 630 | Facebook、LinkedIn 和网页分享图 |

社交版本使用与完整海报相同的已验证资料和品牌主题，但采用适合手机阅读的精简版式，不会简单拉伸或压缩完整海报。

## 1.2 主图焦点选择与预览

如果自动裁切没有保留建筑、房间或景观的重点，可生成一个无需联网的预览页面：

```bash
python3 scripts/focal_preview.py examples/sample_listing.yaml \
  --output outputs/sample-focal-preview.html
```

用浏览器打开生成的 HTML，在完整主图上点击重点位置。页面会立即显示横幅裁切效果，并提供可复制的 YAML：

```yaml
hero_focal: [0.620, 0.480]
```

预览页面把图片直接嵌入单一 HTML 文件，不会向外部网站上传房源照片。

## 1.2 视觉回归检查

当品牌颜色、字体或渲染代码改变后，可以把新版图片与已经批准的基准图进行比较：

```bash
python3 scripts/visual_regression.py \
  approved/sample-poster.png \
  outputs/sample-poster.png \
  --diff outputs/sample-poster.diff.png \
  --threshold 0.004
```

命令会输出：

- 是否通过阈值
- 标准化平均绝对差异
- 明显变化的像素比例
- 最大颜色通道差异

完全一致时返回成功状态；超过阈值时返回非零状态，便于在自动化检查中阻止意外版式变化。差异图只用于检查，不应作为正式广告发布。

## 输入字段

模板支持以下内容：

- 房源状态、地址、单元号、城市、邮编和宣传语
- 租金或售价、计价周期和 MLS 编号
- 主卧室数量（`0–20`）、额外房间/书房数量（`0–10`）、卫生间、面积、楼层、朝向、车位和可入住日期
- 租赁条件、房屋特色、大楼设施、水电费用和周边亮点
- 经纪人姓名、职位、电话、邮箱、公司名称、网站和品牌宣传语
- 主图、最多四张室内照片、户型图和品牌标志
- 品牌颜色、可选字体、画布尺寸和 DPI

程序会在生成海报前检查所有必填字段和图片路径。电子邮箱必须符合常见邮箱格式；电话号码必须包含 10 至 15 位数字，可以使用常见的空格、括号、加号和短横线。

面积可以填写正数，例如 `815`，也可以填写使用 ASCII 短横线的范围，例如 `600-699`。

## 照片裁切

程序会自动读取 EXIF 方向信息、按比例缩放并裁切照片，不会拉伸图片。

可以用 `hero_focal: [x, y]` 指定主图重点区域。两个值都在 `0` 至 `1` 之间：

- `[0.0, 0.0]`：优先保留左上角
- `[0.5, 0.5]`：以图片中心为重点
- `[1.0, 1.0]`：优先保留右下角

建议主图宽度至少为 2000 像素，室内照片宽度至少为 1400 像素，户型图应当具有清晰的黑白对比，品牌标志建议使用透明背景 PNG。

## 品牌与字体

修改 YAML 中 `theme` 下的七个十六进制颜色，即可匹配不同经纪公司或团队的品牌规范。

`font_regular`、`font_bold` 和 `font_serif` 可以指定 `.ttf`、`.otf` 或兼容字体集合。留空时，程序会自动选择 macOS 或 Linux 上常见的系统字体。

为了在不同电脑上获得尽量一致的输出，建议固定 Python 和 Pillow 版本，并明确指定相同的字体和图片文件。生成的清单文件会记录输入文件、图片、字体和输出文件的 SHA-256 校验值。

## JSON 输入

YAML 更适合经纪人手动填写，但程序同样支持结构一致的 JSON：

```bash
python3 generate_poster.py listing.json \
  --output outputs/listing.png --pdf
```

## 项目结构

```text
generate_poster.py                 简单的海报生成入口
realtor_poster/                    渲染、绘图、验证和命令行模块
realtor_poster/batch.py            批量发现、预验证和输出摘要
realtor_poster/social.py           四种自适应社交媒体版式
realtor_poster/preview.py          离线主图焦点与版面预览页面
realtor_poster/visual_regression.py 视觉差异指标和差异图
realtor_poster/mls_connector.py   获授权供应商的本机回环连接器
web/                              手工本地编辑器及可选本机授权导入
web/core.js                       项目结构、验证、YAML、清单与比较核心
web/mls.js                        仅允许回环地址的连接器客户端
scripts/new_listing.py             经纪人交互式填写工具
scripts/create_sample_assets.py    虚构示例素材生成脚本
scripts/serve_web.py               本地可视化编辑器启动脚本
scripts/focal_preview.py           经纪人可直接运行的焦点预览入口
scripts/visual_regression.py       可直接运行的视觉回归入口
examples/sample_listing.yaml       示例房源数据
examples/assets/                   虚构示例图片与品牌标志
input_template.yaml                可复制使用的数据模板
tests/test_poster.py               Python 与静态浏览器测试
tests/test_web_core.js             浏览器核心单元测试
tests/test_web_mls.js              浏览器连接器边界测试
outputs/                           生成的海报和清单
PRD.md                             中文产品需求文档
PRD.en.md                          English product requirements document
```

## 运行测试

```bash
python scripts/create_sample_assets.py
python -m unittest discover -s tests -v
node tests/test_web_core.js
```

当前测试覆盖：

- 示例数据验证和 1800 × 2400 海报渲染
- 非法电子邮箱和电话号码的错误提示
- 单一面积和面积范围的输入支持
- 四种社交媒体输出尺寸和颜色模式
- 同一环境内重复渲染的像素确定性
- 离线焦点页面的图片嵌入和隐私边界
- 视觉回归对真实变化的识别
- 多套房源的批量发现、预验证和输出
- 浏览器编辑器的隐私边界、导出功能与核心静态资源
- 浏览器 YAML 往返、合规门禁、模板清单、审批要求和项目比较
- 主卧室与额外房间/书房的整数边界、`2 + 1` 显示、旧项目迁移、五格式版式、MLS 明确来源和人工核对失效
- GitHub Actions 中的多版本 Python、JavaScript 语法、示例渲染和软件包构建

## 发布前检查

发布真实房源海报前，经纪人应当自行确认：

- 地址、价格、MLS、房屋面积和所有广告陈述准确无误
- 主卧室与额外房间/书房数量分别符合房源来源；没有把额外房间/书房当成法律意义上的卧室
- 照片、户型图、品牌标志和字体拥有合法使用权
- 广告符合所在地区的房地产监管规定和经纪公司要求
- 所需免责声明、公司注册名称和经纪人身份信息完整

本工具负责排版和技术验证，不替代经纪人、经纪公司或法律专业人士对广告内容的最终审核。

## 开源许可与作者

Copyright © 2026 **Daniel Xu**。本项目根据 [MIT License](LICENSE) 开源。欢迎阅读[贡献指南](CONTRIBUTING.md)后提交问题或拉取请求。
