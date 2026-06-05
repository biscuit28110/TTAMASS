# TTAMASS — Instructions Claude

Application mobile iOS de coaching nutrition et fitness avec IA.
Stack : React Native / Expo / TypeScript · Next.js · Prisma · PostgreSQL · Supabase

## Structure du repo

```
TTAMASS/
├── backend/          # Next.js API + Prisma
│   ├── app/api/      # Routes API
│   ├── lib/          # prisma.ts, supabase.ts
│   ├── prisma/       # schema.prisma, seed.ts
│   └── types/        # Types TypeScript partagés
└── mobile/           # Expo React Native (à créer)
    ├── app/          # Écrans (Expo Router)
    ├── components/   # Composants réutilisables
    ├── hooks/        # Hooks personnalisés
    └── lib/          # Clients API
```

## Skills disponibles

| Skill | Commande |
|-------|----------|
| Nouvelle route API | `/new-route` |
| Nouvel écran mobile | `/new-screen` |
| Modification base de données | `/db-migrate` |
| Audit sécurité | `/security-check` |
| Données de test | `/seed-dev` |
| Nouveau composant UI | `/new-component` |

## Détection automatique des skills

**RÈGLE CRITIQUE** : Si l'utilisateur formule un besoin sans appeler explicitement un skill,
détecte l'intention et invoque le skill approprié AVANT de générer du code.

### Mots-clés → Skills

**→ `/new-route`** si le message contient :
- "créer une route", "nouvelle route", "endpoint", "API pour", "route pour"
- "GET /", "POST /", "PUT /", "DELETE /"
- "ajouter une API", "route qui retourne", "route qui enregistre"
- Exemples : "je veux une route pour les food entries", "crée l'endpoint de login"

**→ `/new-screen`** si le message contient :
- "créer un écran", "nouvel écran", "page pour", "vue pour", "screen"
- "interface pour", "afficher les", "écran de", "page de"
- Exemples : "crée l'écran de nutrition", "je veux la page du dashboard"

**→ `/db-migrate`** si le message contient :
- "modifier le schéma", "ajouter une table", "ajouter un champ", "nouvelle colonne"
- "modifier la base", "changer le modèle", "ajouter un modèle"
- Exemples : "ajoute une table notifications", "ajoute le champ lastLoginAt au user"

**→ `/security-check`** si le message contient :
- "vérifier la sécurité", "audit", "est-ce sécurisé", "faille", "vulnérabilité"
- "review sécurité", "checker les routes", "vérifier les accès"

**→ `/seed-dev`** si le message contient :
- "données de test", "seed", "données fictives", "données de dev", "données d'exemple"
- "peupler la base", "données pour tester"

**→ `/new-component`** si le message contient :
- "créer un composant", "nouveau composant", "composant pour", "widget"
- Exemples : "crée un composant pour afficher les macros", "je veux un ring de calories"

## Règles de développement

### Sécurité (non négociable)
- Toute route API vérifie le JWT Supabase en premier
- Un user n'accède qu'à ses propres données (vérification `userId`)
- Inputs toujours validés avec Zod
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur

### Code
- TypeScript strict — pas de `any`
- Pas de commentaires sauf pour les WHY non évidents
- Extraire en service (`lib/services/`) si la logique dépasse 20 lignes dans une route
- Prisma via le singleton `lib/prisma.ts`

### Mobile (design system)
- Dark mode uniquement
- Fonds : `#0A0A0A` (base) · `#141414` (surface) · `#1E1E1E` (surface2)
- Accent rouge : `#E53935` · Violet néon : `#7C3AED`
- NativeWind pour tous les styles
- Feedback haptique sur les actions principales
- 3 taps maximum pour toute action clé (règle UX CDC)

### Base de données
- Migrations via `npx prisma db push` (dev) ou `npx prisma migrate dev` (versionné)
- Seed exercices : `npm run db:seed`
- Index sur tous les champs `userId` + `date`

## Contexte métier

- **Objectif** : recomposition corporelle (perdre gras + gagner muscle)
- **Modules MVP** : Nutrition · Corps · Sport · Auth
- **Modules V2** : IA Vision (photo assiette) · Coach IA conversationnel
- **Modèle** : Freemium (Free / Premium 7,99€/mois)
- **Auth** : Supabase Auth (email/password MVP → Google V2 → Apple V3)
- **Aliments** : Open Food Facts (cache PostgreSQL) + custom + IA détectés
- **Exercices** : liste prédéfinie (75 exercices) + custom utilisateur
