import { SlashCommandBuilder, GuildMember } from "discord.js";
import type { Command } from "../../types";
import { getOrCreatePlayer } from "../../utils/player";
import { errorEmbed, successEmbed } from "../../utils/embeds";

const command: Command = {
  data: new SlashCommandBuilder().setName("join").setDescription("Fait rejoindre le bot dans ton salon vocal."),
  async execute(interaction, client) {
    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      await interaction.reply({ embeds: [errorEmbed("Rejoins un salon vocal d'abord.")], ephemeral: true });
      return;
    }

    const existing = client.lavalink.getPlayer(interaction.guildId!);
    if (existing?.voiceChannelId && existing.voiceChannelId !== member.voice.channel.id) {
      await interaction.reply({
        embeds: [errorEmbed(`Je suis déjà dans <#${existing.voiceChannelId}>.`)],
        ephemeral: true,
      });
      return;
    }

    const player = getOrCreatePlayer(interaction, client)!;
    if (!player.connected) await player.connect();

    await interaction.reply({ embeds: [successEmbed(`👋 Connecté à <#${member.voice.channel.id}>.`)] });
  },
};

export default command;
