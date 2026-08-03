#!/usr/bin/env bash
# 将仓库根目录 plans/*.json 转为小程序可 require 的 .js 模块
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/plans"
DEST="$ROOT/miniprogram/data/plan"

python3 - <<PY
import json
from pathlib import Path
src = Path("$SRC")
dest = Path("$DEST")
# 清理旧产物
import shutil
if dest.exists():
    shutil.rmtree(dest)
count = 0
for path in src.rglob("*.json"):
    rel = path.relative_to(src)
    data = json.loads(path.read_text(encoding="utf-8"))
    out = dest / rel.with_suffix(".js")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("module.exports = " + json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    count += 1
print(f"Synced {count} plan modules → miniprogram/data/plan/")
PY
