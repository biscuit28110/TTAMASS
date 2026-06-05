# Skill : new-route

Crée une nouvelle route API Next.js pour TTAMASS.

## Arguments attendus
`/new-route <nom-ressource>` — ex: `/new-route food-entries`

## Questions à poser AVANT de coder

Si l'un de ces points n'est pas clair dans le prompt, **pose les questions** avant de générer du code :

1. **Quelles méthodes HTTP ?** (GET seul, GET+POST, CRUD complet ?)
2. **Quels champs attendus** dans le body / les query params ?
3. **Des règles métier spécifiques ?** (ex: limite journalière, vérification de quota Free/Premium, calculs automatiques)
4. **La ressource est-elle liée à une autre ?** (ex: une FoodEntry dépend d'un Food existant)
5. **Pagination nécessaire ?** (pour les listes longues : historique, recherche)

Ne suppose pas — mieux vaut une question de plus qu'une route à refaire.

## Ce que tu dois faire

1. **Identifier le module** à partir du nom : nutrition / body / sport / auth / ai
2. **Créer le fichier** `backend/app/api/<module>/<nom>/route.ts`
3. **Implémenter** les méthodes HTTP nécessaires (GET, POST, PUT, DELETE)
4. **Toujours inclure** :
   - Vérification auth Supabase (JWT depuis le header Authorization)
   - Récupération du UserProfile via `prisma.userProfile.findUnique({ where: { userId } })`
   - Validation des inputs (zod)
   - Réponses typées `NextResponse.json()`
   - Gestion d'erreur avec codes HTTP appropriés (400, 401, 403, 404, 500)
5. **Créer le fichier de types** `backend/types/<nom-ressource>.ts` si inexistant
6. **Mettre à jour** `backend/types/index.ts` avec les nouveaux exports

## Structure d'une route type

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

async function getUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... logique métier
}
```

## Règles
- Pas de logique métier dans la route — extraire dans `lib/services/<nom>.ts` si > 20 lignes
- Toujours valider avec Zod avant d'écrire en base
- Utiliser `prisma.$transaction` pour les opérations multiples
