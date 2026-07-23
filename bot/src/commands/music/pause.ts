import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Met la musique en pause."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true });
    if (!ctx) return;
    if (ctx.player.paused) {
      await interaction.reply({ embeds: [errorEmbed("Déjà en pause.")], ephemeral: true });
      return;
    }
    await ctx.player.pause();
    await interaction.reply({ embeds: [successEmbed("⏸️ Musique mise en pause.")] });
  },
};

export default command;
