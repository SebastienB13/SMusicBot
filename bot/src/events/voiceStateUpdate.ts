import { Events, VoiceChannel, StageChannel } from "discord.js";
import type { BotEvent } from "../handlers/loadEvents";
import { getGuildSettings } from "../database/db";
import { config } from "../config";
import { clearLeaveTimer, scheduleLeave } from "../lavalink/createManager";

const event: BotEvent = {
  name: Events.VoiceStateUpdate,
  async execute(client, oldState, newState) {
    const guildId = newState.guild.id;
    const player = client.lavalink.getPlayer(guildId);
    if (!player || !player.voiceChannelId) return;

    // The bot itself got disconnected/kicked from voice.
    if (oldState.id === client.user?.id && oldState.channelId && !newState.channelId) {
      await player.destroy().catch(() => {});
      return;
    }

    const voiceChannel = newState.guild.channels.cache.get(player.voiceChannelId) as
      | VoiceChannel
      | StageChannel
      | undefined;
    if (!voiceChannel) return;

    const humans = voiceChannel.members.filter((m) => !m.user.bot);

    if (humans.size === 0) {
      const settings = getGuildSettings(guildId, config.defaults.volume);
      if (settings.twenty_four_seven) return;
      scheduleLeave(
        client,
        player,
        config.defaults.emptyChannelLeaveMs,
        "Salon vocal vide, je quitte par inactivité.",
      );
    } else {
      clearLeaveTimer(client, guildId);
    }
  },
};

export default event;
