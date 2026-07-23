import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "smusicbot.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id        TEXT PRIMARY KEY,
    dj_role_id      TEXT,
    twenty_four_seven INTEGER NOT NULL DEFAULT 0,
    autoplay        INTEGER NOT NULL DEFAULT 0,
    default_volume  INTEGER NOT NULL DEFAULT 80
  );

  CREATE TABLE IF NOT EXISTS playlists (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id    TEXT NOT NULL,
    owner_id    TEXT NOT NULL,
    name        TEXT NOT NULL,
    created_at  INTEGER NOT NULL,
    UNIQUE(guild_id, owner_id, name)
  );

  CREATE TABLE IF NOT EXISTS playlist_tracks (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id   INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    encoded       TEXT NOT NULL,
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    uri           TEXT,
    duration_ms   INTEGER NOT NULL DEFAULT 0,
    position      INTEGER NOT NULL
  );
`);

export interface GuildSettings {
  guild_id: string;
  dj_role_id: string | null;
  twenty_four_seven: number;
  autoplay: number;
  default_volume: number;
}

const getSettingsStmt = db.prepare<{ guildId: string }, GuildSettings>(
  "SELECT * FROM guild_settings WHERE guild_id = @guildId",
);
const insertSettingsStmt = db.prepare(
  "INSERT INTO guild_settings (guild_id, default_volume) VALUES (?, ?)",
);

export function getGuildSettings(guildId: string, defaultVolume: number): GuildSettings {
  let row = getSettingsStmt.get({ guildId });
  if (!row) {
    insertSettingsStmt.run(guildId, defaultVolume);
    row = getSettingsStmt.get({ guildId });
  }
  return row as GuildSettings;
}

export function setDjRole(guildId: string, roleId: string | null, defaultVolume: number): void {
  getGuildSettings(guildId, defaultVolume);
  db.prepare("UPDATE guild_settings SET dj_role_id = ? WHERE guild_id = ?").run(roleId, guildId);
}

export function setTwentyFourSeven(guildId: string, enabled: boolean, defaultVolume: number): void {
  getGuildSettings(guildId, defaultVolume);
  db.prepare("UPDATE guild_settings SET twenty_four_seven = ? WHERE guild_id = ?").run(
    enabled ? 1 : 0,
    guildId,
  );
}

export function setAutoplay(guildId: string, enabled: boolean, defaultVolume: number): void {
  getGuildSettings(guildId, defaultVolume);
  db.prepare("UPDATE guild_settings SET autoplay = ? WHERE guild_id = ?").run(
    enabled ? 1 : 0,
    guildId,
  );
}

export interface PlaylistTrackRow {
  encoded: string;
  title: string;
  author: string;
  uri: string | null;
  duration_ms: number;
  position: number;
}

export interface PlaylistRow {
  id: number;
  guild_id: string;
  owner_id: string;
  name: string;
  created_at: number;
}

export function createPlaylist(
  guildId: string,
  ownerId: string,
  name: string,
  tracks: Omit<PlaylistTrackRow, "position">[],
): PlaylistRow {
  const insertPlaylist = db.prepare(
    "INSERT INTO playlists (guild_id, owner_id, name, created_at) VALUES (?, ?, ?, ?)",
  );
  const insertTrack = db.prepare(
    "INSERT INTO playlist_tracks (playlist_id, encoded, title, author, uri, duration_ms, position) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const tx = db.transaction(() => {
    const info = insertPlaylist.run(guildId, ownerId, name, Date.now());
    const playlistId = info.lastInsertRowid as number;
    tracks.forEach((t, i) => {
      insertTrack.run(playlistId, t.encoded, t.title, t.author, t.uri, t.duration_ms, i);
    });
    return playlistId;
  });

  const playlistId = tx();
  return db.prepare("SELECT * FROM playlists WHERE id = ?").get(playlistId) as PlaylistRow;
}

export function deletePlaylist(guildId: string, ownerId: string, name: string): boolean {
  const info = db
    .prepare("DELETE FROM playlists WHERE guild_id = ? AND owner_id = ? AND name = ?")
    .run(guildId, ownerId, name);
  return info.changes > 0;
}

export function listPlaylists(guildId: string, ownerId: string): PlaylistRow[] {
  return db
    .prepare("SELECT * FROM playlists WHERE guild_id = ? AND owner_id = ? ORDER BY created_at DESC")
    .all(guildId, ownerId) as PlaylistRow[];
}

export function getPlaylistByName(guildId: string, ownerId: string, name: string): PlaylistRow | undefined {
  return db
    .prepare("SELECT * FROM playlists WHERE guild_id = ? AND owner_id = ? AND name = ?")
    .get(guildId, ownerId, name) as PlaylistRow | undefined;
}

export function getPlaylistTracks(playlistId: number): PlaylistTrackRow[] {
  return db
    .prepare("SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC")
    .all(playlistId) as PlaylistTrackRow[];
}
