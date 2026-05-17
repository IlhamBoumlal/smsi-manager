# Plan de déploiement détaillé - SMSI Manager

## 1. Objectif du document

Ce document décrit un plan complet de déploiement pour le projet **SMSI Manager**. Il couvre la préparation de l'environnement, la configuration applicative, la base de données, le déploiement du backend ASP.NET Core, du frontend React, du service chatbot local, les contrôles de sécurité, les tests de validation, la supervision, la sauvegarde et le plan de retour arrière.

Le projet est composé de trois blocs principaux :

- **Backend API** : application ASP.NET Core .NET 9 exposant les endpoints REST, SignalR, l'authentification JWT, la gestion des fichiers et les services métier.
- **Frontend** : application React consommant l'API via `REACT_APP_API_URL` et le chatbot via `REACT_APP_CHATBOT_API_URL`.
- **Chatbot local** : service Node.js/Express utilisant Ollama localement et une base SQLite pour l'historique des conversations.

## 2. Architecture cible

### 2.1 Vue d'ensemble

L'architecture recommandée pour un environnement de production ou de préproduction est la suivante :

```text
Utilisateurs
    |
    | HTTPS
    v
Reverse proxy / IIS / Nginx
    |
    |-- Frontend React statique
    |
    |-- /api/*              -> Backend ASP.NET Core
    |-- /notificationHub    -> Backend ASP.NET Core SignalR
    |-- /api/chatbot/*      -> Service chatbot Node.js
                            -> Ollama local
                            -> SQLite chatbot

Backend ASP.NET Core
    |
    |-- SQL Server
    |-- wwwroot/uploads
    |-- wwwroot/documents
    |-- SMTP / IMAP
```

### 2.2 Composants déployés

| Composant | Technologie | Port local courant | Rôle |
|---|---:|---:|---|
| API principale | ASP.NET Core .NET 9 | `5006` | Authentification, logique métier, REST, SignalR, fichiers |
| Frontend | React / react-scripts | `3000` en développement | Interface utilisateur |
| Chatbot local | Node.js / Express | `5055` | Conversations, streaming SSE, appel à Ollama |
| Ollama | Service local IA | `11434` | Modèle LLM local |
| Base SMSI | SQL Server | `1433` ou instance nommée | Données métier |
| Base chatbot | SQLite | fichier local | Historique des conversations |

## 3. Prérequis techniques

### 3.1 Prérequis serveur

Prévoir au minimum :

- Système : Windows Server 2019/2022 ou Linux récent.
- CPU : 4 vCPU minimum, 8 vCPU recommandés si Ollama tourne sur le même serveur.
- RAM : 8 Go minimum, 16 Go recommandés avec chatbot local.
- Stockage : SSD, 50 Go minimum, avec espace séparé ou quota surveillé pour les fichiers uploadés.
- Réseau : accès HTTPS entrant, accès sortant SMTP/IMAP si les notifications email sont activées.

### 3.2 Logiciels nécessaires

Installer :

- **.NET SDK/Runtime 9** pour compiler et exécuter l'API.
- **SQL Server** ou SQL Server Express selon le contexte.
- **Node.js 18+** pour le build frontend et le service chatbot.
- **npm** compatible avec les `package-lock.json`.
- **Ollama** si le chatbot IA local est activé.
- Un serveur web ou reverse proxy : **IIS**, **Nginx** ou **Apache**.
- Un certificat TLS valide pour exposer l'application en HTTPS.

### 3.3 Comptes et droits

Créer ou prévoir :

- Un compte système dédié pour exécuter l'API.
- Un compte système dédié pour le service chatbot.
- Un compte SQL Server applicatif avec droits limités à la base SMSI.
- Un compte SMTP/IMAP dédié, idéalement avec mot de passe applicatif.
- Un compte administrateur initial de l'application.

## 4. Préparation des environnements

### 4.1 Environnements recommandés

Prévoir au moins trois environnements :

| Environnement | Objectif | Données |
|---|---|---|
| Développement | Travail local des développeurs | Données fictives |
| Préproduction | Validation fonctionnelle et technique | Copie anonymisée ou jeu réaliste |
| Production | Exploitation réelle | Données réelles |

