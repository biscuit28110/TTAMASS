# Skill : new-component

Crée un nouveau composant React Native réutilisable pour TTAMASS.

## Arguments attendus
`/new-component <nom>` — ex: `/new-component macro-ring`

## Ce que tu dois faire

1. **Créer** `mobile/components/<categorie>/<NomComponent>.tsx`
2. **Catégories** : `ui/` (boutons, inputs), `charts/` (graphiques), `nutrition/`, `sport/`, `body/`, `ai/`
3. **Toujours** :
   - Props typées en TypeScript (interface explicite)
   - Valeurs par défaut raisonnables
   - Compatible dark mode TTAMASS (`#0A0A0A` / `#141414`)
   - NativeWind pour le style
4. **Pour les graphiques** : utiliser `react-native-svg` ou `victory-native`
5. **Exporter** depuis `mobile/components/index.ts`

## Design system TTAMASS
```
Fonds     : bg-[#0A0A0A]  bg-[#141414]  bg-[#1E1E1E]
Texte     : text-white  text-gray-400  text-gray-600
Accent    : text-[#E53935]  bg-[#E53935]  (rouge énergie)
Secondaire: text-[#7C3AED]  bg-[#7C3AED]  (violet néon)
Succès    : text-[#22C55E]
Bordures  : border-[#2A2A2A]
```
