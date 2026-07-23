import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("leave").setDescription("Fait quitter le bot du salon vocal."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    await ctx.player.destroy();
    await interaction.reply({ embeds: [successEmbed("👋 Déconnecté du salon vocal.")] });
  },
};

export default command;
