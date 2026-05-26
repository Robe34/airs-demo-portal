#!/usr/bin/env bash
# Auto-creates the MCP server venv on first run so npm run dev works after a fresh clone.
VENV=mcp-server/.venv
if [ ! -x "$VENV/bin/python3" ]; then
  echo "[mcp] First run — setting up Python venv (takes ~30s)..."
  bash setup-mcp.sh
fi
exec "$VENV/bin/python3" mcp-server/mcp_server.py
