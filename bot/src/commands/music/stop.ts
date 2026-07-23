import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Arrête la musique, vide la file et quitte le vocal."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    await ctx.player.destroy();
    await interaction.reply({ embeds: [successEmbed("⏹️ Lecture arrêtée, file vidée.")] });
  },
};

export default command;
