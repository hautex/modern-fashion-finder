# Modern Fashion Finder

Application Next.js permettant de trouver des vêtements similaires à partir d'une photo.

## Fonctionnalités

- Téléchargement d'images de vêtements
- Analyse des caractéristiques (couleur, motif, style, etc.)
- Affichage de produits similaires
- Interface moderne et responsive

## Tech Stack

- **Frontend**: Next.js 14 avec App Router, React, TypeScript, Tailwind CSS
- **Backend**: Routes API Next.js
- **Fonctionnalités**: Téléchargement d'images, analyse d'image simulée

## Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/hautex/modern-fashion-finder.git
cd modern-fashion-finder

# Installer les dépendances
npm install

# Lancer l'application en développement
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
/modern-fashion-finder
  ├── app/                 # Application Next.js (App Router)
  │   ├── api/            # Routes API
  │   │   └── analyze/    # Endpoint d'analyse d'image
  │   ├── page.tsx        # Page d'accueil
  │   └── layout.tsx      # Layout principal
  ├── lib/                # Utilitaires et fonctions partagées
  └── public/             # Fichiers statiques
```

## Intégration avec Google Vision API (à venir)

Pour intégrer l'API Google Vision, vous devrez :

1. Créer un compte Google Cloud Platform
2. Activer l'API Vision
3. Générer une clé API
4. Créer un fichier `.env.local` à la racine du projet avec :
   ```
   GOOGLE_VISION_API_KEY=your_api_key_here
   ```

## Améliorations futures

- Intégration de l'API Google Vision pour l'analyse d'image réelle
- Connexion à des APIs e-commerce pour obtenir des produits réels
- Système d'authentification et historique des recherches
- Filtres avancés pour les résultats
- Optimisation des performances et du référencement