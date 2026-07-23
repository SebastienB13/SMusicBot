import fs from "node:fs";
import path from "node:path";
import type { BotClient } from "../structures/BotClient";
import type { Command } from "../types";

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.(js|ts)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) return [fullPath];
    return [];
  });
}

export function loadCommands(client: BotClient): void {
  const commandsDir = path.join(__dirname, "..", "commands");
  const files = walk(commandsDir);

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imported = require(file);
    const command: Command | undefined = imported.default ?? imported.command;
    if (!command?.data || !command.execute) {
      console.warn(`[commands] Fichier de commande invalide ignoré : ${file}`);
      continue;
    }
    client.commands.set(command.data.name, command);
  }

  console.log(`[commands] ${client.commands.size} commande(s) chargée(s).`);
}