### 4.2 Convention de nommage

Exemple :

- Base de données développement : `SmsiManager_Dev`
- Base de données préproduction : `SmsiManager_Preprod`
- Base de données production : `SmsiManager_Prod`
- Site frontend : `smsi.domaine.tld`
- API interne : `http://127.0.0.1:5006`
- Chatbot interne : `http://127.0.0.1:5055`

## 5. Gestion de configuration

### 5.1 Variables backend à préparer

Le backend lit principalement sa configuration via `appsettings.*.json`, variables d'environnement ou secrets serveur.

Configuration obligatoire :

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=SERVEUR_SQL;Database=SmsiManager_Prod;User Id=smsi_app;Password=***;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "*** clé longue et aléatoire ***",
    "Issuer": "SmsiManager",
    "Audience": "SmsiManager",
    "ExpireMinutes": 60
  },
  "Bootstrap": {
    "SuperAdmin": {
      "Email": "admin@domaine.tld",
      "Password": "*** mot de passe temporaire fort ***",
      "NomComplet": "Super Administrateur"
    },
    "CleanupLegacySeedAccounts": false
  },
  "Email": {
    "SmtpServer": "smtp.domaine.tld",
    "SmtpPort": "587",
    "SmtpUser": "notifications@domaine.tld",
    "SmtpPass": "***",
    "FromEmail": "notifications@domaine.tld",
    "FromName": "SMSI Manager"
  },
  "EmailMonitoring": {
    "Enabled": false,
    "ImapServer": "imap.domaine.tld",
    "Port": 993,
    "UseSsl": true,
    "Username": "incidents@domaine.tld",
    "Password": "***",
    "CheckIntervalSeconds": 60
  }
}
```

Points importants :

- Ne jamais utiliser la clé JWT de développement en production.
- Ne jamais conserver les mots de passe de développement dans un dépôt Git.
- Désactiver `EmailMonitoring.Enabled` si l'import automatique d'incidents depuis une boîte email n'est pas utilisé.
- Augmenter `CheckIntervalSeconds` en production pour éviter un polling excessif.
- Stocker les secrets dans des variables d'environnement, un coffre-fort ou la configuration sécurisée du serveur.

### 5.2 Variables frontend à préparer

Le frontend React est compilé avec des variables `REACT_APP_*`.

Exemple de fichier `.env.production` dans `frontend` :

```env
REACT_APP_API_URL=https://smsi.domaine.tld
REACT_APP_CHATBOT_API_URL=https://smsi.domaine.tld
```

Si l'API et le chatbot sont exposés sur des sous-domaines séparés :

```env
REACT_APP_API_URL=https://api-smsi.domaine.tld
REACT_APP_CHATBOT_API_URL=https://chatbot-smsi.domaine.tld
```

Attention : les variables React sont injectées au moment du build. Toute modification nécessite un nouveau build frontend.

### 5.3 Variables chatbot à préparer

Créer un fichier `.env` dans `backend/chatbot-local` :

```env
PORT=5055
SMSI_API_BASE_URL=http://127.0.0.1:5006
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
ALLOWED_ORIGINS=https://smsi.domaine.tld
REQUEST_TIMEOUT_MS=60000
OLLAMA_REQUEST_TIMEOUT_MS=600000
OLLAMA_FIRST_TOKEN_TIMEOUT_MS=600000
OLLAMA_NUM_PREDICT=512
OLLAMA_FOLLOW_UP_NUM_PREDICT=900
CHATBOT_CONTEXT_CHAR_LIMIT=8000
MAX_HISTORY_MESSAGES=16
MAX_CONTEXT_ITEMS=12
SSE_HEARTBEAT_INTERVAL_MS=15000
CHATBOT_DB_PATH=data/chatbot.sqlite
```

## 6. Préparation de la base de données

### 6.1 Création de la base SQL Server

Créer la base :

```sql
CREATE DATABASE SmsiManager_Prod;
GO
```

Créer un login applicatif :

```sql
CREATE LOGIN smsi_app WITH PASSWORD = 'MotDePasseFortAChanger!';
GO
USE SmsiManager_Prod;
GO
CREATE USER smsi_app FOR LOGIN smsi_app;
GO
ALTER ROLE db_datareader ADD MEMBER smsi_app;
ALTER ROLE db_datawriter ADD MEMBER smsi_app;
GO
```

Pendant l'application des migrations, le compte doit aussi pouvoir modifier le schéma. Deux approches sont possibles :

- accorder temporairement `db_owner`, appliquer les migrations, puis retirer ce droit ;
- exécuter les migrations avec un compte d'administration SQL séparé.

### 6.2 Application des migrations Entity Framework

Depuis le dossier racine du projet :

```powershell
dotnet ef database update --project backend/backend/backend.csproj --startup-project backend/backend/backend.csproj
```

Avant production, valider :

- la présence de la chaîne `ConnectionStrings:DefaultConnection` ;
- la disponibilité du serveur SQL ;
- l'absence d'erreur de migration ;
- la création des tables Identity et métier ;
- l'initialisation du compte super administrateur.

### 6.3 Initialisation applicative

Au démarrage, le backend exécute `DbInitializer.InitializeAsync`. Cette étape peut :

- créer ou synchroniser les rôles applicatifs ;
- créer le compte `SuperAdmin` défini dans `Bootstrap:SuperAdmin` ;
- initialiser certaines données de référence.

Après le premier démarrage production :

- se connecter avec le compte super administrateur ;
- changer immédiatement le mot de passe temporaire ;
- vérifier les rôles et permissions ;
- désactiver ou modifier tout compte de test.

## 7. Build et publication du backend

### 7.1 Restauration et compilation

Depuis la racine :

```powershell
dotnet restore backend/backend/backend.csproj
dotnet build backend/backend/backend.csproj -c Release
```

### 7.2 Publication

Publier l'API :

```powershell
dotnet publish backend/backend/backend.csproj -c Release -o .\publish\api
```

Le dossier `publish/api` doit contenir :

- les DLL de l'application ;
- les dépendances .NET ;
- les fichiers statiques nécessaires ;
- le fichier `Infrastructure/SeedData/controles.json`, configuré pour être copié à la publication.

### 7.3 Configuration runtime

Sur le serveur, configurer :

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:ASPNETCORE_URLS = "http://127.0.0.1:5006"
```

