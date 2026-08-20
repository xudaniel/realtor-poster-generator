# 房地产海报生成器 · Realtor Poster Generator

[![Tests](https://img.shields.io/github/actions/workflow/status/xudaniel/realtor-poster-generator/ci.yml?branch=main&label=tests)](https://github.com/xudaniel/realtor-poster-generator/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-d6a25e.svg)](LICENSE)
[![Browser local](https://img.shields.io/badge/privacy-browser--local-2f7654.svg)](web/)

由 **Daniel Xu** 创建并维护。Created and maintained by **Daniel Xu**.

[English README](README.en.md) · [中文产品需求文档](PRD.md) · [English PRD](PRD.en.md) · [在线可视化编辑器 / Live visual editor](https://xudaniel.github.io/realtor-poster-generator/) · [更新记录](CHANGELOG.md) · [参与贡献](CONTRIBUTING.md)

当前版本：**1.3.0**

这是一个可重复使用、由结构化数据驱动的房地产租售海报生成工具。设计参考了用户提供样图的信息层级，例如醒目的租售状态、地址与价格、房屋数据栏、室内照片、户型图、详细信息分区、周边亮点和经纪人联系方式；整体构图、字体、配色、形状和排版均为重新设计，并非对参考图逐像素复制。

Python 流程使用 Pillow，浏览器流程使用 Canvas；两者都根据经过验证的 YAML、JSON 或表单数据确定性绘制地址、价格、MLS 编号、联系方式和房屋说明，不使用生成式人工智能改写文字，因此不会出现 AI 拼错地址、电话号码或价格的问题。

<p align="center">
  <img src="outputs/sample-poster.png" width="420" alt="房地产海报生成器的虚构房源示例">
</p>

## 无需安装：浏览器可视化编辑器

打开[在线编辑器](https://xudaniel.github.io/realtor-poster-generator/)，即可在浏览器中完成无需安装的可视化广告流程：

1. 填写完整房源、经纪人、品牌和中英文宣传资料；
2. 拖入主图、四张室内照片、户型图和明暗两套标志，直接点击照片重点位置调整裁切；
3. 选择租赁、出售、开放日或刚刚上市合规配置，并在导出前完成错误与警告检查；
4. 保存可锁定品牌字段的版本化模板，切换英文、中文或双语版式；
5. 实时预览五种尺寸，下载 PNG、打印为 PDF，或导出社交媒体 ZIP、SHA-256 清单和完整审批包。

照片、联系资料和项目文件只在当前浏览器标签页中处理，不会上传到服务器。也可以完全离线运行：

```bash
python3 scripts/serve_web.py
```

然后打开 `http://127.0.0.1:8765`。浏览器项目可保存为 JSON 或 YAML，并保留表单、主题、焦点、图片、模板、合规配置及审核记录。审批包包含五张校样、源数据、审核记录、清单和校验值；它记录审批状态，但不代表法律或经纪公司批准。

## 主要功能

- 支持地址、单元号、租金、MLS、卧室、卫生间、面积、楼层、朝向、车位和可入住日期
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
- 1.3 提供租赁、出售、开放日和刚刚上市合规配置及导出门禁
- 1.3 提供版本化品牌模板、选择性字段锁定，以及英文、中文和双语版式
- 1.3 提供基准项目比较、审核状态和带 SHA-256 校验的审批包

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
- 卧室、卫生间、面积、楼层、朝向、车位和可入住日期
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
web/                              无上传、浏览器本地运行的完整广告编辑器
web/core.js                       项目结构、验证、YAML、清单与比较核心
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
- GitHub Actions 中的多版本 Python、JavaScript 语法、示例渲染和软件包构建

## 发布前检查

发布真实房源海报前，经纪人应当自行确认：

- 地址、价格、MLS、房屋面积和所有广告陈述准确无误
- 照片、户型图、品牌标志和字体拥有合法使用权
- 广告符合所在地区的房地产监管规定和经纪公司要求
- 所需免责声明、公司注册名称和经纪人身份信息完整

本工具负责排版和技术验证，不替代经纪人、经纪公司或法律专业人士对广告内容的最终审核。

## 开源许可与作者

Copyright © 2026 **Daniel Xu**。本项目根据 [MIT License](LICENSE) 开源。欢迎阅读[贡献指南](CONTRIBUTING.md)后提交问题或拉取请求。
