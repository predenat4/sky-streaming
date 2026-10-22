# PROMPT COMPLET : SITE D'INSCRIPTION AVEC COMPTES, BASE SUPABASE ET PANNEAU ADMIN

## 0. Comment utiliser ce document

Tu es un développeur web full-stack senior, rigoureux, spécialisé en sécurité applicative. Tu vas construire de bout en bout le projet décrit ci-dessous. Ce document est la source de vérité : il décrit le but du site, les règles métier, le parcours de chaque type d'utilisateur, la base de données, la sécurité, l'interface, les textes, le déploiement et les critères de réussite. Lis-le entièrement avant d'écrire la moindre ligne de code. Quand une information manque, ne l'invente pas en silence : applique la décision par défaut indiquée dans la section « Décisions par défaut et points ouverts », ou pose une question courte si le choix change réellement l'architecture.

Le propriétaire du projet est un développeur francophone, basé en Haïti. Il travaille sous Linux, avec VS Code et Node.js installé via NVM. Il préfère les solutions simples, en peu d'étapes, utilisables depuis le terminal, et il veut recevoir les fichiers **un par un**, complets, prêts à être copiés-collés tels quels. Il parle français (parfois avec quelques mots d'anglais) et le public final du site parle français et créole haïtien. Toute l'interface visible par les utilisateurs doit donc être rédigée en **français simple et clair**.

---

## 1. Résumé du projet en quelques phrases

Il s'agit d'un site web d'inscription. Une personne crée un compte avec son adresse e-mail et un mot de passe, puis remplit une **fiche d'inscription** contenant son nom complet, le plan qu'elle souhaite (Standard à 500 gourdes ou Premium à 650 gourdes), le moyen de paiement qu'elle compte utiliser (NatCash ou MonCash) avec le numéro correspondant, le nom de son profil, les codes qu'elle souhaite associer à ce profil et son numéro WhatsApp. La fiche est enregistrée dans une vraie base de données Supabase, protégée par des règles d'accès strictes.

**Aucun paiement n'a lieu sur le site.** Le site ne se connecte ni à NatCash ni à MonCash et ne vérifie aucune transaction automatiquement. Le site sert uniquement à collecter proprement les informations et à les transmettre à l'administrateur. L'administrateur lit les fiches dans un panneau d'administration, discute lui-même avec la personne (principalement sur WhatsApp), la personne paie ensuite par NatCash ou MonCash en dehors du site, puis l'administrateur **valide le paiement** dans le panneau en enregistrant la transaction. Une fois le paiement validé, l'administrateur envoie à la personne les coordonnées de son compte par WhatsApp, via le numéro qu'elle a fourni. Enfin, le site comporte une section **Aide / Contact** : si une personne rencontre une difficulté, elle peut écrire à l'administrateur par e-mail.

En une phrase : **un formulaire sécurisé qui alimente une base de données, un panneau admin pour traiter chaque fiche à la main, et WhatsApp pour la communication.**

---

## 2. Ce que le site est, et ce qu'il n'est pas

Cette section existe pour éviter les erreurs d'interprétation. Relis-la chaque fois que tu hésites sur une fonctionnalité.

### 2.1 Ce que le site EST

- Un site d'inscription avec **création de compte par e-mail** (Supabase Auth).
- Un formulaire de fiche, accessible uniquement aux personnes connectées, qui écrit dans la base de données.
- Un espace personnel minimal où la personne voit l'état de sa fiche (nouvelle, en discussion, payée, livrée, annulée).
- Un **panneau d'administration** réservé au propriétaire, qui lit toutes les fiches depuis la base, permet de changer leur statut, d'ajouter des notes, de contacter la personne sur WhatsApp, d'enregistrer un paiement et de marquer une fiche comme livrée.
- Une page d'aide avec un moyen de contact par e-mail.

### 2.2 Ce que le site N'EST PAS

- Ce n'est **pas** une boutique en ligne. Il n'y a pas de panier, pas de passerelle de paiement, pas d'intégration de l'API MonCash ou NatCash.
- Ce n'est **pas** un système qui vérifie automatiquement qu'un paiement est arrivé. C'est l'administrateur qui constate le paiement dans son propre compte NatCash/MonCash et qui l'enregistre manuellement.
- Ce n'est **pas** un système de messagerie. Les conversations se font sur WhatsApp, hors du site. Le site fournit seulement un lien qui ouvre WhatsApp avec le bon numéro et un message pré-rempli.
- Ce n'est **pas** un site où l'on peut devenir administrateur en s'inscrivant. Le rôle d'administrateur est attribué uniquement par une opération manuelle dans la base.
- Il n'y a **pas** de serveur applicatif personnalisé à écrire (pas d'Express, pas d'API maison). Le navigateur parle directement à Supabase, et la sécurité repose sur les règles **RLS (Row Level Security)** côté base de données.

---

## 3. Les acteurs et leurs droits

Il y a trois profils d'accès.

### 3.1 Le visiteur anonyme

Il peut voir la page d'accueil (présentation du service, des deux plans et de leurs prix), la page d'aide, la page de création de compte et la page de connexion. Il ne peut **rien** lire ni écrire dans la base de données. Aucune politique RLS ne donne d'accès au rôle anonyme sur les tables.

### 3.2 L'utilisateur connecté (le client)

Après avoir créé son compte et confirmé son adresse e-mail, il peut :

- créer **une fiche** liée à son compte (voir « Décisions par défaut » pour la règle « un compte = une fiche ») ;
- consulter **sa propre fiche** et le statut qui lui est associé ;
- se déconnecter.

Il ne peut **pas** : modifier le statut de sa fiche, lire la fiche d'une autre personne, voir ou écrire des notes d'administration, voir ou écrire des paiements, ni modifier sa fiche après l'envoi (pour garder une trace fiable de ce qu'il a déclaré ; l'administrateur peut éventuellement corriger via le panneau).

### 3.3 L'administrateur

Son compte est un compte normal créé via l'inscription habituelle, puis ajouté manuellement à la table `admins` par une requête SQL exécutée dans l'éditeur SQL de Supabase. Il accède à une page d'administration distincte. Il peut :

- lire toutes les fiches ;
- changer le statut d'une fiche ;
- écrire et modifier une note interne sur une fiche ;
- ouvrir une conversation WhatsApp avec la personne depuis la fiche ;
- enregistrer un paiement (opérateur, référence de transaction, montant) ;
- marquer la fiche comme payée, puis livrée ;
- envoyer les coordonnées du compte via un lien WhatsApp pré-rempli ;
- annuler une fiche.

---

## 4. Le parcours complet, étape par étape

### 4.1 Parcours du client

