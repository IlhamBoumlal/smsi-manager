# 🛠️ Guide Pratique - Controles & PlanActionNC

> Guide rapide pour naviguer et modifier les composants de gestion des contrôles ISO 27001

## 📍 Localisation des Fichiers

```
src/components/
├── Controles.jsx ................... Tableau de bord principal
├── PlanActionNC.js ................. Gestion plans d'action
└── README_STRUCTURE.md ............. Architecture détaillée (CE FICHIER)
```

---

## 🚀 Démarrage Rapide

### Pour Afficher la Liste des Contrôles :
1. Importer `Controles` dans votre page parent
2. Le composant fetch automatiquement depuis l'API
3. L'état de chargement affiche "⏳ Chargement des contrôles..."

```jsx
import Controles from './components/Controles';

export function HomePage() {
  return <Controles />;
}
```

###   Pour Tester la Sauvegarde :
1. Ouvrir un contrôle (clic sur une carte)
2. Compléter les étapes du panneau d'évaluation
3. Cliquer "Enregistrer"
4. Une requête PUT est envoyée à `/api/controles/{id}`

---

## 🔧 Tâches Courantes

### ❌ Ajouter un Plan d'Action pour un Contrôle Manquant

**Où ?** : PlanActionNC.js, objet `PLANS_ACTION` (lignes ~150-800)

**Comment ?** :
```javascript
// Dans const PLANS_ACTION = { ... }

'A.5.23': {
  actionImmediate: "Décrivez la mesure urgente (24-72h)...",
  causesRacines: "Analyser les causes profondes...",
  planCorrectif: "1. Action 1\n2. Action 2\n3. Action 3\n...",
  verification: "Liste des preuves nécessaires...",
  responsable: "RSSI / DSI / RSSI",
  delai: delai(2),  // 2 mois
},
```

**Points importants** :
- Les plans existent pour A.5.1 → A.8.34 (93 contrôles)
- Si vous en oubliez un, `getDefaultPlan()` génère automatiquement un fallback
- La fonction `delai(mois)` calcule la date d'échéance

---

### 🎨 Changer les Couleurs d'un Domaine

**Où ?** : Controles.jsx, objet `DOMAIN_THEMES` (lignes ~45-65)

**Avant** :
```javascript
Organisationnel: {
  accent: '#4f46e5',  // Indigo
  accentLight: '#e0e7ff',
  border: '#c7d2fe',
  tabActive: '#4f46e5',
  headerBg: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
  icon: <Building2 size={18} />,
  label: 'Organisationnels',
},
```

**Après** (exemple avec vert) :
```javascript
Organisationnel: {
  accent: '#16a34a',        // Vert
  accentLight: '#dcfce7',   // Vert clair
  // ...resto du code
},
```

---

### 📝 Ajouter un Filtre Supplémentaire

**Où ?** : Controles.jsx

**Étapes** :
1. Ajouter un `useState` :
   ```javascript
   const [filterSensibilite, setFilterSensibilite] = useState('all');
   ```

2. Modifier la fonction de filtrage (après line ~340):
   ```javascript
   const filtered = controles.filter(c => {
     if (filterSensibilite !== 'all' && c.sensibilite !== filterSensibilite) return false;
     // ...reste du filtrage
   });
   ```

3. Ajouter les boutons dans l'UI :
   ```jsx
   <button onClick={() => setFilterSensibilite('critique')}>
     Critique
   </button>
   ```

---

### 🔐 Changer l'URL de l'API

**Où ?** : Controles.jsx, ligne 32

```javascript
// Avant :
const API = 'http://localhost:5006/api/controles';

// Après (production) :
const API = 'https://api.monssi.com/api/controles';
```

> ⚠️ Attention aux erreurs CORS en développement !

---

### 📱 Adapter pour Mobile

**Fichier concerné** : Controles.jsx, section `display: grid`

**Exemple** (ligne ~350 pour les KPIs) :
```javascript
// Avant
gridTemplateColumns: "repeat(4,1fr)"

// Après (responsive)
gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(2,1fr)"
```

---

## 🚨 Dépannage Courant

### L'API retourne une erreur 401

**Cause** : Token expiré ou absent
**Solution** : Vérifier `localStorage.getItem('token')`
```javascript
const token = localStorage.getItem('token');
if (!token) {
  // Rediriger vers login
}
```

### Les contrôles n'apparaissent pas

