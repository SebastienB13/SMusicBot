import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Reprend la lecture."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true });
    if (!ctx) return;
    if (!ctx.player.paused) {
      await interaction.reply({ embeds: [errorEmbed("La musique n'est pas en pause.")], ephemeral: true });
      return;
    }
    await ctx.player.resume();
    await interaction.reply({ embeds: [successEmbed("▶️ Lecture reprise.")] });
  },
};

export default command;
