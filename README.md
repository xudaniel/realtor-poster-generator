# 房地产海报生成器

这是一个可重复使用、由结构化数据驱动的房地产租售海报生成工具。设计参考了用户提供样图的信息层级，例如醒目的租售状态、地址与价格、房屋数据栏、室内照片、户型图、详细信息分区、周边亮点和经纪人联系方式；整体构图、字体、配色、形状和排版均为重新设计，并非对参考图逐像素复制。

所有地址、价格、MLS 编号、联系方式和房屋说明，都由 Pillow 根据经过验证的 YAML 或 JSON 数据确定性绘制，不使用生成式人工智能生成文字，因此不会出现 AI 拼错地址、电话号码或价格的问题。

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

## 快速开始

在项目目录中运行：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/create_sample_assets.py
python3 generate_poster.py examples/sample_listing.yaml \
  --output outputs/sample-poster.png --pdf
```

最后一条命令会生成：

- `outputs/sample-poster.png`
- `outputs/sample-poster.pdf`
- `outputs/sample-poster.manifest.json`

示例房源、图片、品牌和联系方式均为虚构内容，只用于测试生成器，不应当作真实房地产广告发布。

## 为真实房源生成海报

### 方法一：使用交互式填写脚本

房地产经纪人可以直接回答终端中的问题，无需手动编辑 YAML：

```bash
python3 scripts/new_listing.py \
  --output listings/my-listing.yaml \
  --render outputs/my-listing.png \
  --pdf
```

脚本会依次询问：

- 地址、单元号、城市、邮编和宣传语
- 租金或售价、MLS、卧室、卫生间、面积、楼层和朝向
- 车位、可入住日期、租赁条件和水电费用
- 经纪人姓名、职位、电话、邮箱、公司和网站
- 主图、室内照片、户型图和品牌标志路径
- 房屋特色、大楼设施和周边亮点

完成后，脚本会保存 YAML 数据，并按指定参数生成 PNG 和 PDF。

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
scripts/new_listing.py             经纪人交互式填写工具
scripts/create_sample_assets.py    虚构示例素材生成脚本
examples/sample_listing.yaml       示例房源数据
examples/assets/                   虚构示例图片与品牌标志
input_template.yaml                可复制使用的数据模板
tests/test_poster.py               自动化测试
outputs/                           生成的海报和清单
PRD.md                             中文产品需求文档
```

## 运行测试

```bash
python scripts/create_sample_assets.py
python -m unittest discover -s tests -v
```

当前测试覆盖：

- 示例数据验证和 1800 × 2400 海报渲染
- 非法电子邮箱和电话号码的错误提示
- 单一面积和面积范围的输入支持

## 发布前检查

发布真实房源海报前，经纪人应当自行确认：

- 地址、价格、MLS、房屋面积和所有广告陈述准确无误
- 照片、户型图、品牌标志和字体拥有合法使用权
- 广告符合所在地区的房地产监管规定和经纪公司要求
- 所需免责声明、公司注册名称和经纪人身份信息完整

本工具负责排版和技术验证，不替代经纪人、经纪公司或法律专业人士对广告内容的最终审核。