**Cause** : 
1. L'API n'est pas accessible
2. Le format des données est incorrect
3. Un filtre est actif

**Debug** :
```javascript
// Dans fetchData(), ajouter :
console.log('Data reçue:', r.data);
console.log('Data normalisée:', data);
```

### Le plan d'action n'apparaît pas pour une NC

**Cause** : Le contrôle utilise `getDefaultPlan()` (pas de plan spécifique)
**Solution** : Ajouter le contrôle dans `PLANS_ACTION` de PlanActionNC.js

### Les couleurs ne s'appliquent pas

**Cause** : 
1. Le domaine dans les données ne correspond pas aux clés de `DOMAIN_THEMES`
2. Un style en ligne l'emporte sur CSS

**Vérifier** :
```javascript
// Les domaines doivent être exactement :
console.log(DOMAIN_THEMES.Organisationnel);  // Existe ?
console.log(DOMAIN_THEMES.Personnes);        // Existe ?
console.log(DOMAIN_THEMES.Physique);         // Existe ?
console.log(DOMAIN_THEMES.Technologique);    // Existe ?
```

---

## 📊 Améliorations Futures

### À Considérer :

1. **Performance** : Virtualiser la liste (+ de 93 contrôles)
   ```javascript
   import { VariableSizeList } from 'react-window';
   ```

2. **Export** : Ajouter un bouton CSV/PDF
   ```javascript
   const exportToCSV = () => {
     // Générer CSV depuis controles[]
   };
   ```

3. **Kanban** : Afficher en boards par statut
   ```javascript
   const boards = {
     'NonEvalue': [...],
     'Conforme': [...],
     'NCMineure': [...],
   };
   ```

4. **Timetracking** : Graphique de tendance (conformité dans le temps)
   ```javascript
   const historique = [...]; // Snapshots
   ```

5. **Collaboration** : Ajouter commentaires sur les contrôles
   ```javascript
   const [commentaires, setCommentaires] = useState([]);
   ```

---

## 📚 Structure des Données Attendues

### Contrôle (objet individuel) :
```javascript
{
  id: "ctrl-001",
  code: "A.5.1",
  titre: "Politiques d'information",
  description: "Description ISO 27001...",
  domaine: "Organisationnel",  // IMPORTANT : clé exacte !
  applicable: true || false || null,
  statut: "Conforme" || "NonEvalue" || "NCMineure" || "NCMajeure" || "Remarque",
  
  // Optionnels (pour l'évaluation)
  justificationApplicabilite: "...",
  justificationConformite: "...",
  remarque: "...",
  responsable: "...",
  
  // Plan d'action (si NC)
  planCorrectif: "...",
  responsablePlan: "...",
  dateEcheance: "2025-06-01",
  // ...autres champs
}
```

### API Response :
```javascript
// GET /api/controles
[
  { id: "...", code: "A.5.1", ... },
  { id: "...", code: "A.5.2", ... },
  // ... 93 contrôles au total
]

// PUT /api/controles/{id}
{
  Id: "...",
  Titre: "...",
  Statut: "Conforme",
  // ...tous les champs
}
```

---

## 🔑 Variables d'État Clés

```javascript
// Dans <Controles/>

controles          // Array[Controle] - Tous les contrôles
loading            // Boolean - Chargement en cours ?
searchTerm         // String - Texte recherché
activeTab          // String - Filtre statut ("all", "conforme", etc.)
evaluationCtrl     // Object|null - Contrôle en édition
filterDomain       // String - Filtre domaine ("all", "Organisationnel", etc.)
```

---

## 🧪 Tests Recommandés

### Test Manuel :
- [ ] Charger la page et vérifier les 93 contrôles apparaissent
- [ ] Cliquer sur un contrôle et remplir le formulaire
- [ ] Sauvegarder et vérifier que l'API reçoit les données
- [ ] Rafraîchir et vérifier que les données sont persistées
- [ ] Tester chaque filtre (domaine, statut, recherche)
- [ ] Tester sur mobile

### CodeQL (Tests automatisés) :
```bash
# Linter
npm run lint

# Tests
npm test

# Build
npm run build
```

---

## 📞 Support

Pour des questions sur :
- **Architecture** → Voir `README_STRUCTURE.md`
- **Spécification ISO 27001** → https://www.iso.org/standard/54534.html
- **React** → https://react.dev
- **Styled Components** → Voir `const T = { ... }` et utiliser `style={{ ... }}`

