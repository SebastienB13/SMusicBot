import type { ChatInputCommandInteraction, GuildMember } from "discord.js";
import type { Player } from "lavalink-client";
import type { BotClient } from "../structures/BotClient";
import { errorEmbed } from "./embeds";
import { getGuildSettings } from "../database/db";
import { isDJ, isInSameVoiceChannel } from "./permissions";
import { config } from "../config";

interface GuardOptions {
  /** Require the DJ role (or admin / alone-in-vc). Defaults to false. */
  requireDJ?: boolean;
  /** Require an active track. Defaults to true. */
  requirePlaying?: boolean;
}

/**
 * Common checks shared by most playback commands: player exists, something is
 * playing, the invoker is in the same voice channel, and (optionally) has DJ rights.
 * Replies with an error embed and returns null if any check fails.
 */
export async function requirePlayer(
  interaction: ChatInputCommandInteraction,
  client: BotClient,
  options: GuardOptions = {},
): Promise<{ player: Player; member: GuildMember } | null> {
  const player = client.lavalink.getPlayer(interaction.guildId!);
  if (!player) {
    await interaction.reply({
      embeds: [errorEmbed("Je ne suis pas connecté à un salon vocal.")],
      ephemeral: true,
    });
    return null;
  }

  if (options.requirePlaying !== false && !player.queue.current) {
    await interaction.reply({
      embeds: [errorEmbed("Rien n'est en cours de lecture.")],
      ephemeral: true,
    });
    return null;
  }

  const member = interaction.member as GuildMember;
  if (!isInSameVoiceChannel(member, player)) {
    await interaction.reply({
      embeds: [errorEmbed("Tu dois être dans le même salon vocal que moi.")],
      ephemeral: true,
    });
    return null;
  }

  if (options.requireDJ) {
    const settings = getGuildSettings(interaction.guildId!, config.defaults.volume);
    if (!isDJ(member, settings, player)) {
      await interaction.reply({
        embeds: [errorEmbed("Cette action nécessite le rôle DJ.")],
        ephemeral: true,
      });
      return null;
    }
  }

  return { player, member };
}
