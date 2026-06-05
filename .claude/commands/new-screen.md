# Skill : new-screen

Crée un nouvel écran React Native / Expo pour TTAMASS.

## Arguments attendus
`/new-screen <nom-ecran>` — ex: `/new-screen nutrition-log`

## Ce que tu dois faire

1. **Créer le fichier** `mobile/app/<section>/<nom>.tsx`
2. **Créer le hook** `mobile/hooks/use-<nom>.ts` pour la logique et les appels API
3. **Appliquer le design system TTAMASS** :
   - Dark mode : fond `#0A0A0A`, surface `#141414`, surface2 `#1E1E1E`
   - Accent rouge : `#E53935` / violet néon : `#7C3AED`
   - Typo : chiffres larges et lisibles, sans-serif moderne
   - NativeWind (classes Tailwind)
4. **Toujours inclure** :
   - Loading state avec skeleton ou spinner
   - Error state avec message utilisateur
   - Feedback haptique sur les actions principales (`expo-haptics`)
   - Safe area (`useSafeAreaInsets`)
5. **Connecter à l'API backend** via `lib/api/<ressource>.ts`

## Structure type d'un écran

```typescript
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NomScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* contenu */}
    </View>
  );
}
```

## Règles
- Maximum 150 lignes par fichier écran — extraire en composants si plus long
- Pas d'appel API direct dans le composant — toujours passer par un hook
- Respecter la navigation Expo Router (file-based)
- 3 taps maximum pour toute action principale (règle UX du CDC)