1. La personne arrive sur la **page d'accueil**. Elle comprend en quelques secondes ce que propose le site et voit les deux plans avec leurs prix : Standard (500 gourdes) et Premium (650 gourdes). Un gros bouton l'invite à créer un compte.
2. Elle va sur la page **Créer un compte**, saisit son e-mail et son mot de passe (avec confirmation). Un message lui indique qu'un e-mail de confirmation vient d'être envoyé.
3. Elle clique sur le lien de confirmation reçu par e-mail, puis arrive sur la page **Connexion**.
4. Elle se connecte et est redirigée vers la page **Ma fiche**.
5. Comme elle n'a pas encore de fiche, la page lui affiche le **formulaire d'inscription** avec les champs suivants :
   - nom complet ;
   - plan (Standard ou Premium), avec le prix affiché dynamiquement ;
   - numéro WhatsApp ;
   - moyen de paiement prévu (NatCash ou MonCash) ;
   - numéro NatCash ou MonCash (avec une case « même numéro que WhatsApp ») ;
   - nom du profil ;
   - codes du profil.
6. Elle envoie le formulaire. Le site enregistre la fiche dans Supabase avec le statut `nouvelle`, puis remplace le formulaire par une **vue de statut** qui affiche un message de confirmation : « Votre fiche a bien été reçue. L'administrateur va vous contacter sur WhatsApp. »
7. L'administrateur la contacte sur WhatsApp. Ils discutent. Le statut passe à `en_discussion`.
8. La personne paie par NatCash ou MonCash, en dehors du site, comme convenu avec l'administrateur.
9. L'administrateur constate le paiement, l'enregistre et passe le statut à `paye`. Quand la personne revient sur le site, elle voit : « Votre paiement a été validé. Vous allez recevoir vos accès par WhatsApp. »
10. L'administrateur envoie les coordonnées du compte par WhatsApp, puis marque la fiche `livre`. La personne voit : « Vos accès ont été envoyés. »
11. À tout moment, si elle rencontre une difficulté, elle ouvre la page **Aide** et écrit à l'administrateur par e-mail.

### 4.2 Parcours de l'administrateur