Pour une installation Windows Service, préférer des variables système ou une configuration de service persistante.

### 7.4 Lancement manuel de test

Depuis le dossier publié :

```powershell
dotnet backend.dll
```

Contrôler :

- démarrage sans exception ;
- connexion SQL réussie ;
- initialisation terminée ;
- absence de secrets affichés dans les logs ;
- endpoints API accessibles localement.

## 8. Build et publication du frontend

### 8.1 Installation des dépendances

Depuis `frontend` :

```powershell
npm ci
```

### 8.2 Build production

Configurer les variables d'environnement puis compiler :

```powershell
$env:REACT_APP_API_URL = "https://smsi.domaine.tld"
$env:REACT_APP_CHATBOT_API_URL = "https://smsi.domaine.tld"
npm run build
```

Le résultat se trouve dans :

```text
frontend/build
```

### 8.3 Publication statique

Copier le contenu de `frontend/build` vers le répertoire web public :

```text
C:\inetpub\wwwroot\smsi-manager
```

ou un répertoire équivalent si Nginx/Apache est utilisé.

### 8.4 Vérification frontend

Après publication :

- ouvrir l'URL publique ;
- vérifier le chargement de `index.html`, JS et CSS ;
- vérifier que les appels API ciblent l'URL de production ;
- tester la connexion ;
- tester le rafraîchissement direct d'une route React, par exemple `/dashboard`.

Le serveur web doit rediriger les routes inconnues vers `index.html` pour supporter le routing côté client.

## 9. Déploiement du chatbot local

### 9.1 Installation

Depuis `backend/chatbot-local` :

```powershell
npm ci
```

Créer le fichier `.env` de production selon la section 5.3.

### 9.2 Préparation Ollama

Installer Ollama puis télécharger le modèle :

```powershell
ollama pull llama3.2:3b
```

Vérifier que le service répond :

```powershell
Invoke-WebRequest http://127.0.0.1:11434/api/tags
```

