# ðŸŽ¨ CUSTOMISATIONS ET EXTENSIONS

## Options de Personnalisation

### 1️⃣ Format du Champ Utilisateur

**ACTUELLEMENT** (dans `Controles.jsx` ligne ~365) :
```javascript
const user = JSON.parse(localStorage.getItem('user'));
const username = user?.nom || 'Utilisateur';
```

#### Options de Changement

**Option A : Utiliser l'email**
```javascript
const username = user?.email || user?.nom || 'Utilisateur';
// Résultat : "jean.dupont@company.com"
```

**Option B : Utiliser le prénom + nom**
```javascript
const username = [user?.prenom, user?.nom]
  .filter(Boolean)
  .join(' ') || 'Utilisateur';
// Résultat : "Jean Dupont"
```

**Option C : Format court (prénom)**
```javascript
const username = user?.prenom || user?.nom || 'Utilisateur';
// Résultat : "Jean"
```

**Option D : De l'ID utilisateur**
```javascript
const username = user?.id || user?.userId || 'Utilisateur';
// Résultat : "12345"
```

**Option E : Formule personnalisée**
```javascript
const username = user?.titre 
  ? `${user?.nom} (${user?.titre})`
  : user?.nom || 'Utilisateur';
// Résultat : "Jean Dupont (Responsable QA)"
```

---

### 2️⃣ Format de l'Affichage Date

**ACTUELLEMENT** (dans `TraceabilityBanner`) :
```javascript
new Date(ctrl.dateModification).toLocaleDateString('fr-FR', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})
// Affichage : "15/01/2026 14:30"
```

#### Options de Format

**Option A : Date longue**
```javascript
toLocaleDateString('fr-FR', { 
  weekday: 'long',    // lundi
  year: 'numeric',    // 2026
  month: 'long',      // janvier
  day: 'numeric'      // 15
})
// Affichage : "mercredi 15 janvier 2026"
```

**Option B : Avec secondes**
```javascript
toLocaleString('fr-FR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})
// Affichage : "15/01/2026 14:30:45"
```

**Option C : Format très court**
```javascript
toLocaleDateString('fr-FR', { 
  day: 'numeric',
  month: 'numeric'
})
// Affichage : "15/1"
```

**Option D : Relatif (ex: "il y a 2h")**
```javascript
function formatDateRelative(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `il y a ${diffMins}m`;
  if (diffMins < 1440) return `il y a ${Math.floor(diffMins/60)}h`;
  return date.toLocaleDateString('fr-FR');
}
// Affichage : "il y a 2h" ou "15/01/2026"
```

**Option E : Personnalisé**
```javascript
const date = new Date(ctrl.dateModification);
const day = String(date.getDate()).padStart(2, '0');
const month = String(date.getMonth() + 1).padStart(2, '0');
const year = date.getFullYear();
const hours = String(date.getHours()).padStart(2, '0');
const mins = String(date.getMinutes()).padStart(2, '0');

const formatted = `${day}/${month}/${year} à ${hours}:${mins}`;
// Affichage : "15/01/2026 à 14:30"
```

---

### 3️⃣ Couleur du Banneau

**ACTUELLEMENT** (dans `TraceabilityBanner`) :
```javascript
background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
border: '1px solid #cffafe',
```

#### Options de Couleur

**Option A : Gradient bleu sombre**
```javascript
background: 'linear-gradient(135deg, #1e3a8a 0%, #1f2937 100%)',
border: '1px solid #3b82f6',
// Avec texte blanc :
color: '#fff'
```

**Option B : Vert d'audit**
```javascript
background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
border: '1px solid #6ee7b7',
```

**Option C : Orange alerte**
```javascript
background: 'linear-gradient(135deg, #fef3c7 0%, #ffe4b5 100%)',
border: '1px solid #f59e0b',
```

**Option D : Gris neutre**
```javascript
background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
border: '1px solid #9ca3af',
```

**Option E : Dégradé personnalisé**
```javascript
background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
border: '2px solid #667eea',
```

---

### 4️⃣ Position du Banneau de Traçabilité

**ACTUELLEMENT** : En haut du formulaire (ligne 1 de contenu)

#### Alternatives

**Option A : À côté du titre**
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h2>{form.code} — Évaluation</h2>
  <TraceabilityBanner ctrl={ctrl} compact={true} />
  <X onClick={onClose} />
