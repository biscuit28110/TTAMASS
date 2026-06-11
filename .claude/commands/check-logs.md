# Skill : check-logs

Récupère les logs de l'app TTAMASS depuis Coolify (backend) et/ou Expo (mobile) et fait le diagnostic des erreurs.

## Arguments attendus
`/check-logs` — analyse les logs backend (Coolify) + Expo si disponible

Options facultatives :
- `/check-logs errors` — affiche uniquement les erreurs (pas les warnings ni les logs réseau)
- `/check-logs net` — affiche uniquement les requêtes réseau (toutes, pas seulement les erreurs)

## Ce que tu dois faire

### 1. Récupérer les logs backend (Coolify — prioritaire)

Utilise le MCP Coolify pour récupérer les logs de l'app `ttamass` :

1. Appelle `mcp__coolify__application_logs` avec :
   - `uuid` : `lmk45wt769p50qkwzajt8pzz` (app ttamass sur Coolify)
   - `lines` : `200`

Si le MCP est indisponible, signale-le et passe à l'étape 2.

### 2. Récupérer les logs Expo (mobile — si serveur actif)

Cherche le fichier expo.log actif en parallèle :
```bash
find /home/codespace/.claude/jobs/*/tmp/ -name "expo.log" 2>/dev/null | head -1
```

Si trouvé → lis les 200 dernières lignes. Si aucun fichier → indique `Aucun serveur Expo actif.`

### 3. Analyser les logs

**Erreurs critiques** (backend) — lignes contenant `error`, `Error`, `ERROR`, `500`, `exception` :
- Affiche : endpoint/module, message, stack si présent

**Erreurs critiques** (mobile) — lignes contenant `[TTAMASS][*] ERROR:` ou `[TTAMASS][global]` :
- Affiche : screen, message, données associées
- Indique si c'est un crash React (ErrorBoundary) ou une erreur native (global handler)

**Warnings** — lignes contenant `warn`, `WARN`, `401`, `403`, `404` :
- Affiche les requêtes 4xx avec endpoint et temps de réponse

**Requêtes réseau échouées** — lignes contenant `5xx` ou status `→ 5` :
- Affiche endpoint, status code, temps de réponse, et les données d'erreur si présentes

**Requêtes lentes** — requêtes `→ 200` avec temps > 2000ms :
- Signale les endpoints lents pour optimisation

### 4. Format du rapport

```
## Rapport logs TTAMASS — [heure]

### 🖥️ Backend (Coolify — ttamass.tta-dev.fr)

### 🔴 Erreurs (X)
- [vision] analyzeImage — 429 Too Many Requests (Gemini quota dépassé)
  
### 🟡 Warnings (X)  
- GET /api/auth/profile → 401 — token expiré

### 🔴 Requêtes échouées (X)
- POST /api/nutrition/food-entries → 500
  → { error: "Foreign key constraint failed" }

### 🐌 Requêtes lentes (X)
- GET /api/nutrition/foods?q=poulet → 200 (3420ms)

---

### 📱 Mobile (Expo)
✅ Aucun serveur Expo actif. / [rapport mobile si actif]

---

### ✅ Résumé
- État backend : OK / dégradé / erreur critique
- Dernière erreur : il y a X secondes
```

Si aucune erreur → affiche `✅ Aucune erreur détectée dans les logs récents.`

### 5. Proposition d'action
Si des erreurs sont trouvées, propose directement le diagnostic :
- Erreur `429` Gemini → "Quota free tier épuisé. Passe sur un compte payant ou remplace par Claude Haiku pour la vision"
- Erreur 401 répétée → "Token expiré ou non chargé, vérifie SecureStore côté mobile"
- Erreur 500 backend → "Regarde le stack complet dans les logs Coolify ci-dessus"
- ErrorBoundary mobile → "Lis le stack trace ci-dessus pour localiser le composant fautif"
- Requête lente → "Considère un index sur ce champ ou un cache côté backend"

## Règles
- **Coolify en priorité** — c'est la source principale des logs backend
- Toujours lire les 200 dernières lignes minimum (les erreurs récentes sont en bas)
- Ne pas afficher les lignes de bundling Metro (▓░, Bundled, modules) — trop verbeux
- Ne pas afficher les lignes npm warn de démarrage — trop verbeux
- Trier par criticité : erreurs > warnings > requêtes lentes
- L'UUID Coolify de l'app TTAMASS est `lmk45wt769p50qkwzajt8pzz`
