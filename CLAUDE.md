# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start all four services concurrently (primary dev command)
npm run dev

# Individual services
npm run server       # Express proxy only (port 3001)
npm run build        # Vite production build
npm run preview      # Preview production build

# Kill stale processes before restarting
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null
lsof -ti tcp:8001 | xargs kill -9 2>/dev/null
```

`npm run dev` starts four concurrent processes:
| Process | Port | Entry point |
|---|---|---|
| Vite frontend | 5173 | React/Vite |
| Express proxy | 3001 | `server.js` |
| Python scanner | 8001 | `scanner_server.py` |
| MCP server | (8002) | `mcp-server/mcp_server.py` |

## First-time Setup

```bash
# Python environment (required even without Model Scanner)
python3 -m venv airs-model-scanner-main/.venv
airs-model-scanner-main/.venv/bin/pip install fastapi "uvicorn[standard]" requests python-dotenv python-multipart

# Python environment for MCP server
python3 -m venv mcp-server/.venv
# install MCP server deps per mcp-server/ requirements

cp .env.example .env
# Fill in credentials — see Environment Variables section below
```

## Architecture

### Process topology

The browser **never calls cloud APIs directly** — all credentials stay in `server.js`. Vite proxies:
- `/api/*` → port 3001 (Express)
- `/scan-model` → port 8001 (Python FastAPI)
- `/mcp-tool/*` → port 8002 (MCP server, path prefix stripped)

The Python scanner starts in stub mode (returns 503) if credentials or the SDK are absent, so `npm run dev` never fails on a missing scanner setup.

### Frontend state (`src/context/AppContext.jsx`)

Global state uses `useReducer` — no external state library. The five reducer actions are:

| Action | Effect |
|---|---|
| `TOGGLE_PROTECTION` | Flips `isProtected` (drives the red ↔ emerald theme and whether AIRS scanning runs) |
| `SET_VIEW` | Navigates between views (`home`, `apiIntercept`, `modelScanning`, `redTeaming`, `claudeHooks`, `observability`, `mcpSecurity`, `ragSecurity`, `developerCorner`) |
| `SET_SCM_URL` | Stores the Strata Cloud Manager deep-link after each AIRS scan |
| `TOGGLE_THEME` | Toggles dark/light (`isDark`) |
| `SET_SELECTED_TRACE` | Sets `selectedTraceId` for the Observability view |

### Theme system

`useProtectionTheme()` (`src/hooks/useProtectionTheme.js`) is the **single source of truth for all colours**. Every component must call this hook. **Never hardcode Tailwind color classes in components** — colours shift between red (unprotected) and emerald/blue (protected) based on `isProtected`.

### View routing (`src/App.jsx`)

Views are rendered in a `switch` statement. All views except `HomeViewV2` and `ReleaseNotesView` are wrapped in `MainLayout` (which receives `activeView` as a `key` prop to reset component state on navigation).

### API Intercept flow (`server.js` → `src/hooks/useAttackSimulator.js`)

Protected path (two-stage AIRS scan):
1. `airscan(prompt, null)` → Prisma AIRS `/v1/scan/sync/request`
2. If `action === 'block'` → return blocked response; skip LLM
3. Call `callVertexAI` / `callBedrock` / Azure OpenAI
4. `airscan(prompt, llmText)` → response scan
5. Build telemetry object and persist trace to SQLite (`persistTrace()`)

Unprotected path: calls LLM directly, returns `{ chatResponse }` with null scan fields.

The telemetry object preserves raw AIRS request/response payloads for the "Raw API Response" UI panel.

### Bedrock model IDs

Claude 4.x on Bedrock requires cross-region inference profile IDs (`us.anthropic.*`). `server.js` auto-retries with the `us.` prefix if a direct ID returns "on-demand throughput not supported". Claude 3.x works with direct IDs.

### AWS Chatbot Red Team target (`aws-chatbot-target/`)

A separately deployable AWS Lambda + API Gateway chatbot (Python, Claude 3 Haiku via Bedrock, us-east-1) used as a Red Team attack target. Deploy with `bash deploy.sh`; teardown with `aws cloudformation delete-stack --stack-name sudo-airs-chatbot --region us-east-1`.

## Key Environment Variables

### Required for protection mode
```
AIRS_API_KEY=
AIRS_PROFILE_NAME=
AIRS_BASE_URL=    # https://service.api.aisecurity.paloaltonetworks.com
```

### Google Vertex AI
```
GCP_PROJECT_ID=
GCP_REGION=
VERTEX_MODEL=
GOOGLE_APPLICATION_CREDENTIALS=   # path to service account JSON, or use ADC
```

### AWS Bedrock
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=    # required for ASIA* (STS temporary) keys
AWS_REGION=           # default us-west-2
BEDROCK_MODEL_ID=
```

### Azure OpenAI
```
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_VERSION=   # 2025-04-01-preview
AZURE_OPENAI_DEPLOYMENT=
```
Azure deployments are also hardcoded in the `AZURE_DEPLOYMENTS` array in `server.js`.

### Model Scanner & Red Teaming (optional)
```
MODEL_SECURITY_CLIENT_ID=
MODEL_SECURITY_CLIENT_SECRET=
TSG_ID=
LOCAL_SCAN_GROUP_UUID=
HF_SCAN_GROUP_UUID=     # falls back to LOCAL_SCAN_GROUP_UUID
```

### Server ports
```
PROXY_PORT=    # default 3001
MODEL_SCANNER_PORT=    # default 8001
```

## SCM Deep-link

After each protected scan, `useAttackSimulator` builds a Strata Cloud Manager URL using `tr_id`, `profile_id`, and `scan_id` from the AIRS response and dispatches it to `AppContext.scmUrl`. The `/CITADEL/` path segment is a fixed SCM API constant.