### 9.3 Lancement du chatbot

Test manuel :

```powershell
npm run start
```

Endpoint de santé :

```text
http://127.0.0.1:5055/health
```

### 9.4 Base SQLite du chatbot

La base est stockée par défaut dans :

```text
backend/chatbot-local/data/chatbot.sqlite
```

Prévoir :

- un dossier persistant hors répertoire temporaire ;
- des permissions d'écriture pour le compte du service ;
- une sauvegarde régulière ;
- une exclusion des déploiements destructifs.

## 10. Reverse proxy et exposition HTTPS

### 10.1 Principe recommandé

Exposer publiquement uniquement le reverse proxy en HTTPS :

```text
https://smsi.domaine.tld
```

Puis router :

- `/` vers le frontend React statique ;
- `/api/*` vers `http://127.0.0.1:5006`;
- `/notificationHub` vers `http://127.0.0.1:5006`;
- `/api/chatbot/*` vers `http://127.0.0.1:5055`.

### 10.2 Points SignalR

Pour SignalR, activer :

- WebSocket ;
- proxy HTTP/1.1 ou HTTP/2 compatible ;
- passage des headers `Authorization`, `Upgrade`, `Connection` ;
- timeout suffisamment long.

### 10.3 Points SSE chatbot

Le chatbot utilise un flux streaming SSE pour certaines réponses. Le reverse proxy doit :

- ne pas bufferiser excessivement les réponses ;
- garder les connexions ouvertes ;
- autoriser `text/event-stream`;
- utiliser un timeout supérieur au temps de génération IA.

### 10.4 CORS

Le backend contient une policy CORS `AllowReact` limitée à des URLs locales. Pour une production avec domaines séparés, il faut ajouter les origines de production dans `Program.cs` ou rendre la liste configurable.

Exemple cible :

```csharp
p.WithOrigins("https://smsi.domaine.tld")
 .AllowAnyMethod()
 .AllowAnyHeader()
 .AllowCredentials();
```

Si le frontend, l'API et le chatbot sont servis sous le même domaine via reverse proxy, les problèmes CORS sont fortement réduits.

## 11. Déploiement sous forme de services

### 11.1 Backend en Windows Service

Créer un service Windows pointant vers le backend publié :

```powershell
sc.exe create SmsiManagerApi binPath= "C:\Program Files\dotnet\dotnet.exe C:\apps\smsi\api\backend.dll" start= auto
sc.exe start SmsiManagerApi
```

Recommandations :

- utiliser un compte de service dédié ;
- définir les variables d'environnement au niveau service ou machine ;
- écrire les logs vers un dossier supervisé ;
- redémarrer automatiquement en cas d'échec.

### 11.2 Chatbot en service

Deux options :

- créer un service Windows avec `node src/index.js` ;
- utiliser un gestionnaire de processus comme PM2 si l'environnement le permet.

Exemple PM2 :

```powershell
npm install -g pm2
pm2 start src/index.js --name smsi-chatbot
pm2 save
```

### 11.3 Ollama en service

Vérifier que le service Ollama démarre automatiquement avec le serveur. Si nécessaire, créer un service dédié lançant :

```powershell
ollama serve
```

## 12. Gestion des fichiers uploadés

Le backend sert des fichiers via `wwwroot`, notamment :

- `wwwroot/uploads`;
- `wwwroot/documents`;
- `wwwroot/logos`.

En production :

- stocker ces dossiers dans un emplacement persistant ;
- éviter de les écraser lors d'un redéploiement ;
- sauvegarder les fichiers avec la base de données ;
- contrôler les extensions autorisées ;
- imposer une taille maximale ;
- scanner les fichiers si la politique de sécurité l'exige.

Si les fichiers restent dans le dossier publié, le script de déploiement doit préserver ces répertoires.

## 13. Sécurité avant mise en production

### 13.1 Secrets

À vérifier impérativement :

- supprimer ou remplacer toute clé de développement ;
- remplacer les mots de passe de bootstrap ;
- stocker les secrets hors Git ;
- utiliser des mots de passe applicatifs pour SMTP/IMAP ;
- renouveler toute information sensible déjà partagée ou versionnée.

