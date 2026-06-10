# Skill : check-logs

Lit les logs Expo en temps réel et fait le diagnostic des erreurs de l'app TTAMASS.

## Arguments attendus
`/check-logs` — pas d'argument, analyse les logs du serveur Expo actif

Options facultatives :
- `/check-logs errors` — affiche uniquement les erreurs (pas les warnings ni les logs réseau)
- `/check-logs net` — affiche uniquement les requêtes réseau (toutes, pas seulement les erreurs)

## Ce que tu dois faire

### 1. Trouver le fichier de logs
Cherche le fichier expo.log actif :
```bash
find /home/codespace/.claude/jobs/*/tmp/ -name "expo.log" 2>/dev/null | head -1
```

Si aucun fichier trouvé → affiche :
```
Aucun serveur Expo actif détecté.
Lance l'app avec : npx expo start --tunnel
```

### 2. Analyser les logs

Lis les **200 dernières lignes** du fichier et catégorise :

**Erreurs critiques** — lignes contenant `[TTAMASS][*] ERROR:` ou `[TTAMASS][global]` :
- Affiche : screen, message, données associées
- Indique si c'est un crash React (ErrorBoundary) ou une erreur native (global handler)

**Warnings** — lignes contenant `[TTAMASS][*] WARN:` :
- Affiche les requêtes 4xx (401, 403, 404)
- Indique l'endpoint concerné et le temps de réponse

**Requêtes réseau échouées** — lignes contenant `→ 5` (5xx) :
- Affiche endpoint, status code, temps de réponse, et les données d'erreur si présentes

**Requêtes lentes** — requêtes `→ 200` avec temps > 2000ms :
- Signale les endpoints lents pour optimisation

### 3. Format du rapport

```
## Rapport logs TTAMASS — [heure]

### 🔴 Erreurs (X)
- [ErrorBoundary] Cannot read property 'id' of undefined
  → Stack: app/(tabs)/nutrition.tsx:42
  
### 🟡 Warnings (X)  
- [net] GET /api/auth/profile → 401 (234ms) — token expiré
  
### 🔴 Requêtes échouées (X)
- [net] POST /api/nutrition/food-entries → 500 (1204ms)
  → { error: "Foreign key constraint failed" }

### 🐌 Requêtes lentes (X)
- GET /api/nutrition/foods?q=poulet → 200 (3420ms)

### ✅ Résumé
- X requêtes réussies en moyenne Xms
- Dernière activité : il y a X secondes
```

Si aucune erreur → affiche `✅ Aucune erreur détectée dans les logs récents.`

### 4. Proposition d'action
Si des erreurs sont trouvées, propose directement le diagnostic :
- Erreur 401 répétée → "Token expiré ou non chargé, vérifie SecureStore"
- Erreur 500 backend → "Regarde les logs Coolify pour le détail serveur"
- ErrorBoundary → "Lis le stack trace ci-dessus pour localiser le composant fautif"
- Requête lente → "Considère un index sur ce champ ou un cache côté backend"

## Règles
- Toujours lire les 200 dernières lignes minimum (les erreurs récentes sont en bas)
- Ne pas afficher les lignes de bundling Metro (▓░, Bundled, modules) — trop verbeux
- Trier par criticité : erreurs > warnings > requêtes lentes
- Si l'app n'est pas connectée (aucun log `[TTAMASS]`), le signaler explicitement
