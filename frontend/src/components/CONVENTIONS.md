# 📐 Conventions de Code - Projet ISO 27001

> Normes et patterns utilisés dans Controles.jsx et PlanActionNC.js

---

## 🎯 Principes Généraux

### 1. **Organisation du Code**
```
┌─────────────────────────────────────────┐
│ IMPORTS                                 │
├─────────────────────────────────────────┤
│ Configuration Globale (API, couleurs)   │
├─────────────────────────────────────────┤
│ Fonctions Utilitaires                   │
├─────────────────────────────────────────┤
│ Composants Réutilisables                │
├─────────────────────────────────────────┤
│ Composant Principal                     │
├─────────────────────────────────────────┤
│ Export                                  │
└─────────────────────────────────────────┘
```

### 2. **Commentaires**

#### En-Têtes de Section
```javascript
// ─────────────────────────────────────────────────────────────────────────────
// NOM DE LA SECTION
// ─────────────────────────────────────────────────────────────────────────────
```

#### Commentaires de Blocs/Sections
```javascript
/* ════════════════════════════════════════════════════════════
   SECTION MAJEURE
   Description du rôle et du contenu
════════════════════════════════════════════════════════════ */
```

#### Commentaires Inline
```javascript
const token = localStorage.getItem('token');  // Récupérer depuis sessionStorage
```

#### JSDoc (Functions)
```javascript
/**
 * Description courte de la fonction
 * @param {type} paramName - Description du paramètre
 * @returns {type} Description du retour
 */
function nomFonction(paramName) { ... }
```

---

## 🏗️ Structures de Données

### Configuration Globale
```javascript
// Toujours au début du fichier, après imports
const API = 'http://localhost:5006/api/controles';

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  bg: '#F8F9FB',
  // ...
};
```

### Objets Thématiques
```javascript
// Domaines pour ISO 27001
const DOMAIN_THEMES = {
  domaineName: {
    accent: '#color',
    accentLight: '#color',
    border: '#color',
    tabActive: '#color',
    headerBg: 'linear-gradient(...)',
    icon: <IconComponent size={18} />,
    label: 'Texte affiché',
  },
};
```

### Listes de Statuts/Options
```javascript
const STATUS_LIST = [
  { key: 'statusKey',  label: 'Texte',  color: '#hex', bg: '#hex', ... },
  { key: 'statusKey2', label: 'Texte2', color: '#hex', bg: '#hex', ... },
];
```

---

## ⚛️ Patterns React

### État (useState)
```javascript
// ✅ BON : Noms explicites
const [controles, setControles] = useState([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');

// ❌ À ÉVITER : Noms courts/ambigus
const [data, setData] = useState([]);
const [x, setX] = useState('');
```

### Effets (useEffect)
```javascript
// ✅ BON : Effet unique, bien documenté
useEffect(() => {
  // Description de ce que fait cet effet
  fetchData();
  loadFonts();
}, []);  // Dépendances vides = une seule fois au mount

// À faire : Un effet = Une responsabilité
```

### Fonctions de Callback
```javascript
// ✅ BON : Noms explicites avec verbe d'action
const handleSaveEvaluation = async (updated) => { ... };
const handleApplicableChange = (val) => { ... };
const handleFileChange = (e) => { ... };

// Peut contenir async/await
```

### Rendu Conditionnel
```javascript
// ✅ BON : Ternaire pour 2 cas
{isLoading ? <Loader /> : <Content />}

// ✅ BON : && pour vérifier avant afficher
{hasData && <DataComponent />}

// ❌ ÉVITER : Ternaires imbriquées (utiliser composants à la place)
```

### Listes Rendues
```javascript
// ✅ BON : Clé unique (jamais index si liste modifiable)
{items.map(item => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ MAUVAIS : Index comme clé
{items.map((item, index) => (
  <div key={index}>{item.name}</div>  // ⚠️ Bugs si liste change
))}
```

---

## 🎨 Patterns de Style

### Style Inline (PAS de fichier CSS séparé)
```javascript
// ✅ BON : Objet de style réutilisable
const containerStyle = { 
  display: 'flex', 
  gap: 16, 
  padding: '20px',
};

<div style={containerStyle}>Content</div>

// ❌ À ÉVITER : Style litéral chaque fois
<div style={{ 
  display: 'flex', 
  gap: 16, 
  padding: '20px',
}}>Content</div>
```

### Couleurs
```javascript
// ✅ BON : Utiliser le thème T
background: T.bg,
color: T.gray700,

// ✅ BON : Utiliser domaine spécifique
background: DOMAIN_THEMES[domaine].headerBg,

// ❌ À ÉVITER : Couleurs en dur
background: '#4f46e5',  // Moins flexible
```

### Transitions
```javascript
// ✅ BON : Transitions souples
transition: 'all 0.2s',  // ou 'color 0.3s, opacity 0.3s'

// ✅ BON : Animations nommées dans <style>
animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
```

