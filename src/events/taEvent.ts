import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    CommandInteraction,
    ComponentType,
    VoiceChannel,
    ButtonInteraction,
    TextChannel,
} from "discord.js";
import { exportParticipants } from "../utils";

const AUTHORIZED_IDS = process.env.AUTHORIZED_IDS?.split(',') || [];

export async function handleRushadaoEvent(interaction: CommandInteraction) {
    if (!AUTHORIZED_IDS.includes(interaction.user.id)) {
        return await interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }
    const guild = interaction.guild;
    if (!guild) {
        return await interaction.reply({ content: 'Erro ao acessar o servidor.', ephemeral: true });
    }

    const category = guild.channels.cache.get(process.env.EVENT_CATEGORY_ID as string);
    const voiceChannel = await guild.channels.create({
        name: 'RUSHADÃO da T.A',
        type: ChannelType.GuildVoice,
        parent: category?.id,
    }) as VoiceChannel;

    await interaction.reply({
        content: `RUSHADÃO da T.A em andamento!`,
        ephemeral: true
    });

    const notificationChannel = guild.channels.cache.get(process.env.EVENT_NOTIFICATIONS as string);
    if (notificationChannel instanceof TextChannel) {
        await notificationChannel.send(`@everyone RUSHADÃO da T.A em andamento! Para participar, clique aqui: <#${voiceChannel.id}>`);
    }

    const exportInterval = setInterval(async () => {
        await exportParticipants(voiceChannel, 'T.A', false); // Substitua o 'false' pela lógica que determina se houve contest
    }, 60000); // Exporta a cada minuto

    const endButton = new ButtonBuilder()
        .setCustomId('end_rushadao')
        .setLabel('Encerrar Rushadão')
        .setStyle(ButtonStyle.Danger);

    await interaction.followUp({
        content: 'Clique no botão abaixo para encerrar o Rushadão.',
        components: [new ActionRowBuilder<ButtonBuilder>().addComponents(endButton)],
        ephemeral: true
    });

    const channel = interaction.channel; // Armazena o canal
    if (channel && channel instanceof TextChannel) {
        const buttonCollector = channel.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3600000,
        });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            if (buttonInteraction.customId === 'end_rushadao') {
                clearInterval(exportInterval);
                await voiceChannel.delete();
                await buttonInteraction.reply({ content: 'RUSHADÃO da T.A encerrado!', ephemeral: true });
                buttonCollector.stop();
            }
        });

        buttonCollector.on('end', () => {
            clearInterval(exportInterval);
        });
    }
}
