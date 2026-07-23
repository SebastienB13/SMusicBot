import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("clear").setDescription("Vide la file d'attente (sans arrêter la musique en cours)."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    const count = ctx.player.queue.tracks.length;
    await ctx.player.queue.splice(0, count);
    await interaction.reply({ embeds: [successEmbed(`🧹 File d'attente vidée (${count} musique(s) retirée(s)).`)] });
  },
};

export default command;
