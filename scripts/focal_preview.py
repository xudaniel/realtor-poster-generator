#!/usr/bin/env python3
"""经纪人可直接运行的主图焦点预览入口。"""

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from realtor_poster.preview import main


if __name__ == "__main__":
    raise SystemExit(main())
