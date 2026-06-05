# Skill : security-check

Vérifie la sécurité du code TTAMASS avant commit ou deploy.

## Arguments attendus
`/security-check` ou `/security-check <fichier>` — sans argument = vérification globale

## Ce que tu dois vérifier

### Routes API
- [ ] Toutes les routes vérifient le JWT Supabase avant toute opération
- [ ] Un user ne peut accéder qu'à ses propres données (vérification `userId === user.id`)
- [ ] Les inputs sont validés avec Zod (pas de données brutes en base)
- [ ] Pas d'exposition de la `SERVICE_ROLE_KEY` côté client
- [ ] Pas de `console.log` avec des données sensibles

### Base de données
- [ ] Pas de requêtes construites avec des strings dynamiques (risque injection)
- [ ] Les suppressions utilisent `onDelete: Cascade` correctement
- [ ] Pas de données d'un user A accessibles par user B

### Variables d'environnement
- [ ] `.env` dans `.gitignore`
- [ ] Les clés `SUPABASE_SERVICE_ROLE_KEY` ne sont jamais dans du code client
- [ ] `NEXT_PUBLIC_*` ne contient rien de secret

### Données sensibles
- [ ] Les photos de progression sont derrière des URLs signées (pas publiques)
- [ ] Les conversations IA ne fuient pas entre utilisateurs
- [ ] Le password hash n'est jamais retourné dans les réponses API

## Format de sortie
Liste des problèmes trouvés avec niveau de criticité : 🔴 Critique / 🟡 Warning / 🟢 Info
