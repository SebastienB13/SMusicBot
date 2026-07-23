import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { Player } from "lavalink-client";
import type { BotClient } from "../structures/BotClient";
import { config } from "../config";
import { getGuildSettings } from "../database/db";

/** Returns the existing player for this guild, or creates a new one in the invoker's voice channel. */
export function getOrCreatePlayer(interaction: ChatInputCommandInteraction, client: BotClient): Player | null {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;
  if (!voiceChannel) return null;

  let player = client.lavalink.getPlayer(interaction.guildId!);
  if (!player) {
    const settings = getGuildSettings(interaction.guildId!, config.defaults.volume);
    player = client.lavalink.createPlayer({
      guildId: interaction.guildId!,
      voiceChannelId: voiceChannel.id,
      textChannelId: interaction.channelId,
      selfDeaf: true,
      volume: settings.default_volume,
    });
  }
  return player;
}
