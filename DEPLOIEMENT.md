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


# Connecter Supabase — guide complet

Ce que Supabase apporte au jeu : **comptes joueurs** (pseudo, e-mail, mot de passe), **sauvegarde
automatique dans le cloud** récupérée sur un autre appareil, **classements**, **échanges de cartes** et
**classement de la Brèche du jour**. Tout reste facultatif : sans Supabase, le jeu fonctionne en local.

## 1. Créer le projet
1. Sur supabase.com, **New project**. Choisissez un nom, un mot de passe de base de données
   (à conserver, mais le jeu n'en a pas besoin) et une région proche de vos joueurs (Europe).
2. Attendez la fin de la création (une à deux minutes).

## 2. Créer les tables
1. **SQL Editor** → **New query**.
2. Collez **tout** le contenu de `sql/schema.sql`, puis **Run**.
   Si Supabase prévient d'opérations « destructrices » (ce sont des `drop policy if exists`, sans
   danger), confirmez. Résultat attendu : *Success. No rows returned*.
3. Le script est rejouable : relancez-le à chaque version qui modifie `sql/schema.sql`.
   Le linter signalera la vue `leaderboard` comme *security definer* : c'est voulu, c'est le seul
   chemin de lecture publique et il n'expose que les colonnes de vitrine.

## 3. Régler l'authentification
1. **Authentication → Sign In / Providers → Email** : laissez le fournisseur **activé**, et
   **désactivez « Confirm email »**. Raison : le service d'envoi d'e-mails intégré de Supabase
   n'écrit qu'aux membres de votre équipe Supabase, et deux fois par heure au maximum. Avec la
   confirmation activée, vos joueurs ne recevraient jamais l'e-mail et ne pourraient pas se connecter.
2. **Authentication → URL Configuration** :
   - **Site URL** : l'adresse de votre jeu, par exemple `https://poke-genesis-x.vercel.app`
   - **Redirect URLs** : ajoutez la même adresse suivie de `/**`
   (c'est là que reviennent les liens de réinitialisation de mot de passe).
3. *Plus tard, recommandé* : **Authentication → Emails → SMTP Settings**, branchez un service d'envoi
   (Resend, Brevo… ont des offres gratuites). Alors seulement, « Mot de passe oublié », la connexion
   par code et la confirmation d'e-mail fonctionneront pour tous les joueurs. Pensez ensuite à relever
   la limite dans **Authentication → Rate Limits** (30 e-mails par heure par défaut).

## 4. Récupérer l'adresse et la clé publique
1. Bouton **Connect** en haut du projet (ou **Settings → API Keys**).
2. Notez la **Project URL** (`https://xxxx.supabase.co`).
3. Notez la **Publishable key** (`sb_publishable_…`). Si elle n'existe pas encore, **Create new API
   keys**. L'ancienne clé « anon » fonctionne aussi, mais Supabase l'abandonne fin 2026.
4. **Ne mettez jamais la clé secrète (`sb_secret_…`) dans le jeu.** La clé publishable est publique par
   conception : ce sont les politiques RLS du schéma qui protègent les données.

## 5. Brancher Vercel
1. Vercel → votre projet → **Settings → Environment Variables** :
   - `SUPABASE_URL` = la Project URL
   - `SUPABASE_PUBLISHABLE_KEY` = la clé publishable (ou `SUPABASE_ANON_KEY` avec l'ancienne clé)
   Cochez **Production** (et **Preview** si vous voulez tester les branches).
2. **Deployments → ⋯ → Redeploy** : une variable d'environnement ne s'applique qu'à une nouvelle
   construction.

## 6. Vérifier
1. Ouvrez le jeu → **Profil → Espace en ligne** : l'état indique *configuré, non connecté*.
2. **Créer un compte**. Dans Supabase, **Authentication → Users** montre le nouveau joueur.
3. Jouez deux minutes (ou **Synchroniser**) : **Table Editor → saves** contient une ligne.
4. Sur un autre appareil, **Se connecter** avec le même compte : la progression revient seule.

## Bon à savoir
- **Offre gratuite** : un projet sans activité pendant 7 jours peut être mis en pause ; il se relance
  depuis le tableau de bord. Les sauvegardes de la base ne sont pas téléchargeables sur cette offre.
- **Conflits** : si deux appareils ont progressé chacun de leur côté, le jeu demande laquelle garder.
  Il ne tranche jamais seul entre deux progressions.
