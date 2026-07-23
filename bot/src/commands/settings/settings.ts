import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../types";
import { getGuildSettings, setAutoplay, setDjRole, setTwentyFourSeven } from "../../database/db";
import { successEmbed } from "../../utils/embeds";
import { config } from "../../config";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("Configure le bot musique pour ce serveur.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("dj-role")
        .setDescription("Définit le rôle DJ requis pour contrôler la musique (vide = ouvert à tous).")
        .addRoleOption((opt) => opt.setName("role").setDescription("Rôle DJ (laisser vide pour désactiver)")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("24-7")
        .setDescription("Active/désactive le mode 24/7 (le bot reste connecté même sans musique).")
        .addBooleanOption((opt) => opt.setName("actif").setDescription("Activer le mode 24/7").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("autoplay")
        .setDescription("Active/désactive la lecture automatique de musiques similaires en fin de file.")
        .addBooleanOption((opt) => opt.setName("actif").setDescription("Activer l'autoplay").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("view").setDescription("Affiche la configuration actuelle.")),

  async execute(interaction) {
    const guildId = interaction.guildId!;
    const sub = interaction.options.getSubcommand();

    if (sub === "dj-role") {
      const role = interaction.options.getRole("role");
      setDjRole(guildId, role?.id ?? null, config.defaults.volume);
      await interaction.reply({
        embeds: [
          successEmbed(role ? `🎚️ Rôle DJ défini sur **${role.name}**.` : "🎚️ Rôle DJ désactivé, tout le monde peut contrôler la musique."),
        ],
      });
      return;
    }

    if (sub === "24-7") {
      const enabled = interaction.options.getBoolean("actif", true);
      setTwentyFourSeven(guildId, enabled, config.defaults.volume);
      await interaction.reply({ embeds: [successEmbed(`♾️ Mode 24/7 ${enabled ? "activé" : "désactivé"}.`)] });
      return;
    }

    if (sub === "autoplay") {
      const enabled = interaction.options.getBoolean("actif", true);
      setAutoplay(guildId, enabled, config.defaults.volume);
      await interaction.reply({ embeds: [successEmbed(`🔄 Autoplay ${enabled ? "activé" : "désactivé"}.`)] });
      return;
    }

    if (sub === "view") {
      const settings = getGuildSettings(guildId, config.defaults.volume);
      await interaction.reply({
        embeds: [
          successEmbed(
            [
              `**Rôle DJ :** ${settings.dj_role_id ? `<@&${settings.dj_role_id}>` : "aucun (ouvert à tous)"}`,
              `**Mode 24/7 :** ${settings.twenty_four_seven ? "activé" : "désactivé"}`,
              `**Autoplay :** ${settings.autoplay ? "activé" : "désactivé"}`,
              `**Volume par défaut :** ${settings.default_volume}%`,
            ].join("\n"),
          ),
        ],
      });
    }
  },
};

export default command;
