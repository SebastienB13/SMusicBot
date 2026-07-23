import { SlashCommandBuilder, GuildMember, VoiceChannel, StageChannel } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { getGuildSettings } from "../../database/db";
import { isDJ } from "../../utils/permissions";
import { config } from "../../config";

const command: Command = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Passe à la musique suivante (vote si pas DJ)."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client);
    if (!ctx) return;
    const { player, member } = ctx;

    const settings = getGuildSettings(interaction.guildId!, config.defaults.volume);
    if (isDJ(member, settings, player)) {
      const skipped = player.queue.current;
      await player.skip();
      await interaction.reply({ embeds: [successEmbed(`⏭️ **${skipped?.info.title ?? "Musique"}** passée.`)] });
      return;
    }

    const voiceChannel = member.guild.channels.cache.get(player.voiceChannelId ?? "") as
      | VoiceChannel
      | StageChannel
      | undefined;
    const humans = voiceChannel?.members.filter((m: GuildMember) => !m.user.bot) ?? new Map();
    const needed = Math.max(1, Math.ceil(humans.size / 2));

    const votes = (player.get<Set<string>>("skipVotes")) ?? new Set<string>();
    votes.add(member.id);
    player.set("skipVotes", votes);

    if (votes.size >= needed) {
      const skipped = player.queue.current;
      await player.skip();
      await interaction.reply({
        embeds: [successEmbed(`⏭️ Vote réussi, **${skipped?.info.title ?? "Musique"}** passée.`)],
      });
      return;
    }

    await interaction.reply({
      embeds: [
        successEmbed(`🗳️ Vote enregistré (${votes.size}/${needed}). Encore ${needed - votes.size} vote(s) requis.`),
      ],
    });
  },
};

export default command;
