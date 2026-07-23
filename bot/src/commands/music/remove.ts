import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Retire une musique de la file d'attente.")
    .addIntegerOption((opt) =>
      opt.setName("position").setDescription("Position dans la file (voir /queue)").setMinValue(1).setRequired(true),
    ),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    const position = interaction.options.getInteger("position", true);
    const index = position - 1;
    if (index < 0 || index >= ctx.player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Position invalide.")], ephemeral: true });
      return;
    }
    const removed = ctx.player.queue.tracks[index];
    await ctx.player.queue.remove(index);
    await interaction.reply({ embeds: [successEmbed(`🗑️ Retiré : **${removed.info.title}**.`)] });
  },
};

export default command;
