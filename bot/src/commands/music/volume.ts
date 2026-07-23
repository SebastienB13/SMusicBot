import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types";
import { requirePlayer } from "../../utils/guard";
import { successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Règle le volume (0-150).")
    .addIntegerOption((opt) =>
      opt.setName("niveau").setDescription("Volume en %").setMinValue(0).setMaxValue(150).setRequired(true),
    ),
  async execute(interaction, client) {
    const ctx = await requirePlayer(interaction, client, { requireDJ: true, requirePlaying: false });
    if (!ctx) return;
    const level = interaction.options.getInteger("niveau", true);
    await ctx.player.setVolume(level);
    await interaction.reply({ embeds: [successEmbed(`🔊 Volume réglé sur ${level}%.`)] });
  },
};

export default command;
