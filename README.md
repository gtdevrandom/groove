# Groove

**Une bibliothèque musicale web, responsive et installable, propulsée par YouTube.**

Groove est une application front-end statique écrite en HTML, CSS et JavaScript natifs. Elle permet de rechercher des vidéos, de les lire dans le lecteur YouTube officiel et d'organiser une bibliothèque personnelle dans le navigateur.

> **À savoir :** Groove est un projet indépendant, sans affiliation avec YouTube ou Google. Il ne télécharge ni n'extrait les fichiers audio. La lecture reste soumise au lecteur YouTube, à la disponibilité de la vidéo, à la connexion et aux règles du navigateur.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Démarrage rapide](#démarrage-rapide)
- [Recherche YouTube et clé API](#recherche-youtube-et-clé-api)
- [Déploiement sur GitHub Pages](#déploiement-sur-github-pages)
- [Installer sur téléphone](#installer-sur-téléphone)
- [Données et confidentialité](#données-et-confidentialité)
- [Fonctionnement hors ligne et limites](#fonctionnement-hors-ligne-et-limites)
- [Structure des fichiers](#structure-des-fichiers)
- [Dépannage](#dépannage)
- [Contribuer](#contribuer)
- [Licence et attribution](#licence-et-attribution)

## Fonctionnalités

- Accueil avec une sélection de démonstration et les titres récemment écoutés.
- Recherche dans une sélection locale de démonstration ou dans YouTube avec YouTube Data API v3.
- Lecteur YouTube intégré avec lecture, pause, titre précédent/suivant, volume, progression, aléatoire et répétition.
- Bibliothèque locale : titres likés, historique et playlists personnalisées.
- Statistiques locales : temps d'écoute, activité des sept derniers jours, démarrages de lecture et titres les plus écoutés.
- Commandes de lecture et métadonnées via Media Session sur les navigateurs compatibles.
- Interface responsive, manifeste PWA et service worker pour l'installation et la mise en cache de l'application.
- Aucune compilation, aucun framework et aucune dépendance à installer.

## Démarrage rapide

### Prérequis

- Un navigateur récent.
- Python 3, Node.js ou un autre serveur HTTP statique pour le développement local. Python est utilisé dans l'exemple ci-dessous.
- Une connexion internet pour la recherche YouTube, les vidéos intégrées et les polices distantes. La sélection de démonstration est disponible sans clé API.

### Lancer en local

Dans PowerShell, depuis le dossier du projet :

```powershell
python -m http.server 8000
```

Ouvrez ensuite <http://localhost:8000>. Gardez la fenêtre du serveur ouverte pendant vos essais ; `Ctrl+C` l'arrête.

Le service worker et l'installation PWA ne fonctionnent pas en ouvrant directement `index.html` avec une adresse `file://`. Utilisez `localhost` ou un site servi en HTTPS.

### Essayer sans clé API

1. Ouvrez l'onglet **Recherche**.
2. Saisissez, par exemple, `Adele` ou `Alan Walker`.
3. Lancez une vidéo de la sélection de démonstration.
4. Utilisez le cœur du lecteur, **Bibliothèque** et **Stats** pour essayer favoris, playlists et statistiques.

La sélection de démonstration ne contient qu'un nombre limité de vidéos. Une vidéo peut devenir indisponible, être restreinte par région ou ne pas autoriser la lecture intégrée.

## Recherche YouTube et clé API

La recherche des vidéos publiques utilise **YouTube Data API v3**. Une connexion OAuth à un compte YouTube n'est pas nécessaire pour cette recherche et ne remplace pas la clé API des requêtes publiques.

### Créer une clé

1. Ouvrez la [Google Cloud Console – Identifiants](https://console.cloud.google.com/apis/credentials) et créez ou sélectionnez un projet.
2. Dans **API et services → Bibliothèque**, activez **YouTube Data API v3**.
3. Dans **Identifiants**, créez une **clé API**.
4. Dans les paramètres de la clé, restreignez les API à YouTube Data API v3 et limitez les référents HTTP à vos origines. Pour les essais locaux, ajoutez par exemple `http://localhost:8000/*`. Une fois le site publié, ajoutez votre URL GitHub Pages, par exemple `https://VOTRE-NOM.github.io/*`.
5. Dans Groove, ouvrez **Paramètres**, collez la clé puis enregistrez.

La clé saisie dans l'application est conservée dans le `localStorage` de ce navigateur. Une clé API incluse dans une application front-end est visible par les visiteurs : elle n'est pas un secret. Ne publiez jamais de mot de passe, de clé privée ou de secret OAuth dans ce dépôt. Les restrictions de référent et de service dans Google Cloud limitent l'utilisation abusive, mais ne rendent pas la clé secrète.

Google peut demander la configuration de l'écran de consentement selon les fonctionnalités et le type d'identifiants utilisés. L'application n'utilise pas OAuth pour sa recherche publique actuelle.

### Quota et erreurs API

Les appels YouTube Data API consomment le quota du projet Google Cloud. Une recherche peut faire plus d'un appel pour obtenir la durée des vidéos. Les erreurs de quota, de clé invalide et d'API non activée sont affichées dans l'application. Vous pouvez revenir à la sélection démo dans **Paramètres**.

## Déploiement sur GitHub Pages

Groove est statique : aucune étape de compilation ni dépendance n'est requise.

1. Envoyez les fichiers du projet vers un dépôt GitHub.
2. Ouvrez **Settings → Pages** dans le dépôt.
3. Dans **Build and deployment**, choisissez **Deploy from a branch**.
4. Sélectionnez la branche `main` et le dossier `/ (root)`, puis enregistrez.
5. Attendez la publication et ouvrez l'URL affichée par GitHub Pages.
6. Dans Google Cloud, ajoutez cette URL aux référents autorisés de la clé API.

Les références relatives (`./app.js`, `./sw.js`, `./manifest.json`) permettent le déploiement à la racine d'un domaine GitHub Pages ou dans un sous-chemin de dépôt, par exemple `https://VOTRE-NOM.github.io/NOM-DU-DEPOT/`.

Après publication d'une nouvelle version, le service worker se met à jour. Si l'ancienne version semble rester en cache, rechargez le site après avoir vérifié que la mise à jour est bien publiée.

## Installer sur téléphone

Publiez l'application en HTTPS, ouvrez-la dans le navigateur du téléphone, puis choisissez **Ajouter à l'écran d'accueil** (ou l'option équivalente du navigateur). Le manifeste fournit le nom, les couleurs et l'icône de l'application.

Media Session peut afficher les titres et les commandes de lecture sur l'écran verrouillé lorsque le navigateur et le système le prennent en charge. La lecture écran éteint n'est pas garantie : iOS/Safari, Android, les politiques de lecture en arrière-plan, les codecs et YouTube peuvent suspendre ou arrêter un lecteur intégré. Une page web ne peut pas forcer le système à maintenir cette lecture active.

## Données et confidentialité

Groove n'a pas de serveur ni de compte utilisateur intégré. Les préférences et la bibliothèque sont stockées dans le `localStorage` du navigateur sur l'appareil courant :

- clé API configurée ;
- titres likés ;
- playlists ;
- historique récent ;
- statistiques d'écoute.

Ces données ne sont ni synchronisées entre appareils ni sauvegardées dans un compte. Effacer les données du site dans le navigateur les supprime. La clé API reste visible dans les outils du navigateur et doit être restreinte dans Google Cloud.

La recherche avec une clé transmet le terme recherché et la clé à l'API Google/YouTube. La lecture charge le lecteur et, éventuellement, les miniatures depuis YouTube. Les polices sont chargées depuis Google Fonts lorsqu'une connexion est disponible. Consultez les politiques de Google/YouTube pour les détails relatifs à ces services externes.

Les statistiques mesurent les changements de position rapportés par le lecteur pendant l'utilisation de Groove. Elles ne récupèrent pas l'historique du compte YouTube, ne comptent pas précisément le son réellement entendu et ne se synchronisent pas avec d'autres appareils.

## Fonctionnement hors ligne et limites

Le service worker met en cache les fichiers de l'application. Une fois la page chargée et le cache installé, l'interface et les données locales peuvent rester accessibles hors ligne. La recherche API, les miniatures distantes et la lecture YouTube nécessitent une connexion ; la lecture de vidéos n'est pas disponible hors ligne.

La lecture doit passer par le lecteur YouTube officiel. Groove ne contourne pas les restrictions d'intégration, les contrôles d'accès, les limites régionales ou les fonctionnalités payantes de YouTube. Certaines vidéos ne sont pas intégrables, et le comportement de la lecture en arrière-plan dépend du navigateur et de YouTube.

## Structure des fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure des vues, navigation, lecteur et boîtes de dialogue. |
| `style.css` | Thème, composants et mises en page responsive. |
| `app.js` | Recherche, lecture YouTube, bibliothèque, statistiques et persistance locale. |
| `manifest.json` | Métadonnées de l'application installable. |
| `sw.js` | Cache du shell de l'application via service worker. |
| `icon.svg` | Icône utilisée par le site et le manifeste. |
| `LICENSE` | Licence MIT du code de ce projet. |
| `INFO.md` | Résumé des informations et limites du projet. |

## Dépannage

### La page s'ouvre, mais le service worker ne s'installe pas

Vérifiez que le site est servi par `http://localhost` ou HTTPS. Le service worker n'est pas disponible sur une page `file://`.

### La recherche YouTube affiche une erreur

Vérifiez la clé dans **Paramètres**, l'activation de YouTube Data API v3, les restrictions de référent et le quota de votre projet Google Cloud. Revenez en mode démo pour confirmer que le reste de l'application fonctionne.

### Une vidéo ne se lance pas

Essayez une autre vidéo. Elle peut être privée, indisponible, restreinte par région ou non intégrable. Vérifiez aussi la connexion et les éventuels messages du lecteur YouTube.

### La musique s'arrête lorsque l'écran se verrouille

Media Session fournit des commandes lorsque c'est pris en charge, mais ne garantit pas la lecture continue d'un lecteur YouTube intégré. Testez sur HTTPS et avec l'application ajoutée à l'écran d'accueil ; les règles du système et du navigateur restent applicables.

### Les changements du site n'apparaissent pas

Assurez-vous que le déploiement GitHub Pages est terminé, puis rechargez le site. Si nécessaire, fermez et rouvrez l'application installée afin que son service worker récupère la nouvelle version.

## Contribuer

Les corrections et améliorations sont les bienvenues. Pour proposer un changement :

1. Créez une branche dédiée.
2. Gardez les modifications ciblées et testez-les dans un navigateur moderne.
3. Vérifiez au minimum le JavaScript et les vues desktop/mobile.
4. Ouvrez une pull request en décrivant le problème et les changements.

N'ajoutez pas de clés API personnelles, secrets OAuth ou données privées aux commits.

## Licence et attribution

Le code source de Groove est distribué sous licence [MIT](./LICENSE). La licence ne s'étend pas aux vidéos, marques, API, polices ni autres ressources appartenant à des tiers. YouTube et Google sont des marques de leurs propriétaires ; Groove n'est ni affilié à YouTube ni approuvé par Google.
