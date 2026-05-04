# ðŸ“‘ Index de Documentation

> Guide de navigation pour les fichiers de composants réstructurés

---

## ðŸ“‚ Fichiers du Projet

### 1. **Controles.jsx** 
   Tableau de bord d'évaluation de conformité ISO 27001
   
   **Taille** : ~900 lignes  
   **Responsabilité** : Affichage, filtrage et évaluation des 93 contrôles  
   **Points clés** :
   - KPIs en temps réel
   - Filtres multi-critères (domaine, statut, recherche)
   - Intégration plan d'action (PlanActionNC)
   
   **À consulter pour** :
   - Comment l'interface fonctionne
   - Comment ajouter un filtre
   - Comment changer les couleurs
   - Comment modifier un KPI

---

### 2. **PlanActionNC.js**
   Gestion du processus d'action sur les non-conformités
   
   **Taille** : ~1400 lignes  
   **Responsabilité** : 6 étapes de correction avec plans pré-configurés  
   **Points clés** :
   - Dictionnaire de 93 plans spécifiques (A.5.1 → A.8.34)
   - Navigation multi-étapes
   - Génération de plans par défaut
   
   **À consulter pour** :
   - Comment ajouter un plan d'action
   - Description des 6 étapes
   - Format des données du plan

---

## 📚 Documentation Créée

### 3. **README_STRUCTURE.md**
   Architecture détaillée des deux composants
   
   **Contenu** :
   - Structure interne complète
   - Flux de données inter-composants
   - Description de chaque étape
   - Interface des données (TypeScript-like)
   - Système de couleurs
   - KPIs expliqués
   
   **Lire pour** :
   - Comprendre l'architecture globale
   - Déboguer un problème complexe
   - Savoir comment les composants se parlent

---

### 4. **GUIDE_PRATIQUE.md** (CE FICHIER RACINE)
   Guide operationnel pour les taches courantes
   
   **Contenu** :
   - Démarrage rapide
   - 8 taches courantes avec code exemple
   - Dépannage des problèmes courants
   - Guide de test
   - Améliorations futures suggérées
   - Structure des données attendues
   
   **Lire pour** :
   - Faire une tache specifique rapidement
   - Déboguer un problème courant
   - Savoir quelles améliorations ajouter

---

### 5. **CONVENTIONS.md**
   Normes de code et patterns utilisés
   
   **Contenu** :
   - Organisation générale du code
   - Styles de commentaires
   - Patterns React (useState, useEffect, etc.)
   - Patterns de style
   - Validation des données
   - Gestion API
   - Debugging
   - Performance
   - Checklist de révision
   
   **Lire pour** :
   - Ajouter du code qui suit les conventions
   - Réviser le code d'un collègue
   - Comprendre les patterns utilisés

---

## ðŸ—ºï¸ Carte de Navigation

```
Pour faire une tache specifique
    ↓
    +-? Tache simple (5-10 min) ?
    │       → Consult GUIDE_PRATIQUE.md
    │
    ├─→ Comprendre l'architecture ?
    │       → Consult README_STRUCTURE.md
    │
    ├─→ Ajouter du code qui suit les conventions ?
    │       → Consult CONVENTIONS.md
    │
    └─→ Déboguer un problème complexe ?
            → Consulter README_STRUCTURE.md + logs console
```

---

## 🎯 Points d'Entrée par Profil

### 👨‍💻 Développeur Nouveau

1. **Lire** : README_STRUCTURE.md (20 min)
2. **Essayer** : GUIDE_PRATIQUE.md ? Tache "Afficher la liste" (5 min)
3. **Lire** : CONVENTIONS.md → Sections "React Patterns" (15 min)

**Temps total** : ~40 min pour être opérationnel

### ðŸ” Mainteneur/Code Reviewer

1. **Consulter** : CONVENTIONS.md → Checklist de Révision
2. **Au besoin** : README_STRUCTURE.md pour architecture
3. **Utiliser** : GUIDE_PRATIQUE.md → Dépannage

### ðŸŽ“ Formateur/Responsable

1. **Comprendre** : README_STRUCTURE.md complet
2. **Connaître** : CONVENTIONS.md pour expliquer les standards
3. **Guider** : Utiliser GUIDE_PRATIQUE.md pour exemples

### ðŸš€ DevOps/Infra