</div>
```

**Option B : En footer (en bas du formulaire)**
```jsx
<div style={{ 
  borderTop: '1px solid #e5e7eb',
  padding: '20px 28px',
  background: '#f8fafc'
}}>
  <TraceabilityBanner ctrl={ctrl} />
</div>
```

**Option C : En popup/tooltip**
```jsx
<button 
  title="Cliquez pour voir la traçabilité"
  onClick={() => setShowTraceability(!showTraceability)}
>
  ðŸ• Info
</button>
{showTraceability && <TraceabilityBanner ctrl={ctrl} />}
```

**Option D : Sous forme de badge**
```jsx
<div style={{
  display: 'inline-flex',
  gap: 20,
  fontSize: 11,
  color: '#9ca3af'
}}>
  <span>
    <Clock size={12} /> {formatDate(ctrl.dateModification)}
  </span>
  <span>
    <User size={12} /> {ctrl.modifiePar}
  </span>
</div>
```

---

### 5️⃣ Affichage dans la Liste

**ACTUELLEMENT** (sous chaque description) :
```
🕐 Modifié le 15/01/2026 par Jean Dupont
```

#### Alternatives

**Option A : Dans une colonne séparée (tableau)**
```jsx
// Ajouter colonne "Modifié"
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
  <div>{ctrl.titre}</div>
  <div>
    {ctrl.dateModification 
      ? new Date(ctrl.dateModification).toLocaleDateString('fr-FR')
      : '—'}
  </div>
  <div>{ctrl.modifiePar || '—'}</div>
</div>
```

**Option B : Info bubble (bulle)**
```jsx
<div style={{ position: 'relative', display: 'inline' }}>
  <span>ℹ️</span>
  <div className="tooltip">
    Modifié par {ctrl.modifiePar} le {formatDate(ctrl.dateModification)}
  </div>
</div>
```

**Option C : Invisible (données seulement)**
```jsx
// data attribute pour recherche/filtrage
<div data-modified={ctrl.dateModification} data-modified-by={ctrl.modifiePar}>
  {/* Aucun affichage visuel */}
</div>
```

**Option D : Badge avec couleur**
```jsx
const isRecent = new Date() - new Date(ctrl.dateModification) < 86400000; // < 24h
<span style={{
  background: isRecent ? '#fef3c7' : '#f3f4f6',
  color: isRecent ? '#92400e' : '#6b7280',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: 11
}}>
  {isRecent ? 'ðŸ”¥' : 'ðŸ•'} {formatDate(ctrl.dateModification)}
</span>
```

---

### 6️⃣ Tri et Filtrage

**Ajouter tri par date de modification** :

```javascript
// Dans le composant Controles
const filtered = controles
  .filter(c => {
    // Filtres existants...
  })
  .sort((a, b) => {
    // Tri par modification (plus récent d'abord)
    const dateA = new Date(a.dateModification || 0);
    const dateB = new Date(b.dateModification || 0);
    return dateB - dateA; // DESC
  });
```

**Bouton pour inverser l'ordre** :
```jsx
const [sortOrder, setSortOrder] = useState('desc');

const sorted = [...filtered].sort((a, b) => {
  const dateA = new Date(a.dateModification || 0);
  const dateB = new Date(b.dateModification || 0);
  return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
});

<button onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
  Tri : {sortOrder === 'desc' ? '↓ Récent' : '↑ Ancien'}
</button>
```

---

### 7️⃣ Filtres Avancés

**Par utilisateur** :
```javascript
const [filterUser, setFilterUser] = useState(null);

const filtered = controles.filter(c => 
  !filterUser || c.modifiePar === filterUser
);

// Obtenir liste unique des utilisateurs
const uniqueUsers = [...new Set(controles
  .map(c => c.modifiePar)
  .filter(Boolean))];

// Afficher dropdown
<select onChange={e => setFilterUser(e.target.value || null)}>
  <option value="">Tous les utilisateurs</option>
  {uniqueUsers.map(user => (
    <option key={user} value={user}>{user}</option>
  ))}
</select>
```

**Par plage de dates** :
```javascript
const [dateFrom, setDateFrom] = useState(null);
const [dateTo, setDateTo] = useState(null);

const filtered = controles.filter(c => {
  if (!c.dateModification) return false;
  const date = new Date(c.dateModification);
  if (dateFrom && date < new Date(dateFrom)) return false;
  if (dateTo && date > new Date(dateTo)) return false;
  return true;
});

// Input date HTML5
<input 
  type="date" 
  value={dateFrom}
  onChange={e => setDateFrom(e.target.value)}
