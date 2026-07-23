# 🎵 SMusicBot

[![Licence](https://img.shields.io/badge/licence-propri%C3%A9taire-red)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2)](https://discord.js.org)

Bot musique Discord complet, dans l'esprit de [JMusicBot (jagrosh)](https://github.com/jagrosh/MusicBot) : recherche et lecture depuis **YouTube, YouTube Music, Spotify, Apple Music et Deezer**, file d'attente, playlists persistantes, rôle DJ, mode 24/7, autoplay. Prêt à déployer via Docker sur n'importe quel serveur Discord.

> SMusicBot est aujourd'hui disponible sous licence commerciale pour équiper votre propre serveur.

---

## ⚖️ Logiciel commercial — pas open source

**Ce dépôt n'est pas un projet open source.** Le code source est protégé et distribué sous une [licence propriétaire](LICENSE) : toute reproduction, modification, redistribution ou revente sans autorisation écrite préalable est interdite.

Pour acquérir une licence d'utilisation, obtenir de l'aide sur une installation existante, ou discuter d'un besoin spécifique (branding, fonctionnalités sur mesure) :

📧 **Contact / achat de licence : [sebastienb122@gmail.com](mailto:sebastienb122@gmail.com)**

---

## ✨ Fonctionnalités

- 🔊 **Multi-source** : YouTube, YouTube Music, Spotify, Apple Music, Deezer
- 📜 **File d'attente complète** : pagination, boucle (musique/file), shuffle, seek
- 💾 **Playlists persistantes** par serveur (sauvegarde/chargement en base SQLite)
- 🎚️ **Rôle DJ** configurable, avec vote à la majorité pour les non-DJ
- 🌙 **Mode 24/7** et **autoplay**
- 🎛️ **Now playing interactif** avec boutons de contrôle
- 🐳 **Déploiement Docker** clé en main (bot + Lavalink dans deux conteneurs)
- ⚙️ **Réglages par serveur** (DJ role, 24/7, autoplay) via `/settings`

## Comment ça marche (important à comprendre)

Spotify, Apple Music et Deezer sont protégés par DRM et **n'exposent aucune API publique pour streamer de l'audio brut** à des applications tierces. Aucun bot ne peut légalement "streamer directement" depuis ces plateformes. La pratique standard (utilisée par tous les bots musique sérieux aujourd'hui) est donc :

1. Le lien/la recherche est envoyé à la plateforme d'origine (Spotify, Apple Music ou Deezer) **uniquement pour récupérer les métadonnées** (titre, artiste, playlist, album) via leurs API officielles/publiques.
2. Le bot recherche ensuite la musique correspondante sur **YouTube** et c'est cette source qui est réellement streamée dans le salon vocal.

Concrètement :
- **YouTube / YouTube Music** : lecture native, streaming direct.
- **Spotify** : résolution via l'API Web officielle et gratuite ([developer.spotify.com](https://developer.spotify.com/dashboard)), lecture via YouTube.
- **Apple Music** : résolution via le plugin LavaSrc (pas de clé requise), lecture via YouTube.
- **Deezer** : résolution via l'API publique et sans clé de Deezer (`api.deezer.com`), lecture via YouTube. Le bot n'implémente **volontairement pas** le déchiffrement des flux Deezer (technique reverse-engineered qui viole les CGU de Deezer) — voir [bot/src/utils/deezer.ts](bot/src/utils/deezer.ts).
- **"Google Music"** n'existe plus depuis 2020 (remplacé par YouTube Music) ; c'est donc couvert par YouTube Music ci-dessus.

## Stack technique

- **Bot** : Node.js 20 + TypeScript + [discord.js](https://discord.js.org/) v14 + [lavalink-client](https://github.com/Tomato6966/lavalink-client)
- **Moteur audio** : [Lavalink](https://github.com/lavalink-devs/Lavalink) v4 (serveur séparé, gère la connexion vocale Discord et le décodage audio)
- **Plugins Lavalink** : [youtube-source](https://github.com/lavalink-devs/youtube-source) (lecture YouTube) + [LavaSrc](https://github.com/topi314/LavaSrc) (résolution Spotify/Apple Music)
- **Base de données** : SQLite (`better-sqlite3`) pour les réglages par serveur et les playlists sauvegardées
- **Déploiement** : Docker Compose (bot + Lavalink dans deux conteneurs sur un réseau privé)

## Installation

### 1. Créer l'application Discord

1. Va sur https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le token (`DISCORD_TOKEN`).
3. Toujours dans **Bot**, active **Server Members Intent** n'est pas nécessaire ici, mais laisse les autres par défaut.
4. Onglet **OAuth2 → General** → copie le **Client ID** (`DISCORD_CLIENT_ID`).
5. Onglet **OAuth2 → URL Generator** : coche `bot` + `applications.commands`, puis dans les permissions coche au minimum `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Use Slash Commands`. Copie le lien généré et ouvre-le pour inviter le bot sur ton serveur Discord.

### 2. Créer l'app Spotify (gratuit, pour la recherche uniquement)

1. https://developer.spotify.com/dashboard → **Create app**.
2. Une fois créée, récupère **Client ID** et **Client Secret** (`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`).

### 3. Configurer l'environnement

> ⚠️ Le fichier `.env` contient tes secrets (token du bot, clés API) : il est volontairement exclu du dépôt via `.gitignore` et n'est donc **pas fourni**. Tu dois le créer toi-même à partir de `.env.example` :

```bash
cp .env.example .env
```

Voici le contenu attendu (déjà présent dans `.env.example`) et le rôle de chaque variable :

```dotenv
# --- Discord ---
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
# Optionnel : renseigne-le pendant le dev pour un déploiement instantané des commandes slash
# (elles n'apparaissent que sur ce serveur). Laisse vide pour un déploiement global (jusqu'à 1h).
DEV_GUILD_ID=

# --- Lavalink ---
# Chaîne aléatoire forte, doit être identique côté bot et côté Lavalink.
LAVALINK_PASSWORD=changeme_use_a_strong_random_password
LAVALINK_HOST=lavalink
LAVALINK_PORT=2333
LAVALINK_SECURE=false

# --- Spotify (API Web officielle, gratuite sur https://developer.spotify.com/dashboard) ---
# Utilisée uniquement pour rechercher/résoudre les métadonnées (titre, artiste, playlist).
# La lecture audio est toujours streamée depuis YouTube : l'API Spotify ne fournit jamais
# d'audio (protection DRM).
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# --- Réglages par défaut du bot ---
DEFAULT_VOLUME=80
# IDs Discord (séparés par des virgules) autorisés à contourner les vérifications DJ partout.
BOT_OWNER_IDS=
```

Remplis `.env` avec les valeurs récupérées ci-dessus (`DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`) et choisis un mot de passe fort pour `LAVALINK_PASSWORD`.

Ne commite jamais ce fichier et ne le partage à personne : quiconque possède ton `DISCORD_TOKEN` peut prendre le contrôle total de ton bot.

Astuce : pendant le développement, renseigne aussi `DEV_GUILD_ID` (l'ID de ton serveur Discord, clic droit sur le serveur → Copier l'ID avec le mode développeur activé) pour que les commandes slash apparaissent instantanément au lieu d'attendre jusqu'à 1h pour un déploiement global.

### 4. Lancer avec Docker

```bash
docker compose up -d --build
```

Ça démarre Lavalink (avec téléchargement automatique des plugins au premier lancement) puis le bot. Vérifie les logs :

```bash
docker compose logs -f
```

### 5. Déployer les commandes slash

```bash
cd bot
npm install
npm run deploy-commands
```

(Un seul `npm run deploy-commands` suffit après chaque ajout/modification de commande — pas besoin de le relancer à chaque démarrage.)

## Développement local (sans Docker pour le bot)

```bash
docker compose up -d lavalink   # uniquement Lavalink en conteneur
cd bot
npm install
npm run dev                     # bot en TypeScript avec rechargement à chaud
```

## Commandes

| Commande | Description |
|---|---|
| `/play recherche [source]` | Joue/ajoute une musique (URL ou recherche) depuis YouTube, YouTube Music, Spotify, Apple Music ou Deezer |
| `/pause`, `/resume`, `/stop` | Contrôle de lecture |
| `/skip` | Passe la musique (immédiat pour un DJ, vote à la majorité sinon) |
| `/queue [page]` | Affiche la file d'attente |
| `/nowplaying` | Affiche la musique en cours avec boutons de contrôle |
| `/volume niveau` | Règle le volume (0-150%) |
| `/loop mode` | Boucle : off / musique / file |
| `/shuffle` | Mélange la file d'attente |
| `/remove position` | Retire une musique de la file |
| `/clear` | Vide la file d'attente |
| `/seek position` | Avance/recule dans la musique (`1:30` ou `90`) |
| `/join`, `/leave` | Rejoindre / quitter le salon vocal |
| `/playlist save\|load\|list\|delete` | Playlists personnelles sauvegardées par serveur |
| `/settings dj-role\|24-7\|autoplay\|view` | Réglages serveur (nécessite la permission "Gérer le serveur") |

### Rôle DJ

Sans rôle DJ configuré (`/settings dj-role`), tout le monde peut contrôler la musique. Une fois un rôle DJ défini, seuls les membres avec ce rôle, les admins, ou la personne seule avec le bot dans le vocal peuvent pause/skip/stop/etc. — les autres membres doivent utiliser le vote via `/skip`.

## Structure du projet

```
musiquebot/
├── docker-compose.yml
├── .env.example
├── LICENSE
├── lavalink/
│   └── application.yml        # config Lavalink + plugins (youtube-source, LavaSrc)
└── bot/
    ├── Dockerfile
    ├── src/
    │   ├── index.ts            # point d'entrée
    │   ├── deploy-commands.ts  # enregistrement des slash commands
    │   ├── config.ts
    │   ├── database/           # SQLite (réglages serveur, playlists)
    │   ├── lavalink/           # LavalinkManager + events lecture
    │   ├── commands/
    │   │   ├── music/
    │   │   ├── playlist/
    │   │   └── settings/
    │   ├── events/              # ready, interactionCreate, voiceStateUpdate
    │   ├── handlers/            # chargement auto des commandes/events
    │   └── utils/                # embeds, permissions, Deezer, guards
    └── data/                     # base SQLite persistée (montée en volume Docker)
```

## Dépannage

- **Le bot ne rejoint pas le vocal / erreur "node not connected"** : vérifie que le conteneur `lavalink` est bien démarré et healthy (`docker compose ps`), et que `LAVALINK_PASSWORD` est identique dans `.env` et pris en compte par `lavalink/application.yml`.
- **YouTube bloque la lecture ("This video is unavailable")** : YouTube change régulièrement ses protections anti-bot. Mets à jour la version du plugin `youtube-source` dans `lavalink/application.yml`, ou active l'OAuth du plugin (voir sa doc) si le blocage persiste.
- **Spotify/Apple Music ne retournent rien** : vérifie `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` dans `.env`, et regarde les logs `docker compose logs lavalink` pour une erreur d'authentification.

## Licence

© 2026 Sébastien Blanc. Tous droits réservés.

Ce logiciel est distribué sous licence commerciale propriétaire — voir [LICENSE](LICENSE) pour les conditions complètes. Toute reproduction, modification, redistribution ou revente sans autorisation écrite préalable est strictement interdite.

Pour toute demande de licence, support ou personnalisation : **[sebastienb122@gmail.com](mailto:sebastienb122@gmail.com)**
