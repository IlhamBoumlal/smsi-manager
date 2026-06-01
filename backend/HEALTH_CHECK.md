# Health Check API (Backend)

Script: `backend/health-check.ps1`

## Run

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1
```

## Custom base URL

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -ApiBaseUrl "http://localhost:5006"
```

## Optional chatbot checks

Use this when `backend/chatbot-local` is running.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -CheckChatbot
```

Custom chatbot URL:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -CheckChatbot -ChatbotBaseUrl "http://localhost:5055"
```

## Custom credentials

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -Email "superadmin@smsi.local" -Password "ChangeMe@123!"
```

## CI / fail fast mode

Returns exit code `1` if at least one check fails.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -FailOnError
```

## JSON output

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -Json
```

## Covered endpoints

- `GET /api/auth/me` (without token, expected `401`)
- `POST /api/auth/login`
- `GET /api/dashboard/global`
- `GET /api/cartographie/processus`
- `GET /api/documentation/permissions`
- `GET /api/documentation`
- `GET /api/incidents`

With `-CheckChatbot`:

- `GET {ChatbotBaseUrl}/health`
- `POST {ChatbotBaseUrl}/api/chatbot/conversations`
- `GET {ChatbotBaseUrl}/api/chatbot/conversations`
- `DELETE {ChatbotBaseUrl}/api/chatbot/conversations/{id}`
