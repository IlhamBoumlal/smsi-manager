# Artillery Load Test

## Variables requises

- `LOAD_ADMIN_EMAIL`
- `LOAD_ADMIN_PASSWORD`

## Lancer le test

Depuis `frontend`:

```powershell
$env:LOAD_ADMIN_EMAIL="votre_admin_societe@email"
$env:LOAD_ADMIN_PASSWORD="votre_mot_de_passe"
npm.cmd run test:load
```
