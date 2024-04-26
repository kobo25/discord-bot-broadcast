const fs = require("fs");
const config = require("./config.json");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  Partials,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

client.once("ready", () => {
  console.log("hna tzadina 9bah ylah dor");
  console.log("bot ch3al ready !");
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!dm") || message.author.bot) return;

  const allowedRoleId = config.allowedRoleId;
  const member = message.guild.members.cache.get(message.author.id);

  if (!member.roles.cache.has(allowedRoleId)) {
    return message.reply({
      content: "You do not have permission to use this command !",
      ephemeral: true,
    });
  }

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply({
      content: "You do not have permission to use this command !",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor("#39f56c")
    .setTitle("Broadcast control panel")
    .setImage(config.image)
    .setDescription("Please choose the sending type for members");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("send_all")
     .setLabel("send everyone")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("send_online")
     .setLabel("send online")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("send_offline")
      .setLabel("send offline")
      .setStyle(ButtonStyle.Secondary),
  );

  await message.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isButton()) {
      let customId;
      if (interaction.customId === "send_all") {
        customId = "modal_all";
      } else if (interaction.customId === "send_online") {
        customId = "modal_online";
      } else if (interaction.customId === "send_offline") {
        customId = "modal_offline";
      }

      const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle("Type your message");

      const messageInput = new TextInputBuilder()
        .setCustomId("messageInput")
        .setLabel("ktab hna")
        .setStyle(TextInputStyle.Paragraph);

      modal.addComponents(new ActionRowBuilder().addComponents(messageInput));

      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const message = interaction.fields.getTextInputValue("messageInput");

      const guild = interaction.guild;
      if (!guild) return;

      await interaction.deferReply({
        ephemeral: true,
      });
      if (interaction.customId === "modal_all") {
        const membersToSend = guild.members.cache.filter(
          (member) => !member.user.bot
        );
        await Promise.all(
          membersToSend.map(async (member) => {
            try {
              await member.send({ content: `${message}\n<@${member.user.id}>`, allowedMentions: { parse: ['users'] } });
            } catch (error) {
              console.error(`Error sending message to ${member.user.tag}:`, error);
            }
          })
        );
      } else if (interaction.customId === "modal_online") {
        const onlineMembersToSend = guild.members.cache.filter(
          (member) =>
            !member.user.bot &&
            member.presence &&
            member.presence.status !== "offline"
        );
        await Promise.all(
          onlineMembersToSend.map(async (member) => {
            try {
              await member.send({ content: `${message}\n<@${member.user.id}>`, allowedMentions: { parse: ['users'] } });
            } catch (error) {
              console.error(`Error sending message to ${member.user.tag}:`, error);
            }
          })
        );
      } else if (interaction.customId === "modal_offline") {
        const offlineMembersToSend = guild.members.cache.filter(
          (member) =>
            !member.user.bot &&
            (!member.presence || member.presence.status === "offline")
        );
        await Promise.all(
          offlineMembersToSend.map(async (member) => {
            try {
              await member.send({ content: `${message}\n<@${member.user.id}>`, allowedMentions: { parse: ['users'] } });
            } catch (error) {
              console.error(`Error sending message to ${member.user.tag}:`, error);
            }
          })
        );
      }
      await interaction.editReply({
        content: "Your message has been sent to members successfully",
      });
    }
  } catch (error) {
    console.error("Error in interactionCreate event:", error);
  }

});


client.login(config.TOKEN);
