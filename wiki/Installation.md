# Installation

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- Node.js 18+ (uniquement si tu veux lancer le bot hors Docker en développement)
- Un compte Discord avec les droits pour créer une application/bot et un serveur où tu es administrateur

## 1. Créer l'application Discord

1. Va sur https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le token (`DISCORD_TOKEN`).
3. Toujours dans **Bot**, laisse les intents par défaut (le **Server Members Intent** n'est pas nécessaire).
4. Onglet **OAuth2 → General** → copie le **Client ID** (`DISCORD_CLIENT_ID`).
5. Onglet **OAuth2 → URL Generator** : coche `bot` + `applications.commands`, puis dans les permissions coche au minimum `Connect`, `Speak`, `Send Messages`, `Embed Links`, `Use Slash Commands`. Copie le lien généré et ouvre-le pour inviter le bot sur ton serveur Discord.

## 2. Créer l'app Spotify (gratuit, pour la recherche uniquement)

1. https://developer.spotify.com/dashboard → **Create app**.
2. Une fois créée, récupère **Client ID** et **Client Secret** (`SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`).

Ces identifiants servent uniquement à résoudre les métadonnées (titre, artiste, playlist) — la lecture audio réelle vient toujours de YouTube. Voir la page [Home](Home) pour le détail du fonctionnement multi-source.

## 3. Configurer l'environnement

> ⚠️ Le fichier `.env` contient tes secrets (token du bot, clés API). Il est volontairement exclu du dépôt Git et n'est donc **pas fourni** — tu dois le créer toi-même à partir de `.env.example`. Ne le commite jamais et ne le partage à personne : quiconque possède ton `DISCORD_TOKEN` peut prendre le contrôle total de ton bot.

```bash
cp .env.example .env
```

Contenu attendu :

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

# --- Spotify ---
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# --- Réglages par défaut du bot ---
DEFAULT_VOLUME=80
# IDs Discord (séparés par des virgules) autorisés à contourner les vérifications DJ partout.
BOT_OWNER_IDS=
```

Astuce : pendant le développement, renseigne `DEV_GUILD_ID` (clic droit sur ton serveur → Copier l'ID, avec le mode développeur activé) pour que les commandes slash apparaissent instantanément.

## 4. Lancer avec Docker

```bash
docker compose up -d --build
```

Ça démarre Lavalink (téléchargement automatique des plugins au premier lancement) puis le bot.

```bash
docker compose logs -f
```

## 5. Déployer les commandes slash

```bash
cd bot
npm install
npm run deploy-commands
```

Un seul `npm run deploy-commands` suffit après chaque ajout/modification de commande.

## Développement local (sans Docker pour le bot)

```bash
docker compose up -d lavalink   # uniquement Lavalink en conteneur
cd bot
npm install
npm run dev                     # bot en TypeScript avec rechargement à chaud
```

---
Suite : [Commandes](Commandes) · [Dépannage / FAQ](Depannage-FAQ)