### 13.2 Authentification et JWT

Vérifier :

- clé JWT longue, aléatoire et confidentielle ;
- expiration cohérente avec le contexte métier ;
- HTTPS obligatoire ;
- cookies ou tokens non exposés dans des logs ;
- rôles et permissions correctement initialisés.

### 13.3 Base de données

Appliquer :

- principe du moindre privilège ;
- sauvegardes chiffrées ;
- accès SQL limité au serveur applicatif ;
- journalisation des connexions sensibles ;
- rotation périodique des mots de passe.

### 13.4 Surface d'exposition

Ne pas exposer publiquement :

- SQL Server ;
- Ollama ;
- port interne du backend ;
- port interne du chatbot ;
- fichiers `.env`, `appsettings.*.json`, logs ou sauvegardes.

## 14. Tests de validation avant bascule

### 14.1 Tests backend

Compiler :

```powershell
dotnet build backend/backend/backend.csproj -c Release
```

Exécuter le script de santé existant :

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -ApiBaseUrl "https://smsi.domaine.tld" -FailOnError
```

Contrôler au minimum :

- `POST /api/auth/login`;
- `GET /api/dashboard/global`;
- `GET /api/cartographie/processus`;
- `GET /api/documentation`;
- `GET /api/incidents`;
- accès aux fichiers uploadés ;
- connexion SignalR à `/notificationHub`.

### 14.2 Tests frontend

Vérifier :

- page de connexion ;
- espace super administrateur ;
- gestion des holdings ;
- gestion des sociétés ;
- gestion des utilisateurs ;
- dashboard ;
- cartographie des processus ;
- clauses et contrôles ;
- documentation ;
- incidents ;
- sensibilisation ;
- risques ;
- audits ;
- actifs ;
- droits et restrictions par rôle.

### 14.3 Tests chatbot

Vérifier :

- `GET /health`;
- création d'une conversation ;
- envoi d'un message ;
- streaming SSE ;
- suppression d'une conversation ;
- refus d'accès sans token JWT ;
- séparation des conversations par utilisateur.

### 14.4 Tests email

Vérifier :

- envoi SMTP d'une notification ;
- réception IMAP si `EmailMonitoring.Enabled=true`;
- création d'incident depuis email si cette fonctionnalité est activée ;
- logs d'erreur en cas d'identifiants invalides.

## 15. Procédure de déploiement détaillée

### 15.1 Étape 1 - Préparer la version

1. Se placer sur la branche ou le tag à déployer.
2. Vérifier l'état Git.
3. Vérifier que les migrations EF sont présentes.
4. Vérifier que les fichiers de configuration production sont prêts.
5. Noter le numéro de version ou le hash Git.

Commandes utiles :

```powershell
git status
git rev-parse --short HEAD
```

### 15.2 Étape 2 - Sauvegarder l'existant

Avant toute mise à jour :

- sauvegarder la base SQL Server ;
- sauvegarder les dossiers `uploads`, `documents`, `logos` ;
- sauvegarder la base SQLite du chatbot ;
- sauvegarder les fichiers de configuration serveur ;
- exporter la configuration du reverse proxy/IIS.

### 15.3 Étape 3 - Construire les artefacts

Backend :

```powershell
dotnet publish backend/backend/backend.csproj -c Release -o .\publish\api
```

Frontend :

```powershell
cd frontend
npm ci
$env:REACT_APP_API_URL = "https://smsi.domaine.tld"
$env:REACT_APP_CHATBOT_API_URL = "https://smsi.domaine.tld"
npm run build
cd ..
```

Chatbot :

```powershell
cd backend/chatbot-local
npm ci --omit=dev
cd ../..
```

### 15.4 Étape 4 - Mettre les services en maintenance

Informer les utilisateurs, puis arrêter :

- backend API ;
- chatbot ;
- frontend si nécessaire ;
- tâches planifiées liées au projet.

Éviter d'arrêter SQL Server si une sauvegarde ou une migration est en cours.

### 15.5 Étape 5 - Déployer l'API

1. Copier `publish/api` vers le dossier applicatif, par exemple `C:\apps\smsi\api`.
2. Restaurer ou préserver les dossiers de fichiers persistants.
3. Appliquer la configuration production.
4. Vérifier les permissions du compte de service.
5. Appliquer les migrations si elles ne sont pas exécutées automatiquement.
6. Démarrer le service API.

### 15.6 Étape 6 - Déployer le frontend

1. Copier le contenu de `frontend/build`.
2. Le placer dans le dossier web public.
3. Vérifier la règle de fallback vers `index.html`.
4. Purger le cache du navigateur ou du CDN si nécessaire.

### 15.7 Étape 7 - Déployer le chatbot

1. Copier le dossier `backend/chatbot-local` ou l'artefact préparé.
2. Préserver le dossier `data`.
3. Vérifier `.env`.
4. Vérifier qu'Ollama répond.
5. Démarrer le service chatbot.
6. Tester `/health`.

### 15.8 Étape 8 - Redémarrer le reverse proxy

Recharger la configuration IIS/Nginx/Apache :

- vérifier le certificat HTTPS ;
- vérifier les routes `/api`, `/notificationHub`, `/api/chatbot`;
- vérifier les timeouts WebSocket et SSE ;
- vérifier les logs d'erreur.

### 15.9 Étape 9 - Validation post-déploiement

Effectuer immédiatement :

- test de connexion super admin ;
- test d'un utilisateur société ;
- chargement dashboard ;
- création ou consultation d'un processus ;
- consultation documentation ;
- test d'un upload de fichier ;
- test SignalR via notification incident ;
- test chatbot ;
- consultation des logs API et chatbot.

## 16. Plan de retour arrière

### 16.1 Conditions de rollback

Déclencher un rollback si :

- l'application ne démarre pas ;
- la connexion est impossible ;
- les migrations provoquent une erreur critique ;
- les fonctionnalités principales sont indisponibles ;
- les performances deviennent incompatibles avec l'exploitation ;
- un incident de sécurité est détecté.

### 16.2 Rollback applicatif

1. Arrêter API et chatbot.
2. Restaurer le dossier API précédent.
3. Restaurer le build frontend précédent.
4. Restaurer la configuration reverse proxy précédente si elle a changé.
5. Redémarrer les services.
6. Vérifier les endpoints critiques.

### 16.3 Rollback base de données

Si les migrations ont modifié le schéma :

- privilégier une restauration de sauvegarde complète si la fenêtre de maintenance le permet ;
- sinon appliquer un script de rollback EF préparé et testé ;
- ne jamais improviser une suppression de colonnes ou tables en production.

### 16.4 Rollback fichiers

Restaurer :

- `wwwroot/uploads`;
- `wwwroot/documents`;
- `wwwroot/logos`;
- `backend/chatbot-local/data/chatbot.sqlite`.

## 17. Sauvegarde et restauration

### 17.1 Éléments à sauvegarder

Sauvegarde quotidienne minimum :

- base SQL Server SMSI ;
- dossiers de fichiers uploadés ;
- base SQLite chatbot ;
- configuration serveur ;
- certificats TLS ;
- scripts de déploiement.

### 17.2 Politique recommandée

Exemple :

- sauvegardes complètes quotidiennes ;
- sauvegardes transactionnelles SQL toutes les heures si nécessaire ;
- rétention 30 jours ;
- copie hors serveur ;
- test de restauration mensuel.

### 17.3 Test de restauration

Un test de restauration doit valider :

- restauration SQL ;
- cohérence des fichiers ;
- démarrage de l'API ;
- connexion utilisateur ;
- accès documentation/upload ;
- historique chatbot si requis.

## 18. Supervision et logs

### 18.1 API

Surveiller :

- disponibilité HTTP ;
- erreurs 5xx ;
- temps de réponse ;
- erreurs SQL ;
- erreurs SMTP/IMAP ;
- consommation CPU/RAM ;
- taille des dossiers `wwwroot`.

### 18.2 Frontend

Surveiller :

- erreurs JavaScript côté navigateur ;
- disponibilité de `index.html`;
- erreurs de chargement des assets ;
- erreurs CORS ;
- erreurs d'authentification.

### 18.3 Chatbot

Surveiller :

- endpoint `/health`;
- disponibilité d'Ollama ;
- temps de première réponse ;
- erreurs SSE ;
- taille de `chatbot.sqlite`;
- consommation RAM/CPU liée au modèle.

### 18.4 Alertes recommandées

Créer des alertes pour :

- API indisponible plus de 2 minutes ;
- SQL Server indisponible ;
- espace disque inférieur à 15 % ;
- erreurs 5xx répétées ;
- échec de sauvegarde ;
- certificat TLS proche expiration ;
- Ollama indisponible si chatbot activé.

## 19. Checklist finale de mise en production

### 19.1 Avant déploiement

- [ ] Version validée en préproduction.
- [ ] Sauvegarde complète effectuée.
- [ ] Variables production prêtes.
- [ ] Secrets remplacés.
- [ ] Certificat HTTPS installé.
- [ ] Base SQL Server créée.
- [ ] Compte SQL applicatif configuré.
- [ ] Compte super admin défini.
- [ ] SMTP/IMAP validé ou désactivé.
- [ ] Ollama installé si chatbot activé.

### 19.2 Pendant déploiement

- [ ] Services arrêtés proprement.
- [ ] API publiée en Release.
- [ ] Frontend compilé avec les bonnes URLs.
- [ ] Chatbot installé et configuré.
- [ ] Migrations appliquées.
- [ ] Dossiers persistants préservés.
- [ ] Reverse proxy rechargé.

### 19.3 Après déploiement

- [ ] Login super admin réussi.
- [ ] Login utilisateur société réussi.
- [ ] Dashboard chargé.
- [ ] Cartographie testée.
- [ ] Documentation testée.
- [ ] Upload/download testés.
- [ ] SignalR testé.
- [ ] Chatbot testé.
- [ ] Logs contrôlés.
- [ ] Sauvegarde post-déploiement lancée.
- [ ] Mot de passe super admin temporaire changé.

## 20. Risques principaux et mesures de réduction

| Risque | Impact | Prévention |
|---|---|---|
| Mauvaise URL API dans le frontend | Interface inutilisable | Build avec `.env.production` validé |
| CORS incomplet | Appels API bloqués | Même domaine via reverse proxy ou origines production configurées |
| Secret de développement en production | Risque sécurité | Rotation et stockage sécurisé |
| Migration SQL non testée | Indisponibilité ou perte de données | Préproduction + sauvegarde + script rollback |
| Fichiers uploadés écrasés | Perte documentaire | Dossiers persistants et sauvegardés |
| Ollama indisponible | Chatbot inutilisable | Health check et service auto-start |
| Timeout SSE/WebSocket | Notifications/chatbot instables | Configuration reverse proxy adaptée |
| Compte SMTP bloqué | Notifications KO | Compte applicatif dédié et monitoring |

## 21. Commandes de référence

### Backend

```powershell
dotnet restore backend/backend/backend.csproj
dotnet build backend/backend/backend.csproj -c Release
dotnet publish backend/backend/backend.csproj -c Release -o .\publish\api
dotnet ef database update --project backend/backend/backend.csproj --startup-project backend/backend/backend.csproj
```

### Frontend

```powershell
cd frontend
npm ci
$env:REACT_APP_API_URL = "https://smsi.domaine.tld"
$env:REACT_APP_CHATBOT_API_URL = "https://smsi.domaine.tld"
npm run build
```

### Chatbot

```powershell
cd backend/chatbot-local
npm ci
npm run start
```

### Ollama

```powershell
ollama pull llama3.2:3b
ollama serve
```

### Health check API

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/health-check.ps1 -ApiBaseUrl "https://smsi.domaine.tld" -FailOnError
```

## 22. Recommandation finale

Le déploiement doit être réalisé d'abord en préproduction avec une base proche de la production. La mise en production doit ensuite suivre une fenêtre de maintenance courte, avec sauvegarde complète, validation immédiate et possibilité de rollback. Pour ce projet, les points les plus sensibles sont la configuration des secrets, la chaîne SQL Server, la persistance des fichiers `wwwroot`, la configuration CORS/reverse proxy, SignalR, le streaming SSE du chatbot et le changement immédiat du mot de passe super administrateur après le premier démarrage.
