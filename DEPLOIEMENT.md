# Mise en ligne — Vercel + Supabase

Deux opérations indépendantes. Le jeu fonctionne sans la seconde : sans Supabase,
il reste entièrement jouable, seules la sauvegarde distante, les classements et
les échanges sont absents.

---

## 1. Supabase — la base

### 1.1 Créer le projet

supabase.com → **New project**. Notez la région (la latence des sauvegardes en
dépend) et le mot de passe de la base, qui ne resservira pas ici.

### 1.2 Appliquer le schéma

**SQL Editor** → **New query** → coller l'intégralité de `sql/schema.sql` → **Run**.

Le script crée deux tables (`saves`, `trades`), une vue publique (`leaderboard`),
trois fonctions et toutes les politiques RLS. Il est **idempotent** : le réexécuter
ne casse rien et sert à appliquer une mise à jour.

Résultat attendu : `Success. No rows returned`.

> Le linter Supabase signalera `security_definer_view` sur `leaderboard`.
> C'est **voulu** : c'est le seul chemin de lecture publique, et il est limité
> aux colonnes de vitrine. La table `saves` elle-même est inaccessible au rôle
> `anon` (`revoke all ... from anon` en fin de script).

### 1.3 Activer l'authentification par code

**Authentication → Providers → Email** : activer.

**Authentication → Email Templates → Magic Link** : le gabarit **doit** contenir
`{{ .Token }}`. C'est le point le plus facile à rater — sans lui, Supabase
n'envoie qu'un lien cliquable, et le code à six chiffres attendu par le jeu
n'existe pas.

Gabarit minimal :

```html
<h2>Pokémon Code Genesis</h2>
<p>Votre code de connexion :</p>
<p style="font-size:28px;letter-spacing:6px"><b>{{ .Token }}</b></p>
<p>Il expire dans une heure.</p>
```

**Authentication → Providers → Email → Confirm email** : le désactiver permet une
première connexion immédiate. Le laisser actif fonctionne aussi — le client essaie
successivement les types de vérification `email`, `signup` et `magiclink`.

### 1.4 Récupérer les clés

**Settings → API** :

| Champ | Va dans |
|---|---|
| Project URL | `SUPABASE_URL` |
| Project API keys → `anon` `public` | `SUPABASE_ANON_KEY` |

La clé `anon` est **publique par conception**. Elle sera visible dans le code de
la page, et ce n'est pas un problème : l'isolation repose entièrement sur les
politiques RLS. N'utilisez **jamais** la clé `service_role` ici.

---

## 2. Vercel — l'hébergement

### 2.1 Pousser le dépôt

```bash
git init
git add .
git commit -m "Pokémon Code Genesis"
git remote add origin git@github.com:VOTRE-COMPTE/pokemon-code-genesis.git
git push -u origin main
```

`.gitignore` exclut `sprites/` (1,6 Go de sprites bruts, régénérables) et
`build/`. Le dossier `web/` est **volontairement versionné** : il sert de sortie
de secours si le build échoue.

### 2.2 Importer dans Vercel

vercel.com → **Add New → Project** → importer le dépôt.

Ne touchez à rien dans l'écran de configuration : le `vercel.json` à la racine
fixe déjà tout.

| Réglage | Valeur (déjà dans vercel.json) |
|---|---|
| Framework | aucun |
| Build Command | `python3 build_web.py \|\| … ; node tools/inject-config.mjs` |
| Output Directory | `web` |

Le build tente de régénérer `web/` depuis les sources ; si Python manque dans
l'image, il conserve le `web/` versionné. Dans les deux cas, `config.js` est
réécrit par Node à partir des variables d'environnement.

### 2.3 Variables d'environnement

**Settings → Environment Variables**, pour les trois environnements :

```
SUPABASE_URL        https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY   eyJhbGciOi...
```

Puis **Deployments → … → Redeploy** : les variables ne sont lues qu'au build.

### 2.4 Autoriser l'origine côté Supabase

Retour dans Supabase, **Authentication → URL Configuration** :

- **Site URL** : `https://votre-projet.vercel.app`
- **Redirect URLs** : ajouter la même URL, et `https://*.vercel.app` pour couvrir
  les déploiements de prévisualisation.

---

## 3. Vérifier que tout est branché

Dans l'ordre, sur le site déployé :

1. **Profil → En ligne → Compte** affiche « configuré, non connecté ».
   Sinon, les variables d'environnement ne sont pas arrivées : redéployez.
2. Saisir une adresse, **Recevoir un code**. Le courriel doit contenir six
   chiffres, pas seulement un lien. Sinon, revoir le gabarit (1.3).
3. Saisir le code → « Connecté ».
4. **Sauvegarde → Envoyer maintenant**. Dans Supabase, **Table Editor → saves**
   doit montrer une ligne avec votre `user_id` et `rev = 1`.
5. **Classements → Charger** : vous devez y figurer.
6. Sur mobile, le navigateur doit proposer **Ajouter à l'écran d'accueil**.
7. Vérifier que les sprites sont **animés** : hors du cadre restreint, la sonde
   de démarrage réussit et les GIF se superposent à l'atlas.

---

## 4. Mettre à jour

```bash
python3 build_atlas.py     # seulement si les sprites changent
python3 build_cardart.py   # seulement si les illustrations changent
python3 build_chars.py     # seulement si assets/prof.png ou missingno.png changent
python3 build.py           # dist/index.html — version autonome
python3 build_web.py       # web/ — version hébergée
npm test                   # 368 vérifications
git commit -am "…" && git push
```

Vercel redéploie automatiquement. Les noms de fichiers d'images portent une
empreinte du contenu : le cache du navigateur et du CDN se met à jour tout seul,
sans purge.

---

## 5. Ce qu'il reste à surveiller

- **Quotas Supabase (offre gratuite)** : 500 Mo de base, 50 000 utilisateurs
  actifs par mois. Une sauvegarde pèse de 40 à 80 Ko : environ 6 000 joueurs
  avant d'y toucher.
- **Purge des échanges** : `sql/schema.sql` fournit `purge_old_trades()`.
  À planifier avec `pg_cron` si l'extension est disponible, sinon à lancer
  manuellement de temps en temps.
- **Sauvegarde de la base** : Supabase conserve des points de restauration
  quotidiens sur les offres payantes uniquement. Sur l'offre gratuite, prévoyez
  un export régulier si la base devient précieuse.


## Mise à jour du schéma (à chaque livraison qui touche `sql/schema.sql`)

Le script est **rejouable** : sur une base existante, il ajoute seulement ce qui manque.

1. Supabase → **SQL Editor** → **New query**.
2. Coller le contenu intégral de `sql/schema.sql`.
3. **Run**. Le message attendu est « Success. No rows returned ».

Sans cette étape, le jeu envoie des colonnes que la base ne connaît pas encore, et la sauvegarde en
ligne échoue.
