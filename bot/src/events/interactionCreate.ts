import { Events, GuildMember } from "discord.js";
import type { BotEvent } from "../handlers/loadEvents";
import { errorEmbed, buildNowPlayingEmbed } from "../utils/embeds";
import { nowPlayingButtons } from "../lavalink/createManager";
import { getGuildSettings } from "../database/db";
import { isDJ } from "../utils/permissions";
import { config } from "../config";

const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        console.error(`[autocomplete:${interaction.commandName}]`, err);
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[command:${interaction.commandName}]`, err);
        const payload = {
          embeds: [errorEmbed("Une erreur est survenue en exécutant cette commande.")],
          ephemeral: true,
        };
        if (interaction.deferred || interaction.replied) await interaction.editReply(payload).catch(() => {});
        else await interaction.reply(payload).catch(() => {});
      }
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("music:")) {
      if (!interaction.guildId || !interaction.member) return;

      const player = client.lavalink.getPlayer(interaction.guildId);
      if (!player) {
        await interaction.reply({ embeds: [errorEmbed("Aucune lecture en cours.")], ephemeral: true });
        return;
      }

      const member = interaction.member as GuildMember;
      if (!member.voice.channelId || member.voice.channelId !== player.voiceChannelId) {
        await interaction.reply({
          embeds: [errorEmbed("Tu dois être dans le même salon vocal que moi.")],
          ephemeral: true,
        });
        return;
      }

      const settings = getGuildSettings(interaction.guildId, config.defaults.volume);
      if (!isDJ(member, settings, player)) {
        await interaction.reply({ embeds: [errorEmbed("Rôle DJ requis pour ça.")], ephemeral: true });
        return;
      }

      const action = interaction.customId.split(":")[1];
      switch (action) {
        case "pauseresume":
          if (player.paused) await player.resume();
          else await player.pause();
          break;
        case "skip":
          await player.skip();
          break;
        case "stop":
          player.queue.tracks.splice(0, player.queue.tracks.length);
          await player.stopPlaying(true, false);
          break;
        case "loop": {
          const order = ["off", "track", "queue"] as const;
          const idx = order.indexOf(player.repeatMode as (typeof order)[number]);
          await player.setRepeatMode(order[(idx + 1) % order.length]);
          break;
        }
        case "shuffle":
          player.queue.shuffle();
          break;
      }

      await interaction.deferUpdate();
      if (player.queue.current && action !== "stop" && action !== "skip") {
        await interaction.message
          .edit({
            embeds: [buildNowPlayingEmbed(player, player.queue.current)],
            components: [nowPlayingButtons(player)],
          })
          .catch(() => {});
      }
    }
  },
};

export default event;