1. **Points importants** : 
   - API utilisée : http://localhost:5006/api/controles
   - Format données : Array de Contrôles
   - Format requête : PUT avec Authorization Bearer

---

## 🔗 Références Croisées

### Controles.jsx ↔ PlanActionNC.js
```
Controles.jsx
    ├─ Affiche carte du contrôle
    ├─ Click → Ouvre EvaluationPanel
    ├─ EvaluationPanel contient PlanActionNC
    │   ├─ Si NC → Affiche 6 étapes
    │   ├─ Charger plan depuis PLANS_ACTION
    │   └─ onChange → Remonter au parent
    └─ handleSaveEvaluation → PUT API
```

### README_STRUCTURE.md ↔ GUIDE_PRATIQUE.md
```
README_STRUCTURE explique le "Pourquoi" et le "Quoi"
GUIDE_PRATIQUE explique le "Comment" et le "Où"

Exemple tache "Ajouter un plan d'action" :
    1. Lire GUIDE_PRATIQUE.md → Savoir quoi faire
    2. Lire détails dans README_STRUCTURE.md → Structure PLANS_ACTION
    3. Consulter CONVENTIONS.md → Respecter les normes
```

---

## ðŸ“Š Quick Stats

| Composant | Lignes | Commentaires | États | Fonctions |
|-----------|--------|------------|--------|-----------|
| Controles.jsx | 900 | 150+ | 6 | 2 |
| PlanActionNC.js | 1400 | 200+ | 2 | 15+ |
| **Docs** | **1800+** | 100% | - | - |

---

## ✅ Check-lister Après Lecture

Après avoir lu une documentation, vous devriez pouvoir :

### Après README_STRUCTURE.md
- [ ] Expliquer le flux de données Controles → PlanActionNC
- [ ] Nommer les 6 étapes du processus
- [ ] Lister les 4 domaines ISO 27001
- [ ] Décrire la structure d'un contrôle

### Après GUIDE_PRATIQUE.md
- [ ] Ajouter un plan d'action manquant
- [ ] Changer les couleurs d'un domaine
- [ ] Déboguer une erreur API
- [ ] Tester une modification

### Après CONVENTIONS.md
- [ ] Identifier du code qui viole les conventions
- [ ] Écrire une fonction avec JSDoc
- [ ] Créer un useState avec des noms explicites
- [ ] Gérer une requête API avec try/catch

---

## 🎨 Thème & Styles

Tous les fichiers utilisent :
- **Couleurs** : Palette définie dans `T = {}` et `DOMAIN_THEMES`
- **Fonts** : Google Fonts "Sora" (400, 600, 700, 800)
- **Spacing** : Système de gaps (16, 20, 24, 30, 32, 36px)
- **Rounding** : 8px (petit), 12px (moyen), 14px (grand), 99px (pill)

**Consulter** : Controles.jsx, lignes 35-65

---

## ðŸ” Secrets et Configuration

Aucun secret en dur dans le code ✓

**Variables d'environnement à configurer** :
- `REACT_APP_API_URL` : URL de l'API (défaut: localhost:5006)
- Token d'authentification : Via `localStorage.getItem('token')`

---

## ðŸ“ž Support Rapide

| Q | A | Doc |
|---|---|-----|
| "Où ajouter un plan d'action ?" | PlanActionNC.js, PLANS_ACTION | GUIDE_PRATIQUE.md |
| "Comment fonctionne le filtrage ?" | Logique dans Controles.jsx | README_STRUCTURE.md |
| "Quelles couleurs utiliser ?" | T et DOMAIN_THEMES | CONVENTIONS.md |
| "Erreur 401 ?" | Token manquant | GUIDE_PRATIQUE.md > Dépannage |
| "Je dois ajouter un filtre ?" | useState + filtre logique | GUIDE_PRATIQUE.md > Ajouter filtre |

---

## 🚀 Prochaines Étapes

1. **Immédiat** : Lire README_STRUCTURE.md
2. **Cette semaine** : Essayer 2-3 taches dans GUIDE_PRATIQUE.md
3. **Ce mois** : Relire CONVENTIONS.md avant de pusher du code
4. **Prochaines versions** : 
   - Migrer vers TypeScript
   - Ajouter tests unitaires
   - Componentiser davantage

---

**Dernière mise à jour** : Avril 2026  
**Version** : 1.0.0  
**Auteur** : Équipe Dev SMSI Manager

