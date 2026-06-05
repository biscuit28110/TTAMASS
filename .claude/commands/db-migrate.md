# Skill : db-migrate

Modifie le schéma Prisma et prépare la migration pour TTAMASS.

## Arguments attendus
`/db-migrate <description>` — ex: `/db-migrate add-notifications-table`

## Questions à poser AVANT de modifier le schéma

Si l'un de ces points n'est pas clair, **pose les questions** :

1. **Le champ/table est-il obligatoire ou optionnel ?** (impact sur les données existantes)
2. **Des valeurs par défaut ?** Pour les champs ajoutés sur une table déjà peuplée
3. **Relations avec d'autres tables ?** (clé étrangère, cascade delete ?)
4. **Ce champ sera filtré/trié souvent ?** (décision d'ajouter un index)
5. **C'est une modification temporaire ou permanente ?** (choisir push vs migrate)

Ne suppose pas — une migration destructive est irréversible en production.

## Ce que tu dois faire

1. **Analyser** l'impact de la modification demandée sur le schéma existant
2. **Modifier** `backend/prisma/schema.prisma`
3. **Vérifier la cohérence** :
   - Relations bidirectionnelles correctes
   - Index sur les champs fréquemment filtrés (userId, date, etc.)
   - Champs nullable vs required (impact sur les données existantes)
   - Enums correctement définis
4. **Mettre à jour** le seed `backend/prisma/seed.ts` si nécessaire
5. **Afficher la commande à lancer** manuellement :
   ```bash
   cd backend && npx prisma db push
   # ou pour une migration versionnée :
   npx prisma migrate dev --name <description>
   ```
6. **Documenter** le changement dans un commentaire dans le schéma

## Règles
- Ne jamais supprimer un champ sans vérifier qu'il n'est pas utilisé dans le code
- Toujours utiliser `@default` pour les nouveaux champs sur des tables existantes
- Préférer `prisma db push` en développement, `prisma migrate dev` pour les migrations versionnées
- Signaler si la modification est destructive (DROP COLUMN, type change)
