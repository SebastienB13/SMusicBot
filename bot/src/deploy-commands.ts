import fs from "node:fs";
import path from "node:path";
import { REST, Routes } from "discord.js";
import { config } from "./config";
import type { Command } from "./types";

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.(js|ts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) return [fullPath];
    return [];
  });
}

async function main() {
  const commandsDir = path.join(__dirname, "commands");
  const files = walk(commandsDir);

  const payload = [];
  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imported = require(file);
    const command: Command | undefined = imported.default ?? imported.command;
    if (command?.data) payload.push(command.data.toJSON());
  }

  const rest = new REST().setToken(config.discord.token);

  const route = config.discord.devGuildId
    ? Routes.applicationGuildCommands(config.discord.clientId, config.discord.devGuildId)
    : Routes.applicationCommands(config.discord.clientId);

  console.log(
    `Déploiement de ${payload.length} commande(s) ${
      config.discord.devGuildId ? `sur le serveur de dev (${config.discord.devGuildId})` : "globalement"
    }...`,
  );
  await rest.put(route, { body: payload });
  console.log("Terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
