# Skill : seed-dev

Génère des données de test réalistes pour le développement TTAMASS.

## Arguments attendus
`/seed-dev` — génère un jeu complet de données de dev

## Questions à poser AVANT de générer

Si l'un de ces points n'est pas précisé, **pose les questions** :

1. **Quel profil utilisateur type ?** (homme/femme, poids, objectif, niveau activité)
2. **Sur combien de jours de données ?** (7 jours, 14 jours, 1 mois ?)
3. **Un module spécifique à seeder** ou tout à la fois ? (nutrition seule, sport seul, tout)
4. **Pour tester un cas particulier ?** (ex: user en dépassement calorique, plateau de poids, PR sur un exercice)

Des données ciblées permettent de tester des cas précis plutôt que du bruit générique.

## Ce que tu dois faire

1. **Créer** `backend/prisma/seed-dev.ts` avec des données réalistes :
   - 1 UserProfile complet (homme, 25 ans, 80kg, 180cm, objectif recompo)
   - 14 jours de FoodEntries (petit-déj, déj, dîner, collation)
   - 14 jours de BodyMetrics (poids légèrement variable)
   - 4 WorkoutSessions avec sets réalistes (Push/Pull/Legs/Push)
   - 1 AiConversation avec 6 messages
   - 5 BodyPhotos (types variés)

2. **Les données doivent être cohérentes** :
   - Calories autour du TDEE calculé (2400 kcal pour ce profil)
   - Macros réalistes : ~180g protéines, ~220g glucides, ~80g lipides
   - Charges progressives sur 2 semaines (progression réaliste)
   - Poids qui varie de ±0.5kg autour de 80kg

3. **Ajouter le script** dans package.json si absent :
   ```json
   "db:seed-dev": "npx tsx prisma/seed-dev.ts"
   ```

## Règles
- Utiliser un userId fictif fixe pour les tests : `"test-user-00000000-0000-0000-0000-000000000001"`
- Toujours utiliser `upsert` pour que le script soit idempotent (relançable sans dupliquer)
- Ne jamais commiter ce fichier avec de vraies clés ou de vrais userIds
