import { LavalinkManager, Player, Track } from "lavalink-client";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";
import type { BotClient } from "../structures/BotClient";
import { config } from "../config";
import { getGuildSettings } from "../database/db";
import { buildNowPlayingEmbed, errorEmbed } from "../utils/embeds";

export function nowPlayingButtons(player: Player): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music:pauseresume")
      .setEmoji(player.paused ? "▶️" : "⏸️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music:skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music:stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music:loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music:shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary),
  );
}

export function clearLeaveTimer(client: BotClient, guildId: string) {
  const timer = client.leaveTimers.get(guildId);
  if (timer) {
    clearTimeout(timer);
    client.leaveTimers.delete(guildId);
  }
}

export function scheduleLeave(client: BotClient, player: Player, ms: number, reason: string) {
  clearLeaveTimer(client, player.guildId);
  const timer = setTimeout(async () => {
    client.leaveTimers.delete(player.guildId);
    const current = client.lavalink.getPlayer(player.guildId);
    if (!current) return;
    const channel = client.channels.cache.get(current.textChannelId ?? "") as TextChannel | undefined;
    await channel?.send({ embeds: [errorEmbed(reason)] }).catch(() => {});
    await current.destroy().catch(() => {});
  }, ms);
  client.leaveTimers.set(player.guildId, timer);
}

async function tryAutoplay(player: Player, lastTrack: Track | null): Promise<boolean> {
  if (!lastTrack) return false;
  try {
    const isYoutube = lastTrack.info.sourceName === "youtube" || lastTrack.info.sourceName === "youtubemusic";
    const videoId = lastTrack.info.identifier;
    let result: Awaited<ReturnType<Player["search"]>> | undefined;

    if (isYoutube && videoId && /^[\w-]{11}$/.test(videoId)) {
      result = await player.search(
        { query: `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}` },
        lastTrack.requester,
      );
    }

    if (!result || result.tracks.length === 0) {
      result = await player.search(
        { query: `${lastTrack.info.author} ${lastTrack.info.title}`, source: "ytsearch" },
        lastTrack.requester,
      );
    }

    const history = new Set(player.queue.previous.map((t) => t.info.identifier));
    history.add(lastTrack.info.identifier);
    const next = result.tracks.find((t) => !history.has(t.info.identifier ?? ""));
    if (!next) return false;

    await player.queue.add(next);
    if (!player.playing && !player.paused) await player.play();
    return true;
  } catch (err) {
    console.error("[autoplay] failed:", err);
    return false;
  }
}

export function createLavalinkManager(client: BotClient): LavalinkManager {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host: config.lavalink.host,
        port: config.lavalink.port,
        authorization: config.lavalink.password,
        secure: config.lavalink.secure,
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: {
      id: config.discord.clientId,
    },
    autoSkip: true,
    playerOptions: {
      defaultSearchPlatform: "ytsearch",
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false,
      },
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  manager.nodeManager.on("connect", (node) => console.log(`[lavalink] node "${node.id}" connected`));
  manager.nodeManager.on("disconnect", (node, reason) =>
    console.warn(`[lavalink] node "${node.id}" disconnected:`, reason),
  );
  manager.nodeManager.on("error", (node, error) => console.error(`[lavalink] node "${node.id}" error:`, error));

  manager.on("trackStart", (player, track) => {
    clearLeaveTimer(client, player.guildId);
    player.set("skipVotes", new Set<string>());
    if (!track) return;
    const channel = client.channels.cache.get(player.textChannelId ?? "") as TextChannel | undefined;
    channel
      ?.send({ embeds: [buildNowPlayingEmbed(player, track)], components: [nowPlayingButtons(player)] })
      .catch(() => {});
  });

  manager.on("queueEnd", async (player, lastTrack) => {
    const settings = getGuildSettings(player.guildId, config.defaults.volume);
    if (settings.autoplay) {
      const played = await tryAutoplay(player, lastTrack as Track | null);
      if (played) return;
    }
    if (settings.twenty_four_seven) return;
    scheduleLeave(
      client,
      player,
      config.defaults.emptyQueueLeaveMs,
      "File d'attente terminée, je quitte le vocal par inactivité.",
    );
  });

  manager.on("playerDestroy", (player) => {
    clearLeaveTimer(client, player.guildId);
  });

  return manager;
}
