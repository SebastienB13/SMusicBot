import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { buildNowPlayingEmbed } from "../../utils/embeds";
import { nowPlayingButtons } from "../../lavalink/createManager";

const command: Command = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Affiche la musique en cours."),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client);
    if (!ctx) return;
    await interaction.reply({
      embeds: [buildNowPlayingEmbed(ctx.player, ctx.player.queue.current!)],
      components: [nowPlayingButtons(ctx.player)],
    });
  },
};

export default command;
