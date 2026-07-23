import { ActivityType, Events } from "discord.js";
import type { BotEvent } from "../handlers/loadEvents";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    if (!client.user) return;
    await client.lavalink.init({ id: client.user.id, username: client.user.username });
    client.user.setActivity("/play | SMusicBot", { type: ActivityType.Listening });
    console.log(`[ready] Connecté en tant que ${client.user.tag}`);
  },
};

export default event;
