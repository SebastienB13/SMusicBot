import { EmbedBuilder } from "discord.js";
import type { Player, Track } from "lavalink-client";

/** Accent color for embeds. Change freely to match server branding. */
export const EMBED_COLOR = 0x9b59b6;
export const ERROR_COLOR = 0xed4245;
export const SUCCESS_COLOR = 0x57f287;

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "LIVE";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  youtubemusic: "YouTube Music",
  spotify: "Spotify",
  applemusic: "Apple Music",
  deezer: "Deezer",
  soundcloud: "SoundCloud",
  http: "Lien direct",
};

export function sourceLabel(sourceName?: string | null): string {
  if (!sourceName) return "Inconnu";
  return SOURCE_LABELS[sourceName] ?? sourceName;
}

function progressBar(positionMs: number, durationMs: number, length = 20): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "🔴 LIVE";
  const ratio = Math.min(Math.max(positionMs / durationMs, 0), 1);
  const filledCount = Math.round(ratio * length);
  const bar = "▬".repeat(filledCount) + "🔘" + "▬".repeat(Math.max(length - filledCount, 0));
  return `${bar}\n${formatDuration(positionMs)} / ${formatDuration(durationMs)}`;
}

export function buildNowPlayingEmbed(player: Player, track: Track): EmbedBuilder {
  const requester = track.requester as { id?: string; username?: string } | undefined;
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setAuthor({ name: "En cours de lecture" })
    .setTitle(track.info.title)
    .setURL(track.info.uri ?? null)
    .setThumbnail(track.info.artworkUrl ?? null)
    .addFields(
      { name: "Artiste", value: track.info.author || "Inconnu", inline: true },
      { name: "Source", value: sourceLabel(track.info.sourceName), inline: true },
      { name: "Demandé par", value: requester?.id ? `<@${requester.id}>` : "Inconnu", inline: true },
      { name: "Progression", value: progressBar(player.position, track.info.duration) },
    )
    .setFooter({
      text: `Volume: ${player.volume}% • Boucle: ${loopLabel(player.repeatMode)} • Autoplay: ${
        player.get("autoplay") ? "activé" : "désactivé"
      }`,
    });
}

export function loopLabel(mode: string): string {
  switch (mode) {
    case "track":
      return "musique";
    case "queue":
      return "file";
    default:
      return "off";
  }
}

export function buildQueueEmbed(player: Player, page: number, pageSize = 10): EmbedBuilder {
  const queue = player.queue.tracks;
  const totalPages = Math.max(1, Math.ceil(queue.length / pageSize));
  const clampedPage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = clampedPage * pageSize;
  const slice = queue.slice(start, start + pageSize);

  const lines = slice.map((t, i) => {
    const requester = t.requester as { id?: string } | undefined;
    return `**${start + i + 1}.** [${t.info.title}](${t.info.uri}) — ${formatDuration(t.info.duration ?? 0)} ${
      requester?.id ? `(<@${requester.id}>)` : ""
    }`;
  });

  const current = player.queue.current;
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("File d'attente")
    .setDescription(
      (current ? `**En cours :** [${current.info.title}](${current.info.uri})\n\n` : "") +
        (lines.length ? lines.join("\n") : "_File vide._"),
    )
    .setFooter({ text: `Page ${clampedPage + 1}/${totalPages} • ${queue.length} musique(s) en attente` });

  return embed;
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(ERROR_COLOR).setDescription(`❌ ${message}`);
}

export function successEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(SUCCESS_COLOR).setDescription(`✅ ${message}`);
}
