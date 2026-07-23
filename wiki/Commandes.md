# Commandes

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

## Rôle DJ

Sans rôle DJ configuré (`/settings dj-role`), tout le monde peut contrôler la musique.

Une fois un rôle DJ défini, seuls peuvent pause/skip/stop/etc. sans restriction :
- les membres avec le rôle DJ,
- les administrateurs du serveur,
- la personne seule avec le bot dans le salon vocal.

Les autres membres doivent passer par le vote à la majorité via `/skip`.

## Playlists

Les playlists sont sauvegardées par serveur et par propriétaire (`owner_id`) dans la base SQLite locale au conteneur bot (`bot/data/`). Elles ne sont donc pas partagées entre plusieurs déploiements/serveurs à moins de partager le même volume de données.

---
Voir aussi : [Installation](Installation) · [Dépannage / FAQ](Depannage-FAQ)
