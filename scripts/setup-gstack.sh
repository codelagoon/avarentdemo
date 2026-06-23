#!/usr/bin/env bash
# Install gstack into this repo for all teammates (project-local).
# Requires: git, bun (https://bun.sh)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GSTACK_DIR="$ROOT/.claude/skills/gstack"
GSTACK_REPO="https://github.com/garrytan/gstack.git"
CHROME_CHECK="$ROOT/scripts/playwright-browser-check.mjs"

export PATH="${HOME}/.bun/bin:${PATH}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"

cd "$ROOT"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is required." >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is required by gstack setup." >&2
  echo "Install: curl -fsSL https://bun.sh/install | bash" >&2
  exit 1
fi

find_chrome_for_testing() {
  local candidate

  for candidate in \
    "$HOME/.agent-browser/browsers/"*/Google\ Chrome\ for\ Testing.app/Contents/MacOS/Google\ Chrome\ for\ Testing \
    "/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
  do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done

  return 1
}

link_playwright_chromium_cache() {
  local chrome_bin="$1"
  local chrome_app
  local chrome_root
  local cache_dir="$PLAYWRIGHT_BROWSERS_PATH/chromium-1208/chrome-mac-arm64"

  chrome_app="$(cd "$(dirname "$chrome_bin")/../.." && pwd)"
  chrome_root="$(dirname "$chrome_app")"

  mkdir -p "$cache_dir"
  rm -rf "$cache_dir"/*
  for item in "$chrome_root"/*; do
    ln -sf "$item" "$cache_dir/$(basename "$item")"
  done
}

mkdir -p "$ROOT/.claude/skills"

if [ ! -d "$GSTACK_DIR/.git" ]; then
  echo "Cloning gstack into .claude/skills/gstack ..."
  git clone --single-branch --depth 1 "$GSTACK_REPO" "$GSTACK_DIR"
else
  echo "gstack already cloned at .claude/skills/gstack"
  echo "To update: cd .claude/skills/gstack && git pull && ../../scripts/setup-gstack.sh"
fi

if CHROME_PATH="$(find_chrome_for_testing)"; then
  echo "Using existing Chrome for Testing:"
  echo "  $CHROME_PATH"
  export GSTACK_CHROME_EXECUTABLE_PATH="$CHROME_PATH"
  link_playwright_chromium_cache "$CHROME_PATH"
  bash "$ROOT/scripts/patch-gstack-playwright.sh"
else
  AVAIL_KB="$(df -k "$ROOT" | awk 'NR==2 {print $4}')"
  if [ "${AVAIL_KB:-0}" -lt 2097152 ]; then
    echo "Warning: less than 2GB free disk. Playwright Chromium download needs ~400MB." >&2
  fi
fi

echo "Running gstack setup (project-local) ..."
cd "$GSTACK_DIR"
./setup --local

echo ""
echo "gstack is ready for this project."
echo "See CLAUDE.md for skill usage (/browse for all web browsing)."
