#!/usr/bin/env bash
# Auto-creates the scanner venv on first run so npm run dev works after a fresh clone.
VENV=airs-model-scanner-main/.venv
if [ ! -x "$VENV/bin/python3" ]; then
  echo "[scanner] First run — setting up Python venv (takes ~30s)..."
  mkdir -p airs-model-scanner-main
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q fastapi "uvicorn[standard]" requests python-dotenv python-multipart
  echo "[scanner] Venv ready."
fi
exec "$VENV/bin/python3" scanner_server.py
