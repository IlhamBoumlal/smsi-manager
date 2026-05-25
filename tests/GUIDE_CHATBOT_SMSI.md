# Guide technique du chatbot SMSI

## 1) Objectif du chatbot

Le chatbot SMSI sert a aider les utilisateurs de l'application sur:
- l'analyse des donnees SMSI (risques, incidents, controles, audits, etc.)
- les explications methodologiques (ISO 27001, EBIOS RM, PDCA, clauses)
- les questions sur la documentation

Le chatbot est strictement en lecture seule: il n'ecrit jamais dans la base metier principale.

## 2) Architecture globale

Le systeme est compose de 4 briques:
- Frontend React (widget chatbot)
- API metier principale .NET (`http://localhost:5006`)
- Service chatbot local Node/Express (`http://localhost:5055`)
- Modele local Ollama (`http://127.0.0.1:11434`)

Flux simplifie:
1. Le frontend envoie la question au service chatbot local.
2. Le chatbot verifie le JWT via l'API .NET (`/api/auth/me`).
3. Le chatbot recupere les permissions (`/api/User/me/permissions`).
4. Le chatbot lit les donnees SMSI autorisees via des endpoints .NET.
5. Le chatbot construit un contexte condense et interroge Ollama.
6. Le chatbot renvoie la reponse (stream SSE ou JSON) et journalise la conversation dans SQLite local.

## 3) Integration avec la base de donnees

### 3.1 Base metier principale (SQL Server via API .NET)

Le chatbot ne se connecte pas directement a SQL Server.

Il lit les donnees via l'API .NET sur des endpoints comme:
- `/api/clauses/dashboard`
- `/api/clauses/stats`
- `/api/controles`
- `/api/risques/studies`
- `/api/actifs`
- `/api/audits`
- `/api/audits/ncs`
- `/api/sensibilisation`
- `/api/sensibilisation/dashboard`
- `/api/pdca/cycles`
- `/api/documentation`
- `/api/incidents`
- `/api/dashboard/global`

Donc l'acces DB metier est indirect, securise par JWT + RBAC existants du backend .NET.

### 3.2 Base locale du chatbot (SQLite)

Le chatbot stocke seulement l'historique conversationnel local dans:
- `backend/chatbot-local/data/chatbot.sqlite`

Tables:
- `ChatConversation`
- `ChatMessage`

`ChatConversation` contient notamment:
- `id`
- `userId`
- `societeId`
- `title`
- `lastMethod` (ex: `EBIOS_RM`)
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)

`ChatMessage` contient:
- `id`
- `conversationId`
- `userId`
- `societeId`
- `role` (`user`, `assistant`, `system`)
- `content`
- `createdAt`

Le service applique aussi:
- creation auto des tables/index si absentes
- ajout de colonnes manquantes sur schema legacy
- nettoyage des lignes legacy invalides (`userId`/`societeId` null, conversation orpheline)

## 4) Cloisonnement et securite des donnees

Le cloisonnement est applique a plusieurs niveaux:
- Authentification obligatoire par token Bearer.
- Refus du role SuperAdmin pour le chatbot.
- Obligation d'un `societeId` valide.
- Verification permission `chatbot:read`.
- Conversations filtrees par `userId + societeId`.
- Messages filtres par `conversationId + userId + societeId`.

Resultat: un utilisateur ne peut voir que ses propres conversations dans sa societe.

## 5) Permissions (RBAC)

Le module `chatbot` est integre au catalogue de permissions SMSI.

Permission minimale requise:
- module `chatbot`
- action `read`

Dans le seed RBAC, les roles metier standards ont `chatbot:read`:
- AdminSociete
- RSSI
- Consultant
- Auditeur

Le SuperAdmin est explicitement bloque cote chatbot.

## 6) API du chatbot local

Base URL: `http://localhost:5055/api/chatbot`

Routes:
- `POST /conversations` creation de conversation
- `GET /conversations` liste des conversations de l'utilisateur
- `GET /conversations/:id/messages` historique d'une conversation
- `POST /conversations/:id/messages` envoi classique (reponse complete JSON)
- `POST /conversations/:id/messages/stream` envoi streaming SSE
- `DELETE /conversations/:id` suppression logique (soft delete)

