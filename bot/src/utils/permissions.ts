import { GuildMember, PermissionFlagsBits } from "discord.js";
import type { Player } from "lavalink-client";
import { config } from "../config";
import type { GuildSettings } from "../database/db";

/**
 * DJ gate: bot owners and server admins always pass. If no DJ role is configured,
 * the server runs in "open" mode and everyone passes. Otherwise the member needs the
 * DJ role, or to be the only human in the bot's voice channel.
 */
export function isDJ(member: GuildMember, settings: GuildSettings, player?: Player | null): boolean {
  if (config.ownerIds.includes(member.id)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  if (!settings.dj_role_id) return true;
  if (member.roles.cache.has(settings.dj_role_id)) return true;

  if (player) {
    const voiceChannel = member.guild.channels.cache.get(player.voiceChannelId ?? "");
    if (voiceChannel?.isVoiceBased()) {
      const humans = voiceChannel.members.filter((m) => !m.user.bot);
      if (humans.size <= 1 && humans.has(member.id)) return true;
    }
  }

  return false;
}

export function isInSameVoiceChannel(member: GuildMember, player: Player): boolean {
  return member.voice.channelId != null && member.voice.channelId === player.voiceChannelId;
}
