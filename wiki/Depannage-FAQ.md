# Dépannage / FAQ

## Le bot ne rejoint pas le vocal / erreur "node not connected"

Vérifie que le conteneur `lavalink` est bien démarré et *healthy* :

```bash
docker compose ps
```

Vérifie aussi que `LAVALINK_PASSWORD` est identique dans `.env` et dans `lavalink/application.yml`.

## YouTube bloque la lecture ("This video is unavailable")

YouTube change régulièrement ses protections anti-bot. Mets à jour la version du plugin `youtube-source` dans `lavalink/application.yml`, ou active l'OAuth du plugin (voir sa documentation) si le blocage persiste.

## Spotify / Apple Music ne retournent rien

Vérifie `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` dans `.env`, et consulte les logs :

```bash
docker compose logs lavalink
```

pour repérer une éventuelle erreur d'authentification.

## Les commandes slash n'apparaissent pas

- As-tu bien exécuté `npm run deploy-commands` après avoir démarré le bot ?
- En développement, renseigne `DEV_GUILD_ID` dans `.env` pour un déploiement instantané limité à ton serveur — sans cela, le déploiement global peut prendre jusqu'à 1h pour se propager.

## Le bot répond mais ne joue aucun son

- Vérifie que le bot a bien les permissions `Connect` et `Speak` sur le salon vocal.
- Vérifie que Lavalink est en état *healthy* (`docker compose ps`) et que les plugins (`youtube-source`, `LavaSrc`) se sont bien téléchargés au premier démarrage (`docker compose logs lavalink`).

## Comment sauvegarder mes données (playlists, réglages) entre deux mises à jour ?

Les données SQLite sont montées en volume Docker (`bot/data/`), en dehors du conteneur — elles survivent donc à un `docker compose up -d --build`. Ne supprime pas ce dossier sans sauvegarde si tu veux conserver playlists et réglages.

---
Rien trouvé ? Contacte **sebastienb122@gmail.com** — voir [Licence et achat](Licence-et-Achat) pour les conditions de support.
