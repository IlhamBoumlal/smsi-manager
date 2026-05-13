# Chatbot Local SMSI (Ollama)

Ce service ajoute un chatbot local SMSI avec `Express + Node.js` et conversations privees par utilisateur authentifie.

Il lit les donnees existantes de votre application SMSI via l'API principale (.NET), construit un contexte condense, puis interroge Ollama localement.

## 1) Prerequis

- Node.js 18+
- Ollama installe
- API principale SMSI demarree (par defaut: `http://localhost:5006`)
- Frontend React demarre (par defaut: `http://localhost:3000`)

## 2) Installation

```bash
cd backend/chatbot-local
npm install
```

Copiez `.env.example` en `.env` puis ajustez si necessaire:

```env
PORT=5055
SMSI_API_BASE_URL=http://localhost:5006
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## 3) Commandes Ollama

```bash
ollama serve
ollama pull llama3.2:3b
```

Option alternative:

```bash
ollama pull qwen2.5:3b
```

Si vous utilisez `qwen2.5:3b`, mettez:

```env
OLLAMA_MODEL=qwen2.5:3b
```

## 4) Demarrage du service chatbot

```bash
cd backend/chatbot-local
npm run dev
```

Le service sera disponible sur:

- `http://localhost:5055/api/chatbot/conversations`
- `http://localhost:5055/health`

Base locale des conversations:

- `backend/chatbot-local/data/chatbot.sqlite`
- Tables: `ChatConversation`, `ChatMessage`

## 5) Routes API chatbot

Toutes les routes utilisent l'utilisateur authentifie du token (`Authorization: Bearer ...`).
Ne pas envoyer de `userId` depuis le frontend.

- `POST /api/chatbot/conversations`
- `GET /api/chatbot/conversations`
- `GET /api/chatbot/conversations/:id/messages`
- `POST /api/chatbot/conversations/:id/messages`
- `DELETE /api/chatbot/conversations/:id`

## 6) Frontend React

Dans le frontend, configurez si besoin:

```env
REACT_APP_CHATBOT_API_URL=http://localhost:5055
```

## 7) Exemple de requete (mode conversation)

```http
POST /api/chatbot/conversations/:id/messages
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "message": "Quels incidents sont ouverts ?"
}
```
