# Déploiement — Vercel + Supabase

## 1. Base de données

Dans un projet Supabase, ouvrir l'éditeur SQL et exécuter `sql/schema.sql`
(le script est idempotent, réexécutable sans risque).

Puis, dans le tableau de bord :

| Où | Quoi |
|---|---|
| Authentication → Providers → Email | activer |
| Authentication → Email Templates → Magic Link | le gabarit **doit** contenir `{{ .Token }}` — sans cela Supabase n'envoie qu'un lien, et le code à six chiffres attendu par le jeu n'existe pas |
| Authentication → URL Configuration | ajouter l'URL Vercel dans les URL autorisées |
| Settings → API | copier « Project URL » et la clé « anon public » |

## 2. Hébergement

Ce dossier est un site statique : aucun build côté serveur, aucune dépendance.

```
vercel deploy --prod          # depuis web/
```

ou bien relier le dépôt et régler, dans les réglages du projet Vercel :

- **Framework Preset** : Other
- **Root Directory** : `web`
- **Build Command** : vide
- **Output Directory** : `.`

### Variables d'environnement

Renseignées au moment du build (`python3 build_web.py`), pas à l'exécution :

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

Elles sont écrites dans `config.js`. Laissées vides, le jeu reste jouable :
chaque joueur peut saisir les valeurs lui-même dans Profil → En ligne.

La clé « anon » est publique par conception : l'isolation repose entièrement
sur les politiques RLS du schéma, jamais sur le secret de la clé.

## 3. Ce que l'hébergement apporte

- **Sprites animés** : la sonde au démarrage réussit, les GIF Black/White se
  superposent automatiquement à l'atlas dans les grandes vues.
- **Installation PWA** : manifeste et service worker réels, donc icône sur
  l'écran d'accueil et lancement en plein écran.
- **Hors ligne** : les images sont mises en cache définitivement (leur nom
  porte une empreinte du contenu), le HTML passe par le réseau d'abord et
  retombe sur le cache en cas de coupure.
- **Chargement** : 169 Ko compressés pour le HTML, les 490 Ko d'images n'étant
  téléchargés qu'une fois.

## 4. Régénérer

```
python3 build.py        # dist/index.html — version embarquée, un seul fichier
python3 build_web.py    # web/          — version hébergée, images séparées
```
