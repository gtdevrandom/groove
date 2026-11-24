# Informations sur Groove

| Élément | Information |
| --- | --- |
| Type de projet | Application web statique et PWA |
| Langues et technologies | HTML5, CSS3, JavaScript ES6+ |
| Dépendances à installer | Aucune |
| Hébergement compatible | GitHub Pages ou tout hébergeur statique HTTPS |
| Stockage utilisateur | `localStorage`, dans le navigateur courant |
| Recherche vidéo | YouTube Data API v3 avec clé facultative et mode démo |
| Lecture vidéo | Lecteur YouTube IFrame officiel |
| Licence du code | MIT, voir [`LICENSE`](./LICENSE) |

## Points importants

- L'application est indépendante et n'est pas affiliée à Google ou YouTube.
- Une clé API saisie dans le navigateur est visible ; restreignez-la dans Google Cloud et ne publiez aucun secret OAuth.
- Les données locales ne sont pas synchronisées entre appareils.
- Les statistiques sont une estimation de la progression rapportée par le lecteur et ne représentent pas nécessairement le son entendu.
- L'installation PWA et le service worker nécessitent `localhost` en développement ou HTTPS en production.
- La lecture écran éteint ou verrouillé dépend du navigateur, du système et des règles YouTube ; elle n'est pas garantie par une application web statique.

Pour les instructions complètes de lancement, de configuration, de déploiement et de dépannage, consultez le [`README.md`](./README.md).