---

## ✅ Validation des Données

### Avant Traitement
```javascript
// ✅ BON : Vérifier avant d'utiliser
if (ctrl && ctrl.code) {
  const plan = PLANS_ACTION[ctrl.code];
  // ...
}

// ✅ BON : Utiliser l'opérateur || pour fallback
const responsable = plan.responsable || "Non défini";

// ✅ BON : Destructuring avec valeurs par défaut
const { code = "UNKNOWN", titre = "" } = ctrl;
```

### Normalisation des Données
```javascript
// ✅ BON : Créer une fonction dédiée
function normalize(raw) {
  return {
    id: raw.id || raw.ID,
    code: raw.code || raw.Code,
    statut: raw.statut || raw.Statut,
    // ...harmoniser les noms
  };
}

// Puis utiliser
const normalized = data.map(normalize);
```

---

## 📡 Communication API

### Récupération (GET)
```javascript
// ✅ BON : Gestion d'erreur et cleanup
const fetchData = () => {
  axios.get(API)
    .then(r => {
      // Traiter les données
      setControles(r.data);
    })
    .catch(error => {
      console.error('Erreur API:', error);
      // Afficher message utilisateur
    })
    .finally(() => {
      setLoading(false);  // Toujours cleanup
    });
};
```

### Modification (PUT/POST)
```javascript
// ✅ BON : Valider avant d'envoyer
const handleSave = async (updated) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Authentification requise');
    return;
  }
  
  try {
    const response = await axios.put(`${API}/${updated.id}`, updated, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Succès
    setSuccess('Sauvegardé !');
    refetch();
  } catch (error) {
    console.error('Erreur:', error.response?.data);
    setError('Impossible de sauvegarder');
  }
};
```

---

## 🐛 Debugging

### Logging
```javascript
// ✅ BON : Logs clairs et contextuels
console.log('Contrôles chargés:', controles.length);
console.error('Erreur API:', error.message);

// ❌ À ÉVITER : Logs génériques
console.log(data);       // Qu'est-ce que ça contient ?
console.log('Error');    // Quel type d'erreur ?
```

### État du Composant
```javascript
// Pour déboguer, ajouter un effet :
useEffect(() => {
  console.log('État actuel:', {
    controles: controles.length,
    loading,
    activeTab,
    filterDomain,
  });
}, [controles, loading, activeTab, filterDomain]);
```

---

## 🚀 Performance

### Éviter les Rendus Inutiles
```javascript
// ✅ BON : Callbacks stables (ne changent pas à chaque rendu)
const handleChange = useCallback((e) => {
  setSearchTerm(e.target.value);
}, []);  // Dépendances vides = callback stable

// ✅ BON : Mémoriser les calculs coûteux
const stats = useMemo(() => {
  return calculateStats(controles);
}, [controles]);  // Recalculé seulement si controles change
```

### Listes Longues
```javascript
// ✅ BON : Virtualiser si liste > 100 items
import { VariableSizeList } from 'react-window';

// ✅ BON : Scinder en plusieurs pages
const pageSize = 30;
const paginated = controles.slice(
  currentPage * pageSize,
  (currentPage + 1) * pageSize
);
```

---

## 📋 Checklist de Révision Code

Avant de merger :

- [ ] Commentaires clairs et JSDoc sur les fonctions
- [ ] Noms de variables explicites (pas de `x`, `data1`, etc.)
- [ ] Pas d'erreur console (warnings ou errors)
- [ ] Gestion d'erreurs API (try/catch ou .catch())
- [ ] État cleanupé après utilisation
- [ ] Pas d'appels d'API dans des boucles ou rendus
- [ ] Clés uniques sur les listes (pas d'index)
- [ ] Responsive (testé sur mobile)
- [ ] Performance : pas de rendus inutiles
- [ ] Pas de magic numbers (utiliser des constantes)

---

## 📚 Ressources

- **React Best Practices** : https://react.dev/learn
- **ISO 27001** : https://www.iso.org/standard/54534.html
- **Naming Conventions** : https://google.github.io/styleguide/tsguide.html
- **JavaScript** : https://developer.mozilla.org/en-US/docs/Web/JavaScript

---

## 🔄 Évolution Future

### Patterns à Adopter Progressivement

1. **TypeScript** (au lieu de JSDoc)
   ```typescript
   interface Controle {
     id: string;
     code: string;
     domaine: 'Organisationnel' | 'Personnes' | 'Physique' | 'Technologique';
   }
   ```

2. **Custom Hooks** (pour logique réutilisable)
   ```javascript
   const useControles = () => {
     const [controles, setControles] = useState([]);
     // Logique de fetch et tri
     return { controles, loading, error, refetch };
   };
   ```

3. **Composants Découplés** (réduire la couplage)
   ```javascript
   // Créer des petits composants pour chaque étape
   <StepIdentification />
   <StepActionImmediate />
   <StepVerification />
   ```

