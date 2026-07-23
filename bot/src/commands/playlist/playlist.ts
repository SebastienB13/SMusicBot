import { SlashCommandBuilder, GuildMember } from "discord.js";
import type { Command } from "../../types";
import { getOrCreatePlayer } from "../../utils/player";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylistByName,
  getPlaylistTracks,
  listPlaylists,
} from "../../database/db";

const MAX_TRACKS_PER_PLAYLIST = 200;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Gère tes playlists sauvegardées.")
    .addSubcommand((sub) =>
      sub
        .setName("save")
        .setDescription("Sauvegarde la file d'attente actuelle (musique en cours incluse) en playlist.")
        .addStringOption((opt) => opt.setName("nom").setDescription("Nom de la playlist").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("load")
        .setDescription("Charge une playlist sauvegardée dans la file d'attente.")
        .addStringOption((opt) =>
          opt.setName("nom").setDescription("Nom de la playlist").setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("Liste tes playlists sauvegardées."))
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Supprime une playlist sauvegardée.")
        .addStringOption((opt) =>
          opt.setName("nom").setDescription("Nom de la playlist").setRequired(true).setAutocomplete(true),
        ),
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const playlists = listPlaylists(interaction.guildId!, interaction.user.id);
    const filtered = playlists
      .filter((p) => p.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((p) => ({ name: p.name, value: p.name }));
    await interaction.respond(filtered);
  },

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;
    const userId = interaction.user.id;

    if (sub === "save") {
      const name = interaction.options.getString("nom", true).slice(0, 90);
      const player = client.lavalink.getPlayer(guildId);
      const current = player?.queue.current;
      const upcoming = player?.queue.tracks ?? [];

      if (!current && upcoming.length === 0) {
        await interaction.reply({ embeds: [errorEmbed("Rien à sauvegarder : la file est vide.")], ephemeral: true });
        return;
      }

      const allTracks = [...(current ? [current] : []), ...upcoming].slice(0, MAX_TRACKS_PER_PLAYLIST);
      try {
        createPlaylist(
          guildId,
          userId,
          name,
          allTracks.map((t) => ({
            encoded: t.encoded ?? "",
            title: t.info.title,
            author: t.info.author ?? "Inconnu",
            uri: t.info.uri ?? null,
            duration_ms: t.info.duration ?? 0,
          })),
        );
        await interaction.reply({
          embeds: [successEmbed(`💾 Playlist **${name}** sauvegardée (${allTracks.length} musique(s)).`)],
        });
      } catch {
        await interaction.reply({
          embeds: [errorEmbed(`Tu as déjà une playlist nommée **${name}**. Supprime-la d'abord ou choisis un autre nom.`)],
          ephemeral: true,
        });
      }
      return;
    }

    if (sub === "list") {
      const playlists = listPlaylists(guildId, userId);
      if (!playlists.length) {
        await interaction.reply({ embeds: [errorEmbed("Tu n'as aucune playlist sauvegardée sur ce serveur.")], ephemeral: true });
        return;
      }
      const lines = playlists.map((p) => {
        const count = getPlaylistTracks(p.id).length;
        return `• **${p.name}** — ${count} musique(s)`;
      });
      await interaction.reply({ embeds: [successEmbed(`📋 Tes playlists :\n${lines.join("\n")}`)] });
      return;
    }

    if (sub === "delete") {
      const name = interaction.options.getString("nom", true);
      const ok = deletePlaylist(guildId, userId, name);
      await interaction.reply({
        embeds: [ok ? successEmbed(`🗑️ Playlist **${name}** supprimée.`) : errorEmbed(`Playlist **${name}** introuvable.`)],
        ephemeral: !ok,
      });
      return;
    }

    if (sub === "load") {
      const member = interaction.member as GuildMember;
      if (!member.voice.channel) {
        await interaction.reply({ embeds: [errorEmbed("Rejoins un salon vocal d'abord.")], ephemeral: true });
        return;
      }
      const name = interaction.options.getString("nom", true);
      const playlist = getPlaylistByName(guildId, userId, name);
      if (!playlist) {
        await interaction.reply({ embeds: [errorEmbed(`Playlist **${name}** introuvable.`)], ephemeral: true });
        return;
      }

      await interaction.deferReply();
      const tracks = getPlaylistTracks(playlist.id);
      const player = getOrCreatePlayer(interaction, client)!;
      if (!player.connected) await player.connect();

      let added = 0;
      for (const t of tracks) {
        try {
          const res = await player.search({ query: t.uri || `${t.author} ${t.title}` }, interaction.user);
          const match = res?.tracks?.[0];
          if (match) {
            await player.queue.add(match);
            added++;
          }
        } catch {
          // skip unresolvable tracks
        }
      }

      if (!added) {
        await interaction.editReply({ embeds: [errorEmbed("Impossible de charger les musiques de cette playlist.")] });
        return;
      }

      if (!player.playing && !player.paused) await player.play();
      await interaction.editReply({
        embeds: [successEmbed(`📥 Playlist **${playlist.name}** chargée (${added}/${tracks.length} musique(s)).`)],
      });
    }
  },
};

export default command;
