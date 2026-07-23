import fs from "node:fs";
import path from "node:path";
import type { BotClient } from "../structures/BotClient";

export interface BotEvent {
  name: string;
  once?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (client: BotClient, ...args: any[]) => void | Promise<void>;
}

export function loadEvents(client: BotClient): void {
  const eventsDir = path.join(__dirname, "..", "events");
  const files = fs
    .readdirSync(eventsDir)
    .filter((f) => /\.(js|ts)$/.test(f) && !f.endsWith(".d.ts"));

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imported = require(path.join(eventsDir, file));
    const event: BotEvent | undefined = imported.default ?? imported.event;
    if (!event?.name || !event.execute) {
      console.warn(`[events] Fichier d'event invalide ignoré : ${file}`);
      continue;
    }
    const handler = (...args: unknown[]) => event.execute(client, ...args);
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
  }

  console.log(`[events] ${files.length} fichier(s) d'event chargé(s).`);
}
