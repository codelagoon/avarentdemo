#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SETUP_FILE="$ROOT/.claude/skills/gstack/setup"
MARKER="# gstack-meridian-chrome-patch"
CHROME_CHECK="$ROOT/scripts/playwright-browser-check.mjs"

if grep -q "$MARKER" "$SETUP_FILE"; then
  exit 0
fi

cp "$SETUP_FILE" "$SETUP_FILE.bak-meridian"

python3 - "$SETUP_FILE" "$CHROME_CHECK" "$MARKER" <<'PY'
import sys

setup_path, chrome_check, marker = sys.argv[1:4]
text = open(setup_path, encoding="utf-8").read()
needle = 'ensure_playwright_browser() {\n  if [ "$IS_WINDOWS" -eq 1 ]; then'
insert = f'''ensure_playwright_browser() {{
  {marker}
  if [ -n "${{GSTACK_CHROME_EXECUTABLE_PATH:-}}" ]; then
    (
      cd "$SOURCE_GSTACK_DIR"
      node "{chrome_check}"
    ) >/dev/null 2>&1 && return 0
  fi
  if [ "$IS_WINDOWS" -eq 1 ]; then'''

if needle not in text:
    raise SystemExit(f"Could not find ensure_playwright_browser() block in {setup_path}")

open(setup_path, "w", encoding="utf-8").write(text.replace(needle, insert, 1))
PY
