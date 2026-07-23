import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { errorEmbed, successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Mélange la file d'attente."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    if (ctx.player.queue.tracks.length < 2) {
      await interaction.reply({ embeds: [errorEmbed("Pas assez de musiques dans la file.")], ephemeral: true });
      return;
    }
    ctx.player.queue.shuffle();
    await interaction.reply({ embeds: [successEmbed("🔀 File d'attente mélangée.")] });
  },
};

export default command;
