import { SlashCommandBuilder, GuildMember, ChatInputCommandInteraction } from "discord.js";
import type { Player } from "lavalink-client";
import type { Command } from "../../types";
import { getOrCreatePlayer } from "../../utils/player";
import { errorEmbed, successEmbed, sourceLabel } from "../../utils/embeds";
import { isDeezerUrl, resolveDeezerUrl, searchDeezer } from "../../utils/deezer";

const SOURCE_PREFIX: Record<string, string> = {
  youtube: "ytsearch",
  youtubemusic: "ytmsearch",
  spotify: "spsearch",
  applemusic: "amsearch",
};

async function handleDeezer(interaction: ChatInputCommandInteraction, player: Player, query: string) {
  const isUrl = isDeezerUrl(query);
  const resolved = isUrl ? await resolveDeezerUrl(query) : null;
  const deezerTracks = resolved?.tracks ?? (isUrl ? [] : await searchDeezer(query, 1));

  if (!deezerTracks.length) {
    await interaction.editReply({ embeds: [errorEmbed("Aucun résultat Deezer trouvé.")] });
    return;
  }

  let added = 0;
  for (const dt of deezerTracks.slice(0, 50)) {
    const res = await player.search({ query: `${dt.artist} - ${dt.title}`, source: "ytsearch" }, interaction.user);
    const match = res?.tracks?.[0];
    if (match) {
      await player.queue.add(match);
      added++;
    }
  }

  if (!added) {
    await interaction.editReply({ embeds: [errorEmbed("Impossible de retrouver ces musiques Deezer sur YouTube.")] });
    return;
  }

  const label = resolved?.type === "track" ? deezerTracks[0].title : resolved?.name ?? query;
  await interaction.editReply({
    embeds: [successEmbed(`Ajouté depuis Deezer : **${label}** (${added} musique(s), lues via YouTube).`)],
  });

  if (!player.playing && !player.paused) await player.play();
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Joue une musique depuis YouTube, YouTube Music, Spotify, Apple Music ou Deezer.")
    .addStringOption((opt) =>
      opt.setName("recherche").setDescription("Titre, artiste ou lien").setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("source")
        .setDescription("Plateforme de recherche (ignoré si tu donnes un lien direct)")
        .addChoices(
          { name: "YouTube", value: "youtube" },
          { name: "YouTube Music", value: "youtubemusic" },
          { name: "Spotify", value: "spotify" },
          { name: "Apple Music", value: "applemusic" },
          { name: "Deezer", value: "deezer" },
        ),
    ),

  async execute(interaction, client) {
    const member = interaction.member as GuildMember;
    if (!member.voice.channel) {
      await interaction.reply({ embeds: [errorEmbed("Rejoins un salon vocal d'abord.")], ephemeral: true });
      return;
    }

    const existing = client.lavalink.getPlayer(interaction.guildId!);
    if (existing?.voiceChannelId && existing.voiceChannelId !== member.voice.channel.id) {
      await interaction.reply({
        embeds: [errorEmbed(`Je suis déjà en train de jouer dans <#${existing.voiceChannelId}>.`)],
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    const query = interaction.options.getString("recherche", true);
    const sourceOpt = interaction.options.getString("source") ?? "youtube";

    const player = getOrCreatePlayer(interaction, client);
    if (!player) {
      await interaction.editReply({ embeds: [errorEmbed("Rejoins un salon vocal d'abord.")] });
      return;
    }
    if (!player.connected) await player.connect();

    try {
      if (sourceOpt === "deezer" || isDeezerUrl(query)) {
        await handleDeezer(interaction, player, query);
        return;
      }

      const prefix = SOURCE_PREFIX[sourceOpt] ?? "ytsearch";
      const result = await player.search({ query, source: prefix as never }, interaction.user);

      if (!result || result.loadType === "empty" || result.loadType === "error") {
        await interaction.editReply({ embeds: [errorEmbed("Aucun résultat trouvé.")] });
        return;
      }

      if (result.loadType === "playlist") {
        await player.queue.add(result.tracks);
        await interaction.editReply({
          embeds: [
            successEmbed(
              `Playlist **${result.playlist?.name ?? "sans nom"}** ajoutée (${result.tracks.length} musiques) — ${sourceLabel(
                result.tracks[0]?.info.sourceName,
              )}.`,
            ),
          ],
        });
      } else {
        const track = result.tracks[0];
        await player.queue.add(track);
        await interaction.editReply({
          embeds: [
            successEmbed(`Ajouté à la file : **${track.info.title}** (${sourceLabel(track.info.sourceName)})`),
          ],
        });
      }

      if (!player.playing && !player.paused) await player.play();
    } catch (err) {
      console.error("[play]", err);
      await interaction.editReply({ embeds: [errorEmbed("Erreur lors de la recherche ou de la lecture.")] });
    }
  },
};

export default command;
