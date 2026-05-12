# 🖼️ Vue d'ensemble UI - Avant/Après

## AVANT (État actuel)

```
┌──────────────────────────────────────────────────┐
│ PANNEAU DÉTAIL - Processus                       │
├──────────────────────────────────────────────────┤
│                                                   │
│  Management  ⚙️  Processus Qualité        [x]    │
│  Responsable Qualité                             │
│                                                   │
│  Description du processus...                     │
│                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│  📄 Documents associés (3)                       │
│                                                   │
│  [📋] Procédure 001    v1.2     [v]  [x]        │
│       proc-001 · procédure                      │
│                                                   │
│  [📋] Instruction 002  v1.0     [v]  [x]        │
│       inst-002 · instruction                    │
│                                                   │
│  [📋] Formulaire 003   v2.1     [v]  [x]        │
│       form-003 · formulaire                     │
│                                                   │
│  [➕] Ajouter un document                        │
│                                                   │
└──────────────────────────────────────────────────┘
```

## APRÈS (Avec modifications)

```
┌──────────────────────────────────────────────────┐
│ PANNEAU DÉTAIL - Processus                       │
├──────────────────────────────────────────────────┤
│                                                   │
│  Management  ⚙️  Processus Qualité        [x]    │
│  Responsable Qualité                             │
│                                                   │
│  Description du processus...                     │
│                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│  📋 Clauses ISO 27001                    (2)    │
│                                                   │
│  [5.1] Policies for information security         │
│        ISO 27001 · Clause        [x]            │
│                                                   │
│  [A.7]  Access control                           │
│        ISO 27001 · Clause        [x]            │
│                                                   │
│  [➕] Ajouter une clause                         │
│  ┌─────────────────────────────────────────┐    │
│  │ Sélectionner une clause                 │    │
│  │ [1 - Organization of security]    [+]  │    │
│  │ [5 - Organization of IS]          [+]  │    │
│  │ [5.1 - Policies for IS]           [+]  │    │
│  │ [A.5 - Access control policies]   [+]  │    │
│  │ [A.6 - Cryptography]              [+]  │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│  🛡️  Contrôles associés                   (3)   │
│                                                   │
│  [A.5.1.1]                                       │
│  Politique de sécurité informatique              │
│  Politiques · Conforme                   [x]    │
│                                                   │
│  [A.5.1.2]                                       │
│  Politique d'accès aux informations              │
│  Politiques · Conforme                   [x]    │
│                                                   │
│  [A.7.1.1]                                       │
│  Contrôle d'accès physique                       │
│  Sécurité physique · NC Mineure        [x]     │
│                                                   │
│  [➕] Ajouter un contrôle                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Sélectionner un contrôle                │    │
│  │ [A.5.1.1 - Politique de...]       [+]  │    │
│  │ [A.5.1.2 - Politique d'accès...]  [+]  │    │
│  │ [A.5.2.1 - Documentation...]      [+]  │    │
│  │ [A.7.1.1 - Contrôle d'accès...]   [+]  │    │
│  └─────────────────────────────────────────┘    │
│                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│  📄 Documents associés (3)                       │
│                                                   │
│  [📋] Procédure 001    v1.2     [v]  [x]        │
│       proc-001 · procédure                      │
│                                                   │
│  [📋] Instruction 002  v1.0     [v]  [x]        │
│       inst-002 · instruction                    │
│                                                   │
│  [📋] Formulaire 003   v2.1     [v]  [x]        │
│       form-003 · formulaire                     │
│                                                   │
│  [➕] Ajouter un document                        │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Détails des changements

### 1. Nouvelle section : Clauses ISO 27001
```
📋 Clauses ISO 27001                    (2)
├─ Affiche le nombre de clauses associées
├─ Liste scrollable des clauses
├─ Chaque ligne affiche :
│  ├─ Numéro et titre de la clause
│  └─ Bouton de suppression (❌)
├─ Bouton "Ajouter une clause" (➕)
└─ Panneau de sélection intégré (au clic)
```

### 2. Nouvelle section : Contrôles associés
```
🛡️  Contrôles associés                   (3)
├─ Affiche le nombre de contrôles associés
├─ Liste scrollable des contrôles
├─ Chaque ligne affiche :
│  ├─ Code du contrôle
│  ├─ Titre du contrôle
│  ├─ Domaine · Statut
│  └─ Bouton de suppression (❌)
├─ Bouton "Ajouter un contrôle" (➕)
└─ Panneau de sélection intégré (au clic)
```

### 3. Panneaux de sélection intégrés
```
Au clic sur "Ajouter une clause" ou "Ajouter un contrôle" :