/>
```

**Par contrôles modifiés aujourd'hui** :
```javascript
const isModifiedToday = (ctrl) => {
  if (!ctrl.dateModification) return false;
  const today = new Date();
  const modDate = new Date(ctrl.dateModification);
  return modDate.toDateString() === today.toDateString();
};

const todayModified = controles.filter(isModifiedToday);
```

---

### 8️⃣ Export Audit

**Export CSV** :
```javascript
function exportTraceability() {
  const csv = [
    ['Code', 'Titre', 'Statut', 'Date Modif', 'Modifié par', 'Date Créa', 'Créé par'].join(','),
    ...controles.map(c => [
      c.code,
      c.titre,
      c.statut,
      c.dateModification || '—',
      c.modifiePar || '—',
      c.dateCreation || '—',
      c.creePar || '—'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_controles_${new Date().toISOString()}.csv`;
  a.click();
}

<button onClick={exportTraceability}>ðŸ“¥ Exporter audit</button>
```

**Export JSON** :
```javascript
function exportTraceabilityJSON() {
  const data = controles.map(c => ({
    code: c.code,
    titre: c.titre,
    statut: c.statut,
    dateModification: c.dateModification,
    modifiePar: c.modifiePar,
    dateCreation: c.dateCreation,
    creePar: c.creePar
  }));

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_controles_${new Date().toISOString()}.json`;
  a.click();
}
```

---

### 9️⃣ Historique Complet

**Côté backend, créer table** :
```sql
CREATE TABLE ControleHistorique (
    Id INT PRIMARY KEY IDENTITY,
    ControleId INT NOT NULL,
    DateModification DATETIME2 NOT NULL,
    ModifiePar NVARCHAR(255),
    ChampModifie NVARCHAR(100),
    AncienneValeur NVARCHAR(MAX),
    NouvelleValeur NVARCHAR(MAX),
    FOREIGN KEY (ControleId) REFERENCES Controles(Id)
);
```

**Frontend - Afficher historique** :
```jsx
function HistoriqueModifications({ controleId }) {
  const [historique, setHistorique] = useState([]);

  useEffect(() => {
    axios.get(`/api/controles/${controleId}/historique`)
      .then(r => setHistorique(r.data));
  }, [controleId]);

  return (
    <div>
      <h4>Historique des modifications</h4>
      {historique.map((item, i) => (
        <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontWeight: 700 }}>
            {item.champModifie} - le {new Date(item.dateModification).toLocaleString('fr-FR')}
          </div>
          <div style={{ color: '#dc2626', fontSize: 12 }}>
            ← {item.ancienneValeur}
          </div>
          <div style={{ color: '#059669', fontSize: 12 }}>
            → {item.nouvelleValeur}
          </div>
          <div style={{ color: '#9ca3af', fontSize: 11 }}>
            par {item.modifiePar}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### 🔟 Notifications en Temps Réel

**WebSocket pour notifications** :
```javascript
useEffect(() => {
  const ws = new WebSocket('wss://your-server/ws/controles-updates');
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log(`Contrôle ${update.code} modifié par ${update.modifiePar}`);
    
    // Toast notification
    showNotification(`${update.code} modifié par ${update.modifiePar}`);
    
    // Rafraîchir localement
    updateLocalControle(update);
  };
  
  return () => ws.close();
}, []);
```

---

## 📝 Résumé des Customisations

| Élément | Options |
|---------|---------|
| **Format utilisateur** | email, nom, prénom, ID, personnalisé |
| **Format date** | court, long, relatif, avec secondes, personnalisé |
| **Couleur banneau** | bleu, vert, orange, gris, dégradé |
| **Position banneau** | haut, côté, bas, popup |
| **Affichage liste** | texte, colonne, tooltip, badge, caché |
| **Tri/filtrage** | par date, par utilisateur, par plage |
| **Export** | CSV, JSON, PDF |
| **Historique** | complet avec changements |
| **Notifications** | temps réel WebSocket |

---

## ðŸŽ¯ Cas d'Usage Courants

**"Je veux voir qui a modifié récemment"**
→ Ajouter tri par date décroissante

**"Je veux auditer par utilisateur"**
→ Ajouter filtre par utilisateur

**"Je veux exporter les modifications"**
→ Ajouter export CSV/JSON

**"Je veux historique complet de chaque changement"**
→ Créer table ControleHistorique

**"Je veux notifications temps réel"**
→ Implémenter WebSocket

---

Choisissez les customisations qui vous conviennent ! ðŸŽ¨