## 7) Streaming SSE

Le mode stream envoie des evenements:
- `started`
- `heartbeat`
- `token`
- `done`
- `error`

Protections integrees:
- verrou par conversation/utilisateur (evite 2 streams simultanes)
- timeout avant premier token Ollama
- heartbeat regulier
- nettoyage de lock stale
- gestion abort client (`AbortController`)

## 8) Routage intelligent des intentions

Le routeur detecte plusieurs modes:
- `app_data_analysis`
- `smsi_explanation`
- `document_chat`
- `agent_action`
- `general_chat`

Le mode depend du texte utilisateur (mots-cles, forme de question, signaux document/action/analyse).
Les follow-up (`continue`, `explique plus`) reutilisent le mode de la question precedente.

## 9) Methode EBIOS RM

Quand EBIOS est detecte:
- `lastMethod` est memorise en conversation
- les reponses sont forcees avec la structure EBIOS RM (5 ateliers)
- cette contrainte persiste dans les relances de la meme conversation

## 10) Construction du contexte pour le LLM

Le chatbot:
1. Charge les sources SMSI autorisees.
2. Resume les donnees (KPI dashboard, risques critiques, incidents ouverts, docs, formations, audits, PDCA...).
3. Tronque le contexte JSON si necessaire (limite caracteres).
4. Construit un prompt system + user selon le mode.
5. Envoie a Ollama (`/api/chat`).

Cas optimise:
- certaines questions "controles conformes" peuvent renvoyer une reponse directe sans appel LLM.

## 11) Variables d'environnement importantes

Service chatbot local (`backend/chatbot-local/.env`):
- `PORT` (defaut `5055`)
- `SMSI_API_BASE_URL` (defaut `http://localhost:5006`)
- `OLLAMA_BASE_URL` (defaut `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (defaut `llama3.2:3b`)
- `ALLOWED_ORIGINS`
- `REQUEST_TIMEOUT_MS`
- `OLLAMA_REQUEST_TIMEOUT_MS`
- `OLLAMA_FIRST_TOKEN_TIMEOUT_MS`
- `OLLAMA_NUM_PREDICT`
- `OLLAMA_FOLLOW_UP_NUM_PREDICT`
- `CHATBOT_CONTEXT_CHAR_LIMIT`
- `MAX_HISTORY_MESSAGES`
- `MAX_CONTEXT_ITEMS`
- `SSE_HEARTBEAT_INTERVAL_MS`
- `STREAM_LOCK_MAX_MS`
- `CHATBOT_DB_PATH` (defaut `data/chatbot.sqlite`)

Frontend (`frontend/.env`):
- `REACT_APP_API_URL`
- `REACT_APP_CHATBOT_API_URL`

## 12) Demarrage local

Option recommandee:
- lancer `start-smsi-stack.ps1` a la racine (demarre API .NET, chatbot Node, frontend React, Ollama)

Demarrage manuel:
1. API .NET (`dotnet run` sur `backend/backend`)
2. Ollama (`ollama serve`)
3. Chatbot (`node src/index.js` dans `backend/chatbot-local`)
4. Frontend (`npm start` dans `frontend`)

## 13) Erreurs frequentes et diagnostic

- `OLLAMA_UNAVAILABLE`: Ollama non demarre.
- `OLLAMA_MODEL_NOT_FOUND`: modele non telecharge.
- `CHATBOT_AUTH_REQUIRED`: token absent/invalide.
- `CHATBOT_PERMISSION_DENIED`: permission `chatbot:read` manquante.
- `CHATBOT_COMPANY_SCOPE_REQUIRED`: utilisateur sans societe.
- `CHATBOT_SMSI_CONTEXT_UNAVAILABLE`: API .NET SMSI indisponible.
- `CHATBOT_STREAM_IN_PROGRESS`: stream deja en cours sur la conversation.

## 14) Points cles a retenir

- Le chatbot ne modifie pas la base metier SMSI.
- Il lit la base metier via l'API .NET et les permissions existantes.
- Il enregistre seulement les conversations dans SQLite local.
- Le cloisonnement est strict par utilisateur et societe.
- Le front ne passe jamais `userId`: tout vient du JWT.