┌─────────────────────────────┐
│ Sélectionner une [type]     │  ← Titre
├─────────────────────────────┤
│ [Nom] [numéro]      [+]     │  ← Chaque item clickable
│ [Nom] [numéro]      [+]     │
│ [Nom] [numéro]      [+]     │
│ [Nom] [numéro]      [+]     │
│ [Nom] [numéro]      [+]     │
└─────────────────────────────┘

Comportement :
- Scrollable si >5 items
- Un clic = association immédiate
- Panel se ferme après sélection
- Peut réouvrir en cliquant sur le bouton
```

## Couleurs et icônes

### Icônes utilisées
- 📋 = Clause (file-contract)
- 🛡️  = Contrôle (shield)
- ❌ = Supprimer (times)
- ➕ = Ajouter (circle-plus)

### Couleurs d'affichage
- **Titre** : #0d2b3e (bleu très foncé)
- **Code/Métadonnées** : #4a7a95 (bleu gris)
- **Bordures** : #aed6f1 (bleu clair)
- **Fond** : #eaf4fb (bleu très clair)
- **Texte métadonnées** : #8fb8cc (bleu pâle)

## Responsivité

### Sur desktop (>1024px)
- Panneau détail : largeur 410px
- Listes : scrollable avec scrollbar personnalisée
- Texte : taille normale

### Sur tablet (768px - 1024px)
- Panneau détail : adapt à 90vw
- Listes : scrollable, texte réduit

### Sur mobile (<768px)
- Panneau détail : fullscreen
- Listes : scrollable, texte petit
- Panneaux de sélection : compact

## Animations

### Transitions appliquées
```css
- Panneau détail : slide right (0.38s)
- Items au hover : transition .15s
- Boutons : hover transform translateY(-1px)
- Selection panel : fade in .12s
```

## États des éléments

### Bouton "Ajouter"
```
État normal  : Bordure pointillée, fond transparent
État hover   : Bordure pleine, fond couleur
État actif   : Selection panel visible
État disabled: Opacité 0.5 (lors du saving)
```

### Items de liste
```
État normal  : Fond #f0f7fb, bordure #d6eaf8
État hover   : Fond #e8f4fa, bordure #aed6f1
État supprimé: Animation fade out puis disparition
```

### Bouton suppression (❌)
```
État normal  : Couleur #8fb8cc, invisible jusqu'au hover de l'item
État hover   : Couleur #e74c3c, fond #fde8e8
État au clic : Envoi requête API, pendant ce temps locked
```

## Accessibilité

### Attributs ARIA
- `title` sur tous les boutons (tooltip)
- Bonnes pratiques de contraste

### Navigation au clavier
- Tab pour parcourir les éléments
- Enter/Space pour activer les boutons
- Échap pour fermer les panneaux

## Performance

### Optimisations appliquées
1. **Chargement au montage** : Référentiels chargés une seule fois
2. **Virtualisation** : Possible d'ajouter si >500 items
3. **Debounce** : Peut être ajouté sur la recherche future
4. **Memoization** : Composants optimisés pour rerenders

---

**Changement clé** : Le panneau détail passe de 2 sections (description + documents) à 4 sections (description + clauses + contrôles + documents), tout en gardant la cohérence visuelle et l'UX.
