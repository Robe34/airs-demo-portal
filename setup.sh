#!/usr/bin/env bash
# One-time setup after a fresh clone.
# Run: bash setup.sh
set -e

echo "==> Installing Node dependencies..."
npm install

echo ""
echo "==> Setting up Python venv for Model Scanner..."
mkdir -p airs-model-scanner-main
python3 -m venv airs-model-scanner-main/.venv
airs-model-scanner-main/.venv/bin/pip install -q fastapi "uvicorn[standard]" requests python-dotenv python-multipart
echo "    ✓ Scanner venv ready"

echo ""
echo "==> Setting up Python venv for MCP server..."
bash setup-mcp.sh

echo ""
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example"
  echo "    *** Edit .env and fill in your credentials before running npm run dev ***"
else
  echo "==> .env already exists — skipping"
fi

echo ""
echo "✓ Setup complete."
echo ""
echo "Next steps:"
echo "  1. Edit .env with your AIRS + LLM credentials"
echo "  2. npm run dev"
echo "  3. Open http://localhost:5173"
