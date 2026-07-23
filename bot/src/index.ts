import { GatewayIntentBits } from "discord.js";
import { BotClient } from "./structures/BotClient";
import { config } from "./config";
import { loadCommands } from "./handlers/loadCommands";
import { loadEvents } from "./handlers/loadEvents";
import { createLavalinkManager } from "./lavalink/createManager";

const client = new BotClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
});

client.lavalink = createLavalinkManager(client);

loadCommands(client);
loadEvents(client);

client.on("raw", (data) => client.lavalink.sendRawData(data));

client.login(config.discord.token);

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
