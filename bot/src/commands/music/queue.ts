import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { buildQueueEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Affiche la file d'attente.")
    .addIntegerOption((opt) => opt.setName("page").setDescription("Numéro de page").setMinValue(1)),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requirePlaying: false });
    if (!ctx) return;
    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    await interaction.reply({ embeds: [buildQueueEmbed(ctx.player, page)] });
  },
};

export default command;
