# Skill : check-logs

Diagnostique les erreurs de l'app TTAMASS : backend (Coolify) + frontend (Expo Go).

## Arguments attendus
`/check-logs` — analyse backend + frontend (si Expo actif)

Options facultatives :
- `/check-logs errors` — affiche uniquement les erreurs (pas warnings ni réseau OK)
- `/check-logs net` — affiche uniquement les requêtes réseau

---

## Prérequis : démarrer Expo avec capture de logs

Pour que le skill puisse lire les logs frontend, Expo doit être démarré avec cette commande
(et non `expo start` seul) :

```bash
npx expo start --tunnel 2>&1 | tee ~/.claude/jobs/$(ls -t ~/.claude/jobs/ | grep -v pins | head -1)/tmp/expo.log
```

Si l'app est déjà lancée sans capture → arrête et relance avec la commande ci-dessus.

---

## Ce que tu dois faire

### 1. Logs backend (Coolify — toujours)

Appelle `mcp__coolify__application_logs` :
- `uuid` : `lmk45wt769p50qkwzajt8pzz`
- `lines` : `200`

### 2. Logs frontend (Expo Go — si disponible)

Cherche le fichier expo.log :
```bash
find /home/codespace/.claude/jobs/*/tmp/ -name "expo.log" 2>/dev/null | head -1
```

- **Trouvé** → lis les **300 dernières lignes** et analyse
- **Non trouvé** → affiche la commande de démarrage (voir Prérequis) et passe au backend uniquement

### 3. Analyser les logs frontend

Parse les lignes dans cet ordre de priorité :

**🔴 Crashes fatals** — patterns :
- `[TTAMASS][ErrorBoundary]` → crash React (composant crashé)
- `[TTAMASS][global] ERROR:` avec `isFatal: true` → crash complet de l'app
- `Invariant Violation` → module natif manquant ou bug React Native
- `TypeError` / `ReferenceError` → erreur JS non catchée

**🟠 Erreurs récupérables** — patterns :
- `[TTAMASS][global] ERROR:` avec `isFatal: false` → erreur rattrapée
- `[TTAMASS][global] Unhandled promise` → promesse rejetée sans catch
- `[TTAMASS][net] ERROR:` → requête réseau échouée (4xx/5xx sauf 401)

**🟡 Warnings** — patterns :
- `[TTAMASS][net] WARN:` → requête 401 (token expiré)
- `ERROR  Warning:` → warning React (prop manquante, key dupliquée, etc.)

**🐌 Requêtes lentes** — patterns :
- `[TTAMASS][net] LOG:` avec temps > 2000ms → endpoint lent

### 4. Format du rapport

```
## Rapport logs TTAMASS — [heure]

### 🖥️ Backend (Coolify — ttamass.tta-dev.fr)

🔴 Erreurs (X) :
- [vision] analyzeImage — 429 Too Many Requests (Gemini quota)

🟡 Warnings (X) :
- GET /api/auth/profile → 401

✅ Aucune erreur backend. / [rapport si erreurs]

---

### 📱 Frontend (Expo Go)

🔴 Crashes (X) :
- [ErrorBoundary] Cannot read property 'id' of undefined
  → Stack: NutritionScreen > FoodCard (app/(tabs)/nutrition.tsx:42)

🟠 Erreurs récupérables (X) :
- [global] Unhandled promise: Network request failed
- [net] POST /api/nutrition/food-entries → 500 (1204ms)
  → { error: "Foreign key constraint failed" }

🟡 Warnings (X) :
- [net] GET /api/auth/profile → 401 (234ms)
- React Warning: Each child in a list should have a unique "key" prop

🐌 Requêtes lentes (X) :
- [net] GET /api/nutrition/foods?q=poulet → 200 (3420ms)

✅ Résumé : X erreurs · X warnings · dernière activité il y a Xs
```

Si aucun log frontend → affiche la commande de démarrage Expo.

### 5. Diagnostics automatiques

Si des erreurs sont trouvées, propose le bon diagnostic :

| Erreur | Diagnostic |
|--------|-----------|
| `Invariant Violation: Requiring unknown module` | Module natif incompatible avec Expo Go → utiliser expo-dev-client ou retirer le module |
| `[ErrorBoundary]` répété sur un écran | Lire le stack ci-dessus pour localiser le composant exact |
| `[global] isFatal: true` | L'app a crashé — corriger et relancer Expo Go |
| `[global] Unhandled promise` réseau | Vérifier `EXPO_PUBLIC_API_URL` dans `mobile/.env` |
| 401 répétés | Token Supabase expiré — vérifier SecureStore ou la session |
| 500 backend | Lire les logs Coolify ci-dessus pour le détail serveur |
| Requête > 2000ms | Ajouter un index sur le champ filtré ou un cache côté backend |

---

## Règles
- **Coolify en priorité** — toujours récupérer le backend même sans Expo actif
- Lire les 300 dernières lignes d'expo.log (les erreurs récentes sont en bas)
- Ne pas afficher les lignes Metro/bundler (`▓░`, `Bundled`, `modules`, `npm warn`) — trop verbeux
- Ne pas afficher les requêtes réseau réussies < 2000ms sauf si option `net`
- Trier par criticité : crashes > erreurs > warnings > lenteur
- L'UUID Coolify de l'app TTAMASS est `lmk45wt769p50qkwzajt8pzz`
