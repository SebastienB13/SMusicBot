import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  discord: {
    token: required("DISCORD_TOKEN"),
    clientId: required("DISCORD_CLIENT_ID"),
    devGuildId: process.env.DEV_GUILD_ID || undefined,
  },
  lavalink: {
    host: process.env.LAVALINK_HOST || "lavalink",
    port: Number(process.env.LAVALINK_PORT || 2333),
    password: required("LAVALINK_PASSWORD"),
    secure: process.env.LAVALINK_SECURE === "true",
  },
  defaults: {
    volume: Number(process.env.DEFAULT_VOLUME || 80),
    emptyChannelLeaveMs: 2 * 60 * 1000,
    emptyQueueLeaveMs: 5 * 60 * 1000,
  },
  ownerIds: (process.env.BOT_OWNER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
};
