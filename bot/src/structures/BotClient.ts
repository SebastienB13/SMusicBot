import { Client, ClientOptions, Collection } from "discord.js";
import type { LavalinkManager } from "lavalink-client";
import type { Command } from "../types";

export class BotClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public lavalink!: LavalinkManager;
  /** guildId -> timeout handle, used for the "leave when empty" grace periods. */
  public leaveTimers: Collection<string, NodeJS.Timeout> = new Collection();

  constructor(options: ClientOptions) {
    super(options);
  }
}
