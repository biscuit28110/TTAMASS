# Skill : e2e-test

Génère un scénario de test E2E Maestro pour un écran TTAMASS.

## Arguments attendus
`/e2e-test <ecran>` — ex: `/e2e-test login` ou `/e2e-test nutrition/search`

Écrans disponibles : `login`, `register`, `onboarding`, `home`, `nutrition`, `nutrition/search`, `sport`, `sport/session`, `body`, `ai`, `profile`

## Questions à poser si l'écran n'est pas précisé

1. **Quel écran tester ?** (voir liste ci-dessus)
2. **Tester le chemin nominal uniquement** ou aussi les cas d'erreur ? (ex: mauvais mot de passe, réseau coupé)
3. **L'utilisateur est-il déjà connecté ?** ou le test doit-il partir de l'écran de login ?

## Ce que tu dois faire

### 1. Vérifier Maestro
Exécute `which maestro` pour vérifier l'installation. Si absent, affiche :
```
Maestro n'est pas installé. Pour l'installer :
  curl -Ls "https://get.maestro.mobile.dev" | bash
Puis relance le terminal.
```

### 2. Créer le dossier `.maestro/` à la racine du repo si inexistant

### 3. Générer `.maestro/<ecran>.yaml`

**Structure obligatoire de chaque fichier :**
```yaml
appId: fr.ttamass.app
---
# Étapes du scénario
```

**Règles de génération :**
- `takeScreenshot: "XX-nom-etape"` au début, à chaque étape clé, et à la fin
- Toujours inclure `- assertNotVisible: "Une erreur est survenue"` après chaque action majeure (détecte l'ErrorBoundary)
- Utiliser `- assertVisible:` pour vérifier les éléments attendus
- Utiliser `- tapOn:` avec le texte visible ou l'id du composant
- Utiliser `- inputText:` pour les champs de saisie
- Ajouter `- waitForAnimationToEnd` après les navigations

**Scénarios par écran :**

#### `login`
```yaml
appId: fr.ttamass.app
---
- launchApp
- takeScreenshot: "01-login-screen"
- assertVisible: "Se connecter"
- tapOn: "Email"
- inputText: "test@ttamass.fr"
- tapOn: "Mot de passe"
- inputText: "testpassword123"
- tapOn: "Se connecter"
- waitForAnimationToEnd
- takeScreenshot: "02-after-login"
- assertNotVisible: "Une erreur est survenue"
- assertVisible: "Aujourd'hui"
```

#### `nutrition/search`
```yaml
appId: fr.ttamass.app
---
- launchApp
- tapOn: "Nutrition"
- tapOn:
    text: "+"
- takeScreenshot: "01-search-screen"
- tapOn: "Rechercher un aliment"
- inputText: "poulet"
- waitForAnimationToEnd
- takeScreenshot: "02-results"
- assertNotVisible: "Une erreur est survenue"
- assertVisible: "poulet"
- tapOn:
    index: 0
    text: "poulet"
- inputText: "150"
- tapOn: "Ajouter"
- takeScreenshot: "03-added"
- assertNotVisible: "Une erreur est survenue"
```

#### `sport/session`
```yaml
appId: fr.ttamass.app
---
- launchApp
- tapOn: "Sport"
- tapOn: "Nouvelle séance"
- takeScreenshot: "01-session-start"
- assertNotVisible: "Une erreur est survenue"
- tapOn: "Ajouter un exercice"
- takeScreenshot: "02-exercise-picker"
- tapOn:
    index: 0
- tapOn: "Terminer la séance"
- takeScreenshot: "03-session-done"
- assertNotVisible: "Une erreur est survenue"
```

#### `body`
```yaml
appId: fr.ttamass.app
---
- launchApp
- tapOn: "Corps"
- takeScreenshot: "01-body-screen"
- assertNotVisible: "Une erreur est survenue"
- tapOn: "Ajouter"
- inputText: "75.5"
- tapOn: "Enregistrer"
- takeScreenshot: "02-after-save"
- assertNotVisible: "Une erreur est survenue"
```

#### `home`
```yaml
appId: fr.ttamass.app
---
- launchApp
- takeScreenshot: "01-home"
- assertNotVisible: "Une erreur est survenue"
- assertVisible: "Aujourd'hui"
- tapOn: "Nutrition"
- waitForAnimationToEnd
- takeScreenshot: "02-nutrition-tab"
- assertNotVisible: "Une erreur est survenue"
- tapOn: "Sport"
- waitForAnimationToEnd
- takeScreenshot: "03-sport-tab"
- tapOn: "Corps"
- waitForAnimationToEnd
- takeScreenshot: "04-body-tab"
```

Pour les autres écrans, **adapte le scénario** en lisant le fichier `mobile/app/<ecran>.tsx` correspondant pour identifier les éléments interactifs réels (textes des boutons, placeholders des inputs).

### 4. Afficher la commande pour lancer le test
```
Pour lancer ce test :
  maestro test .maestro/<ecran>.yaml

Pour lancer tous les tests :
  maestro test .maestro/
```

## Règles
- Toujours lire l'écran source avant de générer pour utiliser les vrais labels/textes
- `assertNotVisible: "Une erreur est survenue"` est obligatoire après chaque action majeure
- Les screenshots doivent avoir des noms séquentiels (`01-`, `02-`, ...)
- Ne pas mettre de credentials réels dans les tests — utiliser `test@ttamass.fr` / `testpassword123`
