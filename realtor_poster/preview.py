"""Generate an offline focal-point selection and layout preview page."""

from __future__ import annotations

import argparse
import base64
import html
import io
import json
from pathlib import Path
from typing import Optional, Sequence

from PIL import Image, ImageOps

from .config import ConfigError, load_config
from .renderer import render_poster


def _image_data_uri(image: Image.Image, *, maximum: int, quality: int = 88) -> str:
    image = image.convert("RGB")
    image.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    stream = io.BytesIO()
    image.save(stream, "JPEG", quality=quality, optimize=True)
    encoded = base64.b64encode(stream.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


def create_focal_preview(data: dict, output_html: Path) -> Path:
    """Write a self-contained HTML tool for selecting ``photos.hero_focal``."""
    hero_path = Path(data["photos"]["hero"])
    with Image.open(hero_path) as source:
        hero = ImageOps.exif_transpose(source).convert("RGB")
    poster = render_poster(data)
    hero_uri = _image_data_uri(hero, maximum=1800)
    poster_uri = _image_data_uri(poster, maximum=850, quality=84)
    focal = data["photos"].get("hero_focal", [0.5, 0.5])
    title = f"{data['listing']['address']} - Unit {data['listing']['unit']}"

    page = f"""<!doctype html>
<html lang="zh-Hans">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>主图焦点预览 - {html.escape(title)}</title>
  <style>
    :root {{ --ink:#102A2A; --paper:#FFFDF8; --bg:#F4F0E7; --accent:#D99A55; }}
    * {{ box-sizing:border-box; }}
    body {{ margin:0; background:var(--bg); color:var(--ink); font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }}
    main {{ max-width:1440px; margin:auto; padding:32px; }}
    h1 {{ margin:0 0 4px; font-size:30px; }}
    .intro {{ color:#5e6965; margin:0 0 24px; }}
    .grid {{ display:grid; grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr); gap:24px; }}
    .card {{ background:var(--paper); border-radius:22px; padding:20px; box-shadow:0 12px 32px #102a2a16; }}
    h2 {{ margin:0 0 12px; font-size:19px; }}
    #source-wrap {{ position:relative; width:100%; background:#d8d8d2; border-radius:14px; overflow:hidden; cursor:crosshair; }}
    #source {{ display:block; width:100%; height:auto; }}
    #cross {{ position:absolute; width:34px; height:34px; border:3px solid white; border-radius:50%; box-shadow:0 0 0 3px var(--accent),0 4px 12px #0008; transform:translate(-50%,-50%); pointer-events:none; }}
    #crop {{ width:100%; aspect-ratio:1800/760; object-fit:cover; border-radius:14px; display:block; }}
    .values {{ display:flex; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap; }}
    code {{ background:#102a2a; color:white; padding:10px 14px; border-radius:10px; }}
    button {{ border:0; background:var(--accent); color:var(--ink); font-weight:700; padding:11px 16px; border-radius:10px; cursor:pointer; }}
    .poster {{ width:100%; display:block; border-radius:12px; }}
    .note {{ font-size:14px; color:#66716d; }}
    @media (max-width:900px) {{ main {{ padding:18px; }} .grid {{ grid-template-columns:1fr; }} }}
  </style>
</head>
<body>
<main>
  <h1>主图焦点预览</h1>
  <p class="intro">{html.escape(title)}。在完整照片上点击希望优先保留的位置，右侧裁切预览会立即更新。</p>
  <div class="grid">
    <section class="card">
      <h2>1. 点击完整主图选择焦点</h2>
      <div id="source-wrap"><img id="source" src="{hero_uri}" alt="完整主图"><span id="cross"></span></div>
      <div class="values">
        <code id="yaml"></code>
        <button id="copy" type="button">复制 YAML</button>
        <span id="copied" class="note" aria-live="polite"></span>
      </div>
      <p class="note">复制后，将这一行替换到房源文件的 <strong>photos</strong> 区域中，再重新生成海报。</p>
      <h2>2. 主图横幅裁切预览</h2>
      <img id="crop" src="{hero_uri}" alt="主图横幅裁切预览">
    </section>
    <aside class="card">
      <h2>当前完整海报缩略图</h2>
      <img class="poster" src="{poster_uri}" alt="当前海报预览">
    </aside>
  </div>
</main>
<script>
  const sourceWrap = document.getElementById('source-wrap');
  const crop = document.getElementById('crop');
  const cross = document.getElementById('cross');
  const yaml = document.getElementById('yaml');
  const copied = document.getElementById('copied');
  let x = {json.dumps(float(focal[0]))};
  let y = {json.dumps(float(focal[1]))};
  function update() {{
    cross.style.left = `${{x * 100}}%`;
    cross.style.top = `${{y * 100}}%`;
    crop.style.objectPosition = `${{x * 100}}% ${{y * 100}}%`;
    yaml.textContent = `hero_focal: [${{x.toFixed(3)}}, ${{y.toFixed(3)}}]`;
  }}
  sourceWrap.addEventListener('click', event => {{
    const rect = sourceWrap.getBoundingClientRect();
    x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    copied.textContent = '';
    update();
  }});
  document.getElementById('copy').addEventListener('click', async () => {{
    try {{ await navigator.clipboard.writeText(yaml.textContent); copied.textContent = '已复制'; }}
    catch (_) {{ copied.textContent = '请手动选择并复制'; }}
  }});
  update();
</script>
</body>
</html>
"""
    output_html = output_html.expanduser().resolve()
    if output_html.suffix.lower() != ".html":
        output_html = output_html.with_suffix(".html")
    output_html.parent.mkdir(parents=True, exist_ok=True)
    output_html.write_text(page, encoding="utf-8")
    return output_html


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="创建无需联网的主图焦点与版面预览页面。")
    parser.add_argument("input", type=Path, help="房源 YAML 或 JSON 文件")
    parser.add_argument("-o", "--output", type=Path, default=Path("outputs/focal-preview.html"), help="HTML 输出路径")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        output = create_focal_preview(load_config(args.input), args.output)
    except (ConfigError, OSError) as exc:
        print(f"无法创建焦点预览：{exc}")
        return 2
    print(f"HTML: {output}")
    return 0
