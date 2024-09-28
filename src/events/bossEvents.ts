import {
    CommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ComponentType,
    VoiceChannel,
    ChannelType,
    ButtonInteraction,
    StringSelectMenuInteraction,
    TextChannel,
} from 'discord.js';
import { bosses, exportParticipants } from '../utils';



export async function handleBossEvent(interaction: CommandInteraction) {

    const AUTHORIZED_IDS = process.env.AUTHORIZED_IDS?.split(',') || [];

    if (!AUTHORIZED_IDS.includes(interaction.user.id)) {
        return await interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
    }
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_boss')
        .setPlaceholder('Selecione um boss')
        .addOptions(bosses.map(boss => ({
            label: boss.name,
            description: `Pontos: ${boss.score}`,
            value: boss.id
        })));

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Danger);

    await interaction.reply({
        content: 'Selecione o boss para iniciar o evento.',
        components: [row, new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton)],
        ephemeral: true
    });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
    });

    collector.on('collect', async (i: StringSelectMenuInteraction) => {
        if (i.user.id !== interaction.user.id) {
            return await i.reply({ content: 'Você não pode selecionar o boss para este evento.', ephemeral: true });
        }

        const selectedBoss = bosses.find(boss => boss.id === i.values[0]);
        if (!selectedBoss) {
            return await i.reply({ content: 'Boss inválido selecionado.', ephemeral: true });
        }

        const guild = interaction.guild;
        if (!guild) {
            return await i.reply({ content: 'Erro ao acessar o servidor.', ephemeral: true });
        }

        const category = guild.channels.cache.get(process.env.EVENT_CATEGORY_ID as string);
        const voiceChannel = await guild.channels.create({
            name: selectedBoss.name,
            type: ChannelType.GuildVoice,
            parent: category?.id,
        }) as VoiceChannel;

        // Enviando mensagem ao canal de notificações
        const notificationChannel = guild.channels.cache.get(process.env.EVENT_NOTIFICATIONS as string);
        if (notificationChannel instanceof TextChannel) {
            await notificationChannel.send(`@everyone Evento de ${selectedBoss.name} iniciado! Para participar, clique aqui: <#${voiceChannel.id}>`);
        }

        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_attendance')
            .setLabel('Confirmar presenças')
            .setStyle(ButtonStyle.Success);
        
        const endButton = new ButtonBuilder()
            .setCustomId('end_event')
            .setLabel('Encerrar evento')
            .setStyle(ButtonStyle.Danger);

        await i.update({
            content: `Evento de ${selectedBoss.name} iniciado! Canal de voz criado: ${voiceChannel.name}`,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, endButton)
            ],
        });

        const buttonCollector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3600000,
        });

        buttonCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
            const channel = buttonInteraction.channel;
            if (!channel || !(channel instanceof TextChannel)) return;

            if (buttonInteraction.customId === 'confirm_attendance') {
                const contestMenu = new StringSelectMenuBuilder()
                    .setCustomId('select_contest')
                    .setPlaceholder('Houve contest?')
                    .addOptions([
                        { label: 'Houve contest', value: 'true' },
                        { label: 'Não houve contest', value: 'false' }
                    ]);

                await buttonInteraction.reply({
                    content: 'Selecione se houve contest.',
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(contestMenu)],
                    ephemeral: true
                });

                const contestCollector = channel.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 60000,
                });

                contestCollector.on('collect', async (contestInteraction: StringSelectMenuInteraction) => {
                    const contestOccurred = contestInteraction.values[0] === 'true';
                    await exportParticipants(voiceChannel, selectedBoss.name, contestOccurred);

                    await contestInteraction.update({ content: 'Presenças confirmadas!', components: [] });
                    contestCollector.stop();
                });
            } else if (buttonInteraction.customId === 'end_event') {
                await voiceChannel.delete();
                await buttonInteraction.reply({ content: `Evento de ${selectedBoss.name} encerrado!`, ephemeral: true });
            }
        });
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            interaction.followUp({ content: 'Tempo esgotado. Nenhum boss foi selecionado.', ephemeral: true });
        }
    });
}
