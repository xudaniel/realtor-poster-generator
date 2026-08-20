"""Small, dependency-free visual regression checks based on Pillow."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional, Sequence

from PIL import Image, ImageChops, ImageEnhance, ImageOps, ImageStat


@dataclass(frozen=True)
class VisualDiff:
    passed: bool
    mean_absolute_error: float
    changed_pixel_ratio: float
    maximum_channel_delta: int
    threshold: float


def compare_images(
    baseline_path: Path,
    candidate_path: Path,
    *,
    threshold: float = 0.004,
    diff_path: Optional[Path] = None,
) -> VisualDiff:
    """Compare equal-sized RGB images and optionally save an amplified diff.

    ``mean_absolute_error`` is normalized to 0..1. ``changed_pixel_ratio``
    counts pixels whose largest channel delta exceeds 12, which filters tiny
    encoder noise while still exposing real layout movement.
    """
    if not 0 <= threshold <= 1:
        raise ValueError("threshold must be between 0 and 1")
    with Image.open(baseline_path) as raw_baseline, Image.open(candidate_path) as raw_candidate:
        baseline = ImageOps.exif_transpose(raw_baseline).convert("RGB")
        candidate = ImageOps.exif_transpose(raw_candidate).convert("RGB")
    if baseline.size != candidate.size:
        raise ValueError(f"Image sizes differ: baseline={baseline.size}, candidate={candidate.size}")

    diff = ImageChops.difference(baseline, candidate)
    stats = ImageStat.Stat(diff)
    mean_error = sum(stats.mean) / (3 * 255)
    maximum = max(channel[1] for channel in diff.getextrema())
    red, green, blue = diff.split()
    largest_channel_delta = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    changed_mask = largest_channel_delta.point(lambda value: 255 if value > 12 else 0)
    changed_ratio = ImageStat.Stat(changed_mask).mean[0] / 255

    if diff_path:
        diff_path = diff_path.expanduser().resolve()
        diff_path.parent.mkdir(parents=True, exist_ok=True)
        amplified = ImageEnhance.Contrast(diff).enhance(4.0)
        amplified.save(diff_path, "PNG", optimize=True)

    return VisualDiff(
        passed=mean_error <= threshold,
        mean_absolute_error=round(mean_error, 8),
        changed_pixel_ratio=round(changed_ratio, 8),
        maximum_channel_delta=maximum,
        threshold=threshold,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="比较两张海报并输出视觉差异指标。")
    parser.add_argument("baseline", type=Path, help="基准 PNG")
    parser.add_argument("candidate", type=Path, help="候选 PNG")
    parser.add_argument("--diff", type=Path, help="可选的差异图输出路径")
    parser.add_argument("--threshold", type=float, default=0.004, help="允许的平均差异，范围 0 至 1")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = compare_images(args.baseline, args.candidate, threshold=args.threshold, diff_path=args.diff)
    except (OSError, ValueError) as exc:
        print(json.dumps({"passed": False, "error": str(exc)}, ensure_ascii=False, indent=2))
        return 2
    print(json.dumps(asdict(result), ensure_ascii=False, indent=2))
    return 0 if result.passed else 1