1. Il se rend sur `/admin/`, saisit son e-mail et son mot de passe.
2. Le site vérifie que le compte figure dans la table `admins`. Si ce n'est pas le cas, l'accès est refusé et la session est fermée immédiatement.
3. Il arrive sur un **tableau de bord** : la liste des fiches, les plus récentes en premier, avec un filtre par statut. Les fiches `nouvelle` sont visuellement mises en avant.
4. Il clique sur une fiche : le **détail** s'ouvre avec toutes les informations, un bouton pour contacter la personne sur WhatsApp, un sélecteur de statut, une zone de note interne, un formulaire d'enregistrement de paiement et, une fois le paiement validé, une zone pour préparer le message WhatsApp contenant les coordonnées du compte.
5. Il contacte la personne, change le statut en `en_discussion`, ajoute des notes.
6. Quand la personne a payé, il retrouve la transaction dans son propre compte NatCash/MonCash, ouvre le formulaire de paiement dans la fiche (pré-rempli avec l'opérateur choisi et le montant du plan), saisit la **référence de transaction** et clique sur **Valider le paiement**.
7. Le paiement est enregistré dans la table `paiements`, la fiche passe à `paye`.
8. Il prépare le message d'envoi des coordonnées, clique sur le lien WhatsApp, envoie le message, puis clique sur **Marquer comme livré**.

---

## 5. Stack technique imposée

Respecte strictement ce choix, sauf contrainte technique sérieuse que tu signales.

- **Front-end** : HTML5, CSS3 et JavaScript moderne en modules ES (sans framework lourd). Le site est multi-pages.
- **Outil de build et serveur de développement** : Vite (version 5).
- **Base de données, authentification et API** : Supabase (PostgreSQL + Supabase Auth + PostgREST), via la bibliothèque `@supabase/supabase-js` (version 2).
- **Sécurité des données** : Row Level Security (RLS) activée sur toutes les tables.
- **Hébergement du front** : n'importe quel hébergeur de sites statiques (Netlify, Vercel, Cloudflare Pages ou GitHub Pages). Le résultat de `vite build` est un dossier de fichiers statiques.
- **Pas de backend personnalisé.** Pas de Node.js côté serveur en production. Node.js sert uniquement d'outil de développement local (npm, Vite).

Le projet utilise le champ `"type": "module"` dans `package.json`. Les scripts disponibles sont `dev`, `build` et `preview`.

Pourquoi ce choix : il minimise le nombre d'étapes d'installation, évite de gérer un serveur, et déplace la sécurité là où elle doit être, c'est-à-dire dans la base de données, qui applique les règles d'accès quoi que fasse le navigateur.

---

## 6. Arborescence du projet

```
inscription-site/
├── package.json
├── vite.config.js
├── .env                      # jamais commité
├── .env.example
├── .gitignore
├── index.html                # accueil : présentation + plans + bouton « créer un compte »
├── signup.html               # création de compte
├── login.html                # connexion
├── fiche.html                # formulaire + suivi du statut de sa fiche
├── aide.html                 # aide / contact par e-mail
├── admin/
│   └── index.html            # connexion admin + liste + détail (page unique)
├── css/
│   └── style.css
├── src/
│   ├── supabaseClient.js     # création du client Supabase
│   ├── common.js             # constantes (prix, statuts) + utilitaires
│   ├── auth.js               # inscription et connexion
│   ├── fiche.js              # formulaire et vue de statut du client
│   ├── aide.js               # lien mailto dynamique
│   └── admin.js              # toute la logique du panneau admin
└── supabase/
    └── schema.sql            # tables + fonctions + règles RLS
```

Le fichier `vite.config.js` déclare toutes les pages HTML comme points d'entrée (`main`, `signup`, `login`, `fiche`, `aide`, `admin`) afin que `vite build` génère chacune d'elles.

---

## 7. Variables d'environnement

Le fichier `.env` (non versionné) contient exactement trois variables :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=la_cle_anon_publique
VITE_SUPPORT_EMAIL=adresse_de_contact@exemple.com
```

Règles absolues :

- La clé **`anon`** (publique) est la seule clé Supabase autorisée dans le code du front-end. Elle est conçue pour être exposée, et c'est la RLS qui protège les données.
- La clé **`service_role`** ne doit **jamais** apparaître dans le code du site, dans `.env`, ni dans Git. Elle contourne la RLS et donnerait un accès total à la base.
- `.env` figure dans `.gitignore`. Seul `.env.example` (avec des valeurs factices) est versionné.
- Le préfixe `VITE_` est obligatoire pour que Vite expose la variable au navigateur. L'adresse e-mail d'aide est publique par nature (elle est affichée sur la page d'aide).

---

## 8. Base de données : modèle complet

### 8.1 Vue d'ensemble

Trois tables dans le schéma `public`, en plus de la table `auth.users` gérée par Supabase.

1. `admins` : liste des utilisateurs ayant le rôle d'administrateur.
2. `inscriptions` : une ligne par fiche d'inscription, liée à un utilisateur.
3. `paiements` : une ligne par paiement enregistré par l'administrateur, liée à une inscription.

### 8.2 Table `admins`

| Colonne | Type | Règle |
|---|---|---|
| `user_id` | uuid | clé primaire, référence `auth.users(id)`, suppression en cascade |

Cette table ne contient que les identifiants des administrateurs. Aucune page du site ne permet d'y écrire. L'insertion se fait à la main dans l'éditeur SQL :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'adresse_de_l_admin@exemple.com';
```

### 8.3 Fonction `is_admin()`

Une fonction SQL `public.is_admin()` retourne `true` si l'utilisateur courant (`auth.uid()`) est présent dans `admins`. Elle est déclarée `security definer` avec un `search_path` fixé à `public`, et marquée `stable`. Elle est utilisée dans les politiques RLS. Le mode `security definer` est nécessaire pour qu'elle puisse lire `admins` indépendamment des politiques de cette table, et le `search_path` fixé évite les détournements de schéma.

### 8.4 Table `inscriptions`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | clé primaire, défaut `gen_random_uuid()` |
| `user_id` | uuid | non nul, **unique**, référence `auth.users(id)`, suppression en cascade |
| `nom_complet` | text | non nul, longueur entre 2 et 120 |
| `plan` | text | non nul, valeurs autorisées : `standard`, `premium` |
| `operateur_choisi` | text | non nul, valeurs autorisées : `natcash`, `moncash` |
| `numero_paiement` | text | non nul, uniquement des chiffres, 8 à 15 caractères |
| `nom_profil` | text | non nul, longueur entre 2 et 60 |
| `codes_profil` | text | optionnel, 1000 caractères maximum |
| `whatsapp` | text | non nul, uniquement des chiffres, 8 à 15 caractères |
| `statut` | text | non nul, défaut `nouvelle`, valeurs : `nouvelle`, `en_discussion`, `paye`, `livre`, `annule` |
| `note_admin` | text | optionnel, 2000 caractères maximum |
| `created_at` | timestamptz | non nul, défaut `now()` |
| `updated_at` | timestamptz | non nul, défaut `now()`, mis à jour par un déclencheur |

Points importants :

- La contrainte `unique` sur `user_id` implémente la règle « un compte = une fiche » par défaut. Si le propriétaire décide plus tard d'autoriser plusieurs fiches par compte, il suffira de supprimer cette contrainte et d'adapter l'interface ; c'est pourquoi la question reste ouverte (voir section 20).
- Le **montant n'est pas stocké** dans `inscriptions`. Il se déduit du plan : 500 pour `standard`, 650 pour `premium`. Le navigateur ne transmet jamais de prix. Le montant réellement reçu est enregistré dans `paiements` par l'administrateur.
- Les numéros sont stockés **sans espace, sans signe plus, sans tiret**, au format international : l'indicatif du pays suivi du numéro, par exemple `50937123456`. Cela permet de fabriquer directement un lien `https://wa.me/50937123456`.
- Les contraintes `check` en base répètent volontairement la validation faite côté navigateur : on ne fait jamais confiance au front-end.

### 8.5 Déclencheur `updated_at`

Une fonction `public.set_updated_at()` en PL/pgSQL affecte `now()` à `new.updated_at`, et un déclencheur `before update` sur `inscriptions` l'exécute pour chaque ligne modifiée.

### 8.6 Table `paiements`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | clé primaire, défaut `gen_random_uuid()` |
| `inscription_id` | uuid | non nul, référence `inscriptions(id)`, suppression en cascade |
| `operateur` | text | non nul, valeurs : `natcash`, `moncash` |
| `reference_transaction` | text | non nul, **unique**, longueur entre 3 et 100 |
| `montant` | integer | non nul, strictement positif (en gourdes) |
| `valide_par` | uuid | référence `auth.users(id)` (l'admin qui a validé) |
| `validated_at` | timestamptz | non nul, défaut `now()` |

La contrainte d'unicité sur `reference_transaction` empêche d'enregistrer deux fois la même transaction (par erreur ou pour une double utilisation). Cette table n'est lue et écrite que par l'administrateur. Elle sert d'historique propre, séparé de la fiche.

### 8.7 Statuts et transitions

Les statuts d'une fiche sont :

- `nouvelle` : la fiche vient d'être envoyée, personne n'a encore répondu ;
- `en_discussion` : l'administrateur a contacté la personne ;
- `paye` : le paiement a été constaté et enregistré ;
- `livre` : les coordonnées du compte ont été envoyées ;
- `annule` : la fiche est abandonnée (par l'administrateur).

Le flux normal est `nouvelle` → `en_discussion` → `paye` → `livre`. L'annulation est possible depuis n'importe quel statut. Le panneau admin permet de changer librement le statut via un sélecteur (pour corriger des erreurs), mais le bouton « Valider le paiement » impose toujours l'enregistrement d'un paiement avant de passer à `paye`.

---

## 9. Sécurité : les règles RLS en détail

La sécurité est le cœur de ce projet. Le propriétaire a explicitement demandé d'« éviter tout piratage ». Il faut être honnête : aucun système n'est invulnérable, mais cette architecture, correctement appliquée, ferme les principales portes.

### 9.1 Activation

La RLS est activée sur les trois tables (`alter table ... enable row level security`). Sans politique, personne ne peut rien lire ni écrire. On ajoute ensuite uniquement les politiques nécessaires, toutes destinées au rôle `authenticated`. Le rôle `anon` n'a aucune politique, donc aucun accès.

### 9.2 Politiques sur `admins`

- `admins_select_own` : lecture autorisée uniquement si `user_id = auth.uid()`. Cela permet à l'interface de savoir si l'utilisateur connecté est administrateur, sans révéler la liste des administrateurs.
- Aucune politique d'insertion, de modification ni de suppression : la table est donc en lecture seule pour tous les clients. Seul un accès direct à l'éditeur SQL permet de la modifier.

### 9.3 Politiques sur `inscriptions`

- `inscriptions_insert_own` : un utilisateur connecté peut insérer une ligne **seulement si** `user_id = auth.uid()`, `statut = 'nouvelle'` et `note_admin is null`. Cela l'empêche de s'attribuer un statut avancé (par exemple `paye`) ou d'écrire une note d'administration en trafiquant la requête.
- `inscriptions_select_own_or_admin` : lecture autorisée si `user_id = auth.uid()` ou si `public.is_admin()` est vrai.
- `inscriptions_update_admin` : modification autorisée uniquement pour l'administrateur (clauses `using` et `with check` toutes deux basées sur `is_admin()`).
- `inscriptions_delete_admin` : suppression autorisée uniquement pour l'administrateur.

### 9.4 Politique sur `paiements`

- `paiements_admin_all` : toutes les opérations réservées à l'administrateur.

### 9.5 Règles de sécurité complémentaires

1. **Jamais de clé `service_role` côté client.** Voir section 7.
2. **Validation en trois couches** : le navigateur (confort de l'utilisateur), les contraintes `check` en base (sécurité réelle), et les politiques RLS (contrôle d'accès).
3. **Pas d'injection HTML (XSS).** Les données saisies par les utilisateurs sont affichées dans le panneau admin. Ce sont des saisies d'inconnus : elles doivent toujours être insérées avec `textContent` ou `element.append(texte)`, **jamais** avec `innerHTML`. Aucun contenu utilisateur ne doit être concaténé dans une chaîne HTML.
4. **Pas de SQL construit à la main.** Toutes les requêtes passent par le client Supabase, qui utilise des requêtes paramétrées.
5. **Confirmation d'e-mail obligatoire** dans les réglages Supabase Auth, pour éviter les comptes jetables avec de fausses adresses.
6. **Protection contre les inscriptions abusives** : activer la protection CAPTCHA de Supabase Auth si disponible, et conserver les limites de débit par défaut de Supabase Auth.
7. **Mot de passe fort** : minimum 8 caractères imposé côté client, et réglage de longueur minimale dans Supabase Auth.
8. **Compte administrateur** : mot de passe long et unique ; si possible activer l'authentification à deux facteurs sur le compte Supabase du propriétaire (le tableau de bord Supabase contient toutes les données).
9. **HTTPS obligatoire** en production (fourni par les hébergeurs cités).
10. **Liens WhatsApp** : toujours construits avec `encodeURIComponent` pour le texte, et ouverts avec `target="_blank"` et `rel="noopener noreferrer"`.
11. **Redirections d'authentification** : configurer dans Supabase l'URL du site et la liste des URL de redirection autorisées, pour que le lien de confirmation par e-mail ne puisse pas être détourné.
12. **Sauvegardes** : activer ou planifier des sauvegardes de la base (les données de paiement et de contact sont sensibles).

### 9.6 Sur les données personnelles

Le site collecte des numéros de téléphone, des noms et des numéros de portefeuille mobile. Il faut :

- ne collecter que ce qui est nécessaire (c'est le cas ici) ;
- afficher une courte mention de confidentialité sous le formulaire (« Vos informations sont utilisées uniquement pour traiter votre inscription ») ;
- ne jamais exposer ces données publiquement ;
- ne jamais les envoyer à un service tiers non nécessaire.

---

## 10. Authentification

### 10.1 Inscription par e-mail

- Méthode : `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })`.
- `emailRedirectTo` pointe vers la page de connexion du site (`origin + '/login.html'`).
- Après l'appel réussi, le formulaire est réinitialisé et un message de succès demande de vérifier la boîte e-mail (et le dossier spam).
- Validation côté client : adresse non vide, mot de passe d'au moins 8 caractères, confirmation identique.
- Les messages d'erreur renvoyés par Supabase sont affichés tels quels, ou traduits en français lorsque c'est simple (par exemple compte déjà existant).

### 10.2 Connexion

- Méthode : `supabase.auth.signInWithPassword({ email, password })`.
- En cas de succès, redirection vers `/fiche.html`.
- En cas d'erreur, message clair : « E-mail ou mot de passe incorrect. » (sans préciser lequel des deux est faux, pour ne pas faciliter l'énumération de comptes). Si l'e-mail n'est pas encore confirmé, un message l'indique.
- Si l'utilisateur est déjà connecté en arrivant sur la page de connexion, il est redirigé directement vers `/fiche.html`.

### 10.3 Session et déconnexion

- La session est gérée par `supabase-js` (stockage local du jeton, rafraîchissement automatique).
- Chaque page protégée (`fiche.html`, `admin/index.html`) vérifie la session au chargement avec `supabase.auth.getUser()`. Sans session valide, redirection vers la page de connexion correspondante.
- Un bouton **Se déconnecter** appelle `supabase.auth.signOut()` puis redirige vers l'accueil.

### 10.4 Séparation client / admin

Il n'existe qu'un seul système de comptes. La distinction se fait par la présence dans `admins`. La page `/admin/` possède son propre formulaire de connexion, mais après authentification elle appelle `isAdmin(user.id)` (lecture dans `admins`). Si la réponse est négative, elle ferme la session (`signOut`) et affiche « Accès refusé ». Cette vérification côté interface n'est qu'un confort : la vraie protection reste la RLS, qui refuserait de toute façon les lectures et écritures à un non-admin.

---

## 11. Pages publiques : spécification détaillée

### 11.1 Structure commune

Toutes les pages partagent :

- un **en-tête** avec le nom du site, des liens de navigation (Accueil, Aide) et, selon l'état de connexion, les liens « Connexion » / « Créer un compte » ou « Ma fiche » ;
- un **pied de page** avec un lien visible « Besoin d'aide ? » vers `aide.html` et une mention de droits ;
- la balise `<meta name="viewport" content="width=device-width, initial-scale=1">` ;
- `lang="fr"` sur la balise `html` ;
- le même fichier CSS `css/style.css`.

### 11.2 `index.html` : accueil

Contenu :

- un titre accrocheur et une phrase d'explication en une ou deux lignes ;
- une section « Comment ça marche ? » en quatre étapes courtes : 1. Crée ton compte ; 2. Remplis ta fiche ; 3. L'administrateur te contacte sur WhatsApp ; 4. Tu paies et tu reçois tes accès ;
- deux cartes de plans :
  - **Standard : 500 gourdes** ;
  - **Premium : 650 gourdes** ;
  - (le propriétaire pourra compléter la liste des avantages de chaque plan ; en attendant, prévoir un espace réservé clairement identifiable) ;
- une phrase rassurante : « Aucun paiement n'est demandé sur ce site. Tu paieras par NatCash ou MonCash après avoir discuté avec l'administrateur. » ;
- un bouton principal « Créer un compte » et un lien secondaire « J'ai déjà un compte ».

Si l'utilisateur est déjà connecté, le bouton principal devient « Accéder à ma fiche ».

### 11.3 `signup.html` : création de compte

Un formulaire avec trois champs : e-mail, mot de passe, confirmation du mot de passe. Un bouton « Créer mon compte ». Une zone de message (`#msg`) pour les erreurs et les succès. Un lien « Déjà inscrit ? Se connecter ». Le bouton est désactivé pendant l'envoi pour éviter les doubles soumissions.

### 11.4 `login.html` : connexion

Deux champs (e-mail, mot de passe), un bouton « Se connecter », une zone de message, un lien « Pas encore de compte ? Créer un compte ». Un lien « Mot de passe oublié ? » est une évolution possible (voir section 19) : il peut utiliser `supabase.auth.resetPasswordForEmail`, mais il n'est pas obligatoire pour la première version.

### 11.5 `fiche.html` : formulaire et suivi

La page a deux états, exclusifs.

**État A : aucune fiche.** Le formulaire est visible. Champs, dans cet ordre :

1. **Nom complet** : texte, obligatoire, 2 à 120 caractères.
2. **Plan** : liste déroulante ou boutons radio : « Standard : 500 gourdes » / « Premium : 650 gourdes ». Le prix est toujours visible avec le libellé.
3. **Numéro WhatsApp** : champ téléphone, obligatoire. Aide sous le champ : « Avec l'indicatif du pays, sans espace. Exemple : 50937123456 ».
4. **Moyen de paiement prévu** : deux boutons radio : NatCash / MonCash. Obligatoire.
5. **Numéro de paiement** : champ téléphone dont le libellé change dynamiquement selon le choix précédent : « Votre numéro NatCash » ou « Votre numéro MonCash ». Une case à cocher « Même numéro que WhatsApp » recopie automatiquement le numéro WhatsApp dans ce champ et le verrouille tant qu'elle est cochée.
6. **Nom du profil** : texte, obligatoire, 2 à 60 caractères.
7. **Codes du profil** : zone de texte multiligne, optionnelle, 1000 caractères maximum, avec compteur de caractères.

Sous le formulaire : la mention de confidentialité, puis le bouton « Envoyer ma fiche ».

Validation côté client avant envoi :

- tous les champs obligatoires remplis ;
- numéros nettoyés avec une fonction `normPhone` qui supprime tout ce qui n'est pas un chiffre, puis vérifient que la longueur est entre 8 et 15 ;
- longueurs respectées ;
- un plan et un opérateur sélectionnés.

À l'envoi : insertion dans `inscriptions` avec `user_id` de l'utilisateur connecté et **uniquement** les champs saisis (jamais de `statut` ni de `note_admin` envoyés par le navigateur, la base applique le défaut). En cas d'erreur de doublon (code PostgreSQL `23505`), afficher : « Vous avez déjà envoyé une fiche. » Pour toute autre erreur, afficher : « Une erreur est survenue. Réessayez ou contactez l'aide. » Pas de détail technique pour l'utilisateur.

**État B : une fiche existe.** Le formulaire est masqué. La page affiche :

- un **bandeau de statut** bien visible, avec un libellé et une couleur selon le statut (voir 11.7) ;
- un message explicatif adapté au statut ;
- un récapitulatif en lecture seule des informations envoyées (nom complet, plan et prix, WhatsApp, moyen et numéro de paiement, nom du profil, codes) ;
- la date d'envoi ;
- un lien vers l'aide.

Dans les deux états, l'e-mail de l'utilisateur et un bouton « Se déconnecter » sont affichés en haut de la page.

### 11.6 `aide.html` : aide et contact

Contenu :

- un titre « Besoin d'aide ? » ;
- une phrase : « Si vous rencontrez une difficulté (inscription, fiche, paiement, accès), écrivez-nous par e-mail. » ;
- un bouton ou lien `mailto:` vers l'adresse définie dans `VITE_SUPPORT_EMAIL`, avec un objet pré-rempli : « Aide : problème rencontré sur le site » ;
- un conseil : « Indiquez l'adresse e-mail de votre compte et décrivez le problème. Vous pouvez aussi joindre une capture d'écran. » ;
- une petite **FAQ** : où paie-t-on (réponse : l'administrateur vous indiquera comment sur WhatsApp, le site ne prend aucun paiement) ; combien de temps pour être contacté (laisser un espace modifiable par le propriétaire) ; que faire si le mail de confirmation n'arrive pas (vérifier le spam, puis écrire à l'aide) ; comment modifier une information fausse dans ma fiche (écrire à l'aide).

Le fichier `aide.js` lit `import.meta.env.VITE_SUPPORT_EMAIL` et renseigne l'attribut `href` du lien `mailto:` ainsi que le texte affiché de l'adresse. Si la variable est absente, le lien est masqué et un message neutre est affiché.

### 11.7 Statuts : libellés, couleurs et messages côté client

| Statut | Libellé | Message affiché au client |
|---|---|---|
| `nouvelle` | Fiche reçue | « Votre fiche a bien été reçue. L'administrateur va vous contacter sur WhatsApp. » |
| `en_discussion` | En discussion | « L'administrateur est en contact avec vous. Suivez la conversation sur WhatsApp. » |
| `paye` | Paiement validé | « Votre paiement a été validé. Vous allez recevoir vos accès par WhatsApp. » |
| `livre` | Accès envoyés | « Vos accès ont été envoyés par WhatsApp. Merci ! » |
| `annule` | Annulée | « Votre fiche a été annulée. Contactez l'aide si vous pensez qu'il s'agit d'une erreur. » |

Ces libellés sont centralisés dans `common.js` (constante `STATUTS`) et réutilisés par le panneau admin pour garantir la cohérence.

---

## 12. Panneau d'administration : spécification détaillée

Le panneau est une **page unique** (`admin/index.html`) pilotée par `src/admin.js`. Elle comporte deux grandes zones, affichées selon l'état de connexion : la zone de connexion (`#login`) et l'application (`#app`).

### 12.1 Zone de connexion

Formulaire e-mail + mot de passe, bouton « Connexion administrateur », zone de message. Après authentification réussie, vérification du rôle (voir 10.4). Si le compte n'est pas administrateur : `signOut`, message « Accès refusé ».

### 12.2 Zone application : en-tête

Titre « Panneau administrateur », e-mail de l'admin connecté, bouton « Se déconnecter ».

### 12.3 Liste des fiches

- Requête : sélection de toutes les colonnes de `inscriptions`, triées par `created_at` décroissant.
- Filtre : une liste déroulante « Tous / Nouvelle / En discussion / Payée / Livrée / Annulée ». Le filtrage peut se faire côté client sur le tableau chargé.
- Un compteur par statut (facultatif mais utile) : par exemple « 3 nouvelles ».
- Un tableau (ou une liste de cartes sur mobile) avec les colonnes : date, nom complet, plan, opérateur choisi, statut (badge coloré). Un clic sur une ligne ouvre le détail.
- Les fiches `nouvelle` sont mises en évidence (badge distinct, éventuellement placées en tête).
- Un bouton « Actualiser » recharge la liste.

### 12.4 Détail d'une fiche

Le détail s'affiche dans un panneau (à côté de la liste sur grand écran, en dessous ou en plein écran sur mobile). Il contient les blocs suivants.

**Bloc 1 : Informations de la personne.** Affichage en liste de description : nom complet, plan et prix correspondant, WhatsApp, moyen de paiement choisi, numéro de paiement, nom du profil, codes du profil (en conservant les retours à la ligne, avec la propriété CSS `white-space: pre-wrap`), date de création, dernière mise à jour. Tout est inséré en texte brut.

**Bloc 2 : Contacter.** Un bouton « Ouvrir WhatsApp » vers `https://wa.me/<numéro whatsapp>` (avec un texte d'accueil facultatif pré-rempli, par exemple : « Bonjour, c'est l'administrateur. J'ai bien reçu votre fiche… »). S'ouvre dans un nouvel onglet.

**Bloc 3 : Statut et note interne.** Un sélecteur de statut, une zone de texte pour la note interne (la personne ne la voit jamais), et un bouton « Enregistrer ». L'enregistrement met à jour `statut` et `note_admin`. Un message de confirmation s'affiche en cas de succès.

**Bloc 4 : Enregistrer le paiement.** Un petit formulaire :

- **Opérateur** : liste NatCash / MonCash, **pré-sélectionnée** avec `operateur_choisi` de la fiche mais modifiable (la personne a pu finalement payer autrement) ;
- **Référence de transaction** : texte obligatoire (3 à 100 caractères) ;
- **Montant reçu** : nombre entier, **pré-rempli** avec le prix du plan (500 ou 650) mais modifiable (réduction ou arrangement possible) ;
- bouton **« Valider le paiement »**.

Au clic :

1. insertion dans `paiements` (`inscription_id`, `operateur`, `reference_transaction`, `montant`, `valide_par` = id de l'admin) ;
2. si l'insertion réussit, mise à jour de la fiche avec `statut = 'paye'` ;
3. rafraîchissement de la liste et du détail ;
4. en cas d'erreur d'unicité (`23505`) : « Cette référence de transaction est déjà enregistrée. » ;
5. toute autre erreur : message d'échec, sans changer le statut.

Sous le formulaire, la **liste des paiements déjà enregistrés** pour cette fiche (opérateur, référence, montant, date).

**Bloc 5 : Envoyer les coordonnées.** Visible lorsque le statut est `paye` ou `livre`. Il contient :

- une zone de texte contenant un **modèle de message** modifiable, par exemple : « Bonjour [nom], votre paiement est bien confirmé. Voici les coordonnées de votre compte : Utilisateur : … Mot de passe : … Merci de ne pas les partager. » (le nom de la personne est inséré automatiquement ; les coordonnées sont à compléter par l'administrateur) ;
- un bouton « Envoyer par WhatsApp » dont le lien `https://wa.me/<numéro>?text=<message encodé>` se met à jour en direct quand l'administrateur modifie le texte ;
- un bouton **« Marquer comme livré »** qui passe le statut à `livre`.

Important : **les coordonnées du compte à livrer ne sont jamais stockées dans la base ni dans le code.** Elles sont saisies à la main dans la zone de texte, puis envoyées. Cela évite de conserver des secrets en clair.

**Bloc 6 : Annulation.** Soit via le sélecteur de statut (valeur « Annulée »), soit via un bouton dédié avec demande de confirmation (« Voulez-vous vraiment annuler cette fiche ? »).

### 12.5 Retours à l'utilisateur dans le panneau

- Une zone de message commune (`#msg`) affiche succès et erreurs, avec la classe `ok` ou `error`.
- Chaque bouton d'action est désactivé pendant l'opération pour éviter les doubles clics.
- Après chaque action qui modifie des données, la liste et le détail sont rechargés depuis la base, pour toujours afficher l'état réel.

### 12.6 Construction du DOM

Dans `admin.js`, utiliser une petite fonction utilitaire `h(tag, props, ...children)` qui crée un élément, applique les attributs et les écouteurs d'événements, puis ajoute les enfants avec `append`. Les chaînes passées en enfants deviennent des nœuds texte (donc sûres). Aucune insertion de HTML issu de données.

---

## 13. Code partagé : `common.js`

Ce module exporte :

- `PRIX` : objet `{ standard: 500, premium: 650 }` ;
- `STATUTS` : objet associant chaque statut à son libellé et à son message client (section 11.7) ;
- `getUser()` : retourne l'utilisateur courant ou `null` ;
- `isAdmin(userId)` : lit `admins` et retourne un booléen ;
- `normPhone(valeur)` : supprime tous les caractères non numériques ;
- `showMsg(element, texte, type)` : affiche un message (`type` valant `error` ou `ok`) et rend l'élément visible.

Ne dupliquer ces éléments nulle part ailleurs : `fiche.js` et `admin.js` les importent.

Le module `supabaseClient.js` crée le client avec `createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)` et l'exporte. Il ne contient rien d'autre.

---

## 14. Interface, design et expérience utilisateur

### 14.1 Principes

- **Mobile d'abord.** La majorité des utilisateurs sont sur téléphone, souvent avec une connexion lente. Les pages doivent être légères, lisibles à une main, sans défilement horizontal, avec des marges latérales d'environ 16 px.
- **Simplicité.** Une seule action principale par écran. Pas de jargon.
- **Clarté sur l'argent.** Le prix est toujours affiché en gourdes (« 500 gourdes », « 650 gourdes ») et la mention « aucun paiement sur ce site » est répétée aux endroits stratégiques (accueil, formulaire, aide). Cela évite toute confusion et protège la confiance.
- **Confiance.** Le site manipule des informations sensibles et touche à de l'argent : l'apparence doit être sobre, soignée et cohérente.

### 14.2 Style visuel

- Palette sobre : une couleur principale (par exemple un bleu profond ou un vert), du blanc et des gris clairs pour le fond, un rouge doux pour les erreurs, un vert pour les succès, un orange discret pour les états d'attente.
- Police système lisible (ou une police web légère), taille de base d'au moins 16 px pour éviter le zoom automatique sur mobile lors de la saisie.
- Boutons larges (hauteur d'au moins 44 px), avec un état désactivé évident.
- Cartes avec bords arrondis et légère ombre pour les plans et les blocs du panneau admin.
- Badges de statut colorés : `nouvelle` (bleu), `en_discussion` (orange), `paye` (vert), `livre` (vert foncé ou gris-vert), `annule` (gris).
- Prise en charge du mode sombre facultative ; si elle est ajoutée, elle doit rester lisible et cohérente.

Les variables CSS (couleurs, rayons, espacements) sont définies une fois sur `:root` dans `style.css` et réutilisées partout.

### 14.3 Accessibilité

- Chaque champ possède un `label` associé (attribut `for`/`id`).
- Contraste suffisant entre texte et fond.
- Les messages d'erreur sont annoncés (rôle `alert` ou `aria-live="polite"` sur la zone de message).
- Les boutons et liens sont atteignables au clavier, avec un indicateur de focus visible.
- Les champs utilisent les bons types et attributs : `type="email"` avec `autocomplete="email"`, `type="password"` avec `autocomplete="new-password"` à l'inscription et `current-password` à la connexion, `type="tel"` avec `inputmode="numeric"` pour les numéros.

### 14.4 Textes et ton

- Tutoiement ou vouvoiement : utiliser le **vouvoiement** ou une formulation neutre dans les messages d'interface, par respect et pour un rendu professionnel. Rester cohérent sur tout le site.
- Phrases courtes. Verbes d'action clairs sur les boutons : « Créer mon compte », « Se connecter », « Envoyer ma fiche », « Valider le paiement ».
- Messages d'erreur utiles et sans culpabiliser : dire ce qui ne va pas et comment corriger.
- Toute l'interface en français. Les termes techniques inutiles sont évités.

---

## 15. Gestion des erreurs et cas limites

Prévoir et traiter explicitement les situations suivantes :

1. **Réseau coupé ou lent** : afficher un message « Connexion impossible. Vérifiez votre réseau et réessayez. » ; ne jamais laisser un bouton bloqué en état « chargement » indéfiniment.
2. **Session expirée** : si une requête échoue pour cause d'authentification, rediriger vers la page de connexion avec un message.
3. **E-mail non confirmé** : message dédié à la connexion, avec un conseil de vérifier la boîte de réception et le spam.
4. **Double soumission du formulaire** : bouton désactivé pendant l'envoi ; la contrainte `unique` sur `user_id` sert de filet de sécurité.
5. **Numéro invalide** : message précis sous le champ concerné (« Entrez un numéro de 8 à 15 chiffres, avec l'indicatif du pays »).
6. **Référence de transaction déjà utilisée** (admin) : message clair, aucune modification de statut.
7. **Fiche introuvable ou supprimée pendant la consultation** : message neutre et retour à la liste.
8. **Compte non administrateur sur `/admin/`** : déconnexion et refus.
9. **Variables d'environnement manquantes** : au démarrage, `supabaseClient.js` ou la page doit afficher un message d'erreur de configuration compréhensible plutôt qu'une page blanche (en développement au minimum).
10. **Caractères spéciaux et emojis** dans les champs texte : acceptés, jamais interprétés comme du HTML.
11. **Très longs textes** : bloqués par les `maxlength` du formulaire et par les contraintes de la base.

Les erreurs techniques détaillées sont écrites dans la console du navigateur (pour le développement) mais ne sont jamais montrées telles quelles à l'utilisateur final.

---

## 16. Configuration de Supabase, pas à pas

À documenter dans la réponse finale, sous forme de courtes étapes :

1. Créer un projet sur supabase.com ; noter l'URL du projet et la clé `anon` (Paramètres > API).
2. Ouvrir **SQL Editor**, coller tout le contenu de `supabase/schema.sql` et l'exécuter.
3. **Authentication > Providers** : vérifier que le fournisseur E-mail est activé et que **« Confirm email »** est coché.
4. **Authentication > URL Configuration** : renseigner la **Site URL** (adresse locale `http://localhost:5173` pendant le développement, puis l'adresse de production) et ajouter les URL de redirection autorisées.
5. **Authentication > Policies / Settings** : définir la longueur minimale du mot de passe à 8 ou plus ; activer la protection CAPTCHA si possible.
6. Créer le compte administrateur en s'inscrivant normalement sur le site, confirmer l'e-mail, puis exécuter dans le SQL Editor l'insertion dans `admins` avec l'adresse e-mail de l'administrateur.
7. Vérifier dans **Table Editor** que les trois tables existent et que le bouton « RLS enabled » apparaît pour chacune.
8. Tester l'accès : un compte normal ne doit voir que sa propre fiche ; le compte admin doit voir toutes les fiches.

---

## 17. Installation et lancement en local (terminal)

Le propriétaire utilise Linux et le terminal. Fournir ces commandes :

```
mkdir inscription-site && cd inscription-site
# créer les fichiers du projet (un par un)
npm install
cp .env.example .env
# éditer .env avec les vraies valeurs
npm run dev
```

Le site est alors accessible sur `http://localhost:5173`. Pour produire la version de mise en ligne : `npm run build` (génère le dossier `dist/`). Pour la prévisualiser : `npm run preview`.

Si Node.js n'est pas actif dans le terminal (installation via NVM), rappeler d'exécuter `nvm use` ou `nvm install --lts` au préalable.

---

## 18. Déploiement

1. Pousser le code sur un dépôt Git (sans `.env`).
2. Connecter le dépôt à un hébergeur statique (Netlify, Vercel ou Cloudflare Pages).
3. Définir la commande de build `npm run build` et le dossier de sortie `dist`.
4. Renseigner les trois variables `VITE_...` dans les paramètres de l'hébergeur (pas dans le dépôt).
5. Mettre à jour dans Supabase la **Site URL** et les URL de redirection avec l'adresse finale.
6. Tester de bout en bout en production : création de compte, confirmation par e-mail, envoi de fiche, connexion admin, enregistrement d'un paiement, lien WhatsApp.
7. Vérifier que les pages `admin/index.html` et les autres pages multi-pages sont bien servies (selon l'hébergeur, éventuellement ajouter une règle pour les URL propres).

---

## 19. Critères d'acceptation (la définition de « terminé »)

Le projet est considéré comme terminé lorsque **tous** les points suivants sont vérifiés.

**Comptes et accès**

- [ ] Un visiteur peut créer un compte avec e-mail et mot de passe et reçoit un e-mail de confirmation.
- [ ] Sans confirmation de l'e-mail, la connexion est refusée avec un message clair.
- [ ] Un utilisateur non connecté qui ouvre `fiche.html` est redirigé vers la connexion.
- [ ] Un utilisateur non administrateur qui tente d'ouvrir `/admin/` est refusé et déconnecté.

**Fiche**

- [ ] Le formulaire contient tous les champs listés en 11.5 et le libellé du numéro de paiement change selon NatCash/MonCash.
- [ ] La case « même numéro que WhatsApp » recopie et verrouille correctement le champ.
- [ ] Les validations côté client fonctionnent et les contraintes de la base refusent les données invalides même si le navigateur est contourné.
- [ ] Après envoi, la fiche existe en base avec le statut `nouvelle`, et l'utilisateur voit sa vue de statut.
- [ ] Un utilisateur ne peut pas créer une seconde fiche (règle par défaut).
- [ ] Un utilisateur ne peut pas envoyer de `statut` autre que `nouvelle` ni de `note_admin`, même en modifiant la requête (à tester avec les outils du navigateur).

**Administration**

- [ ] L'administrateur voit toutes les fiches, triées de la plus récente à la plus ancienne, avec filtre par statut.
- [ ] Le détail affiche toutes les informations en texte sûr (test avec une saisie contenant du HTML : elle doit apparaître comme du texte, sans s'exécuter).
- [ ] Le bouton WhatsApp ouvre la bonne conversation.
- [ ] Le changement de statut et l'enregistrement de la note fonctionnent.
- [ ] Le formulaire de paiement est pré-rempli (opérateur choisi, montant du plan), refuse une référence déjà utilisée, et passe la fiche à `paye` en cas de succès.
- [ ] Le message de livraison se construit et son lien WhatsApp se met à jour ; « Marquer comme livré » passe le statut à `livre`.
- [ ] Le client voit le bon libellé et le bon message pour chaque statut.

**Sécurité**

- [ ] La RLS est activée sur les trois tables.
- [ ] Un compte client ne peut pas lire la fiche d'un autre compte (tester avec deux comptes).
- [ ] Un compte client ne peut ni lire ni écrire dans `paiements` ni dans `admins`.
- [ ] Un visiteur anonyme ne peut rien lire (tester la requête avec la clé `anon` sans session).
- [ ] Aucune clé `service_role` n'existe dans le dépôt ni dans le site.
- [ ] `.env` n'est pas versionné.

**Aide et qualité**

- [ ] Le lien « Besoin d'aide ? » est présent dans le pied de page de chaque page et mène à une page avec un lien `mailto:` fonctionnel.
- [ ] Le site est utilisable sur un petit écran de téléphone (environ 360 px de large) sans défilement horizontal.
- [ ] `npm run build` s'exécute sans erreur et toutes les pages sont générées.
- [ ] Les textes de l'interface sont tous en français, sans fautes évidentes.

---

## 20. Décisions par défaut et points ouverts

Voici les points sur lesquels le propriétaire n'a pas (encore) tranché, avec la décision à appliquer en attendant.

1. **Un compte = une seule fiche, ou plusieurs ?** Le propriétaire a répondu « on verra ça après ». **Par défaut : une seule fiche par compte** (contrainte `unique` sur `user_id`). Écrire le code de façon à ce que l'extension vers plusieurs fiches soit simple : suppression de la contrainte, liste des fiches de l'utilisateur au lieu d'une seule, formulaire accessible via un bouton « Nouvelle fiche ».
2. **Contenu détaillé des plans.** Seuls les noms et les prix sont connus (Standard 500 gourdes, Premium 650 gourdes). Prévoir des emplacements clairement balisés dans `index.html` pour que le propriétaire ajoute les avantages de chaque plan.
3. **Signification exacte des « codes du profil ».** Le propriétaire a indiqué que la personne indique le nom de son profil et « tous les codes que le profil doit contenir ». **Par défaut : un champ texte libre multiligne.** Si ces codes ont un format précis (par exemple liste d'identifiants, valeurs numériques), il faudra adapter la validation.
4. **Montant reçu et plan.** **Par défaut : le montant est pré-rempli avec le prix du plan mais modifiable** par l'administrateur, au cas où un arrangement serait convenu. Un avertissement visuel discret peut s'afficher si le montant diffère du prix du plan.
5. **Inscription par numéro de téléphone.** Écartée : elle exige un fournisseur de SMS payant. L'inscription se fait **par e-mail uniquement**.
6. **Adresse e-mail d'aide.** À fournir par le propriétaire ; en attendant, utiliser la valeur de `VITE_SUPPORT_EMAIL`.
7. **Notification de l'administrateur** quand une nouvelle fiche arrive. Non demandée. **Par défaut : aucune notification automatique** ; l'administrateur consulte le panneau. Une évolution possible est un webhook ou une fonction Supabase qui envoie un e-mail (voir section 21).
8. **Modification de la fiche par le client après envoi.** **Par défaut : impossible.** Pour une correction, le client écrit à l'aide ou à l'administrateur sur WhatsApp, et l'administrateur peut corriger la ligne via l'éditeur Supabase ou une future fonction d'édition dans le panneau.
9. **Nom du site et identité visuelle.** Non fournis. Utiliser un nom provisoire facile à remplacer, défini en un seul endroit.

Quand tu appliques une décision par défaut, **mentionne-la brièvement dans ta réponse** pour que le propriétaire puisse la corriger.

---

## 21. Évolutions possibles (hors périmètre de la première version)

À ne **pas** implémenter maintenant, mais à garder en tête pour ne pas fermer la porte :

- plusieurs fiches par compte ;
- mot de passe oublié (`resetPasswordForEmail`) ;
- notification par e-mail à l'administrateur lors d'une nouvelle fiche (fonction Edge Supabase ou webhook de base de données) ;
- recherche par nom ou numéro dans le panneau admin ;
- pagination ou chargement progressif quand le nombre de fiches grandit ;
- export CSV des fiches et des paiements ;
- tableau de bord de statistiques (nombre de fiches par statut, total encaissé, répartition NatCash/MonCash) ;
- journal d'audit (qui a changé quel statut, et quand) ;
- édition d'une fiche par l'administrateur depuis le panneau ;
- interface en créole haïtien en complément du français ;
- mode sombre ;
- plusieurs administrateurs avec des droits différents.

---

## 22. Consignes de livraison : comment tu dois me répondre

C'est la partie qui détermine la qualité de ton travail visible. Respecte-la scrupuleusement.

1. **Livre les fichiers un par un**, chacun dans son propre bloc de code, avec le **chemin complet** du fichier en titre juste au-dessus (par exemple `src/common.js`). Chaque fichier doit être **complet** et prêt à être copié-collé tel quel : aucune ellipse du type « le reste est identique », aucun « à compléter ».
2. **Ordre de livraison conseillé** : `package.json`, `.gitignore`, `.env.example`, `vite.config.js`, `supabase/schema.sql`, `src/supabaseClient.js`, `src/common.js`, `css/style.css`, `index.html`, `signup.html`, `login.html`, `src/auth.js`, `fiche.html`, `src/fiche.js`, `aide.html`, `src/aide.js`, `admin/index.html`, `src/admin.js`.
3. **Privilégie les solutions simples et en peu d'étapes**, utilisables depuis le terminal. Quand une action est possible en ligne de commande, donne la commande.
4. **Pas de dépendances inutiles.** Les seules dépendances sont `@supabase/supabase-js` et `vite`. Si tu veux en ajouter une, justifie-le.
5. **Commente le code avec parcimonie**, en français, uniquement là où l'intention n'est pas évidente (par exemple pourquoi on utilise `textContent`).
6. **Après la livraison des fichiers**, donne une courte checklist : configuration Supabase, installation, lancement, création du compte admin, premiers tests.
7. **Signale clairement** toute décision par défaut appliquée (section 20) et toute hypothèse faite.
8. **Ne prétends pas** que quelque chose est testé si tu ne l'as pas exécuté. Dis ce qui a été vérifié et ce qui reste à vérifier par le propriétaire.
9. **Ne mets jamais de secret réel** (clés, mots de passe, adresses privées) dans le code ou les exemples.
10. **Reste cohérent** : les noms de tables, de colonnes, de statuts, de champs de formulaire et de constantes doivent être identiques partout (base, JavaScript, HTML). Une incohérence de nom est la cause d'erreur la plus fréquente : fais une relecture finale dédiée à ce point.

---

## 23. Liste de vérification finale avant de répondre

Avant d'envoyer ta réponse, relis ces points :

- Les noms de colonnes de `schema.sql` correspondent-ils exactement aux champs utilisés dans `fiche.js` et `admin.js` ?
- Les valeurs de statut (`nouvelle`, `en_discussion`, `paye`, `livre`, `annule`) sont-elles identiques dans la base, dans `STATUTS` et dans les sélecteurs HTML ?
- Les valeurs d'opérateur (`natcash`, `moncash`) et de plan (`standard`, `premium`) sont-elles identiques partout ?
- Aucune donnée venant d'un utilisateur n'est insérée avec `innerHTML` ?
- Le navigateur n'envoie-t-il jamais de `statut`, de `note_admin` ni de prix lors de la création d'une fiche ?
- Les numéros sont-ils normalisés (chiffres uniquement) avant l'envoi et avant la construction des liens `wa.me` ?
- La clé `service_role` est-elle absente de tout le projet ?
- Chaque page contient-elle le lien d'aide dans le pied de page ?
- Les pages sont-elles toutes déclarées dans `vite.config.js` ?
- Les textes visibles sont-ils en français, cohérents dans le vouvoiement, et sans promesse de paiement en ligne ?
- Les décisions par défaut sont-elles signalées à la fin de la réponse ?

---

## 24. Rappel de l'esprit du projet

Le propriétaire veut un outil **simple, fiable et sûr**, qu'il peut comprendre, héberger et faire évoluer seul. Le site ne cherche pas à tout automatiser : il cherche à **recevoir proprement les demandes, à les protéger dans une vraie base de données, et à donner à l'administrateur un panneau clair pour les traiter**, avec WhatsApp comme canal de relation et NatCash/MonCash comme moyens de paiement, hors du site. Chaque décision technique doit servir ces trois objectifs : la simplicité, la sécurité des données et la clarté du parcours, aussi bien pour le client que pour l'administrateur.

Commence maintenant. Livre d'abord un court plan de ce que tu vas produire, puis les fichiers, un par un, dans l'ordre indiqué en section 22.
