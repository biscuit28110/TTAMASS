# Skill : check-logs

Récupère et analyse les logs du backend TTAMASS depuis Coolify.

## Arguments attendus
`/check-logs` — analyse les 200 dernières lignes de logs backend

## Ce que tu dois faire

### 1. Récupérer les logs

Appelle `mcp__coolify__application_logs` :
- `uuid` : `lmk45wt769p50qkwzajt8pzz`
- `lines` : `200`

### 2. Analyser et catégoriser

**🔴 Erreurs** — lignes contenant `error`, `Error`, `ERROR`, `exception`, `500` :
- Affiche : module/endpoint, message, stack si présent

**🟡 Warnings** — lignes contenant `warn`, `WARN`, `401`, `403`, `404` :
- Affiche : endpoint + code HTTP

**🔴 Requêtes échouées** — status 5xx :
- Affiche : endpoint, status, message d'erreur

**🐌 Requêtes lentes** — temps de réponse > 2000ms :
- Affiche : endpoint + durée

### 3. Format du rapport

```
## Rapport logs TTAMASS — [heure]

### 🔴 Erreurs (X)
- [vision] analyzeImage — 429 Too Many Requests (Gemini quota dépassé)

### 🟡 Warnings (X)
- GET /api/auth/profile → 401

### 🔴 Requêtes échouées (X)
- POST /api/nutrition/food-entries → 500
  → { error: "Foreign key constraint failed" }

### 🐌 Requêtes lentes (X)
- GET /api/nutrition/foods?q=poulet → 200 (3420ms)

### ✅ Résumé
- État : OK / dégradé / erreur critique
```

Si aucune erreur → `✅ Aucune erreur détectée dans les logs récents.`

### 4. Diagnostics automatiques

| Erreur | Diagnostic |
|--------|-----------|
| `429` Gemini | Quota free tier épuisé — passer sur compte payant ou remplacer par Claude Haiku |
| `401` répétés | Token Supabase expiré côté client |
| `500` backend | Lire le stack complet ci-dessus |
| Requête > 2s | Ajouter un index ou un cache sur cet endpoint |

## Règles
- Ne pas afficher les lignes de démarrage npm/Next.js (`npm warn`, `▲ Next.js`, `✓ Ready`) — trop verbeux
- Trier par criticité : erreurs > warnings > lenteur
