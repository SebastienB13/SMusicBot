import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Change le mode de boucle.")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Mode de boucle")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Musique actuelle", value: "track" },
          { name: "File d'attente", value: "queue" },
        ),
    ),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true });
    if (!ctx) return;
    const mode = interaction.options.getString("mode", true) as "off" | "track" | "queue";
    await ctx.player.setRepeatMode(mode);
    const labels = { off: "désactivée", track: "musique actuelle", queue: "file d'attente" };
    await interaction.reply({ embeds: [successEmbed(`🔁 Boucle : ${labels[mode]}.`)] });
  },
};

export default command;
