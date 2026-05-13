# Permissions predefinies par role

Source de verite:
- `backend/backend/Domain/Entities/DbInitializer.cs`
- `backend/backend/Application/Security/AppRoles.cs`

Actions:
- `read`, `create`, `edit`, `delete`, `import`, `export`, `approve`, `administer`

## Super Admin
- `holdings`: `read`, `create`, `edit`, `delete`, `administer`
- `societes`: `read`, `create`, `edit`, `delete`, `administer`
- `users`: `read`, `create`, `edit`, `delete`, `administer`
- `statistiques`: `read`, `export`

## Admin Societe
- `dashboard`: `read`
- `cartographie`: `read`
- `pdca`: `read`
- `clauses`: `read`
- `controles`: `read`
- `risques`: `read`
- `documentation`: `read`
- `actifs`: `read`
- `incidents`: `read`
- `sensibilisation`: `read`
- `audit`: `read`
- `chatbot`: `read`
- `tracabilite`: `read`, `export`
- `users`: `read`, `create`, `edit`, `delete`, `administer`
- `roles`: `read`, `edit`, `administer`

## RSSI
- `dashboard`: `read`, `export`
- `cartographie`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `pdca`: `read`, `create`, `edit`, `delete`, `export`
- `clauses`: `read`, `create`, `edit`, `delete`, `export`
- `controles`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `risques`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `documentation`: `read`, `create`, `edit`, `delete`, `import`, `export`, `approve`
- `actifs`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `incidents`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `sensibilisation`: `read`, `create`, `edit`, `delete`, `import`, `export`
- `audit`: `read`, `create`, `edit`, `delete`, `export`
- `chatbot`: `read`

## Consultant
- `dashboard`: `read`
- `cartographie`: `read`
- `pdca`: `read`
- `clauses`: `read`
- `controles`: `read`
- `risques`: `read`
- `documentation`: `read`
- `actifs`: `read`
- `incidents`: `read`
- `sensibilisation`: `read`
- `audit`: `read`
- `chatbot`: `read`

## Auditeur
- `dashboard`: `read`
- `cartographie`: `read`
- `pdca`: `read`
- `clauses`: `read`
- `controles`: `read`
- `risques`: `read`
- `documentation`: `read`
- `actifs`: `read`
- `incidents`: `read`
- `sensibilisation`: `read`
- `audit`: `read`
- `chatbot`: `read`

## Regles globales appliquees par le seed RBAC
- Le role `Super Admin` n'a jamais de permissions sur les modules SMSI.
- Les roles societe (`Admin Societe`, `RSSI`, `Consultant`, `Auditeur`) n'ont jamais de permissions sur les modules plateforme: `holdings`, `societes`, `statistiques`.
