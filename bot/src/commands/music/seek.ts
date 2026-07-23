import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed, formatDuration } from "../../utils/embeds";

function parseTimestamp(input: string): number | null {
  const parts = input.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  let seconds = 0;
  for (const part of parts) seconds = seconds * 60 + part;
  return seconds * 1000;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Avance/recule dans la musique en cours.")
    .addStringOption((opt) =>
      opt.setName("position").setDescription("Ex: 1:30 ou 90 (secondes)").setRequired(true),
    ),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true });
    if (!ctx) return;
    const raw = interaction.options.getString("position", true);
    const ms = raw.includes(":") ? parseTimestamp(raw) : Number(raw) * 1000;
    const duration = ctx.player.queue.current?.info.duration ?? 0;

    if (ms === null || Number.isNaN(ms) || ms < 0) {
      await interaction.reply({ embeds: [errorEmbed("Format invalide. Utilise `1:30` ou `90`.")], ephemeral: true });
      return;
    }
    if (duration > 0 && ms > duration) {
      await interaction.reply({ embeds: [errorEmbed("Cette position dépasse la durée de la musique.")], ephemeral: true });
      return;
    }

    await ctx.player.seek(ms);
    await interaction.reply({ embeds: [successEmbed(`⏩ Position réglée sur ${formatDuration(ms)}.`)] });
  },
};

export default command;
