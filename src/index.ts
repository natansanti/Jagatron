import { Client, CommandInteractionOptionResolver, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { handleBossEvent } from './events/bossEvents';
import { handleRushadaoEvent } from './events/taEvent';

dotenv.config();

// Configuração do cliente Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Carregar variáveis de ambiente
const APPLICATION_ID = process.env.APPLICATION_ID;
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID; // Adiciona a variável GUILD_ID para registrar comandos de teste em um servidor específico

client.once('ready', () => {
    console.log('Bot is online!');
});

// Listener de interação de comandos
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const options = interaction.options as CommandInteractionOptionResolver;
    const { commandName } = interaction;

    if (commandName === 'event') {
        const eventType = options.getString('type'); // Usa getString para capturar a opção de evento

        if (eventType === 'boss') {
            await handleBossEvent(interaction);
        } else if (eventType === 't.a') {
            await handleRushadaoEvent(interaction);
        } else {
            await interaction.reply({ content: 'Tipo de evento inválido!', ephemeral: true });
        }
    }
});

// Definição dos comandos
const commands = [
    new SlashCommandBuilder()
        .setName('event')
        .setDescription('Gerencia eventos de boss e T.A')
        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Escolha o tipo de evento')
                .setRequired(true)
                .addChoices(
                    { name: 'Boss', value: 'boss' },
                    { name: 'T.A', value: 't.a' }
                )
        ),
];

// Configuração da API REST para registro de comandos
const rest = new REST({ version: '10', timeout: 10000 }).setToken(TOKEN as string);

(async () => {
    try {
        if (!APPLICATION_ID || !TOKEN) {
            console.log('Invalid application ID or token');
            return;
        }

        // Verifica se está registrando comandos globais ou no servidor específico
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID),
                { body: commands },
            );
            console.log(`Comandos registrados com sucesso no servidor ${GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(APPLICATION_ID),
                { body: commands },
            );
            console.log('Comandos globais registrados com sucesso!');
        }
    } catch (error) {
        console.error('Erro ao registrar os comandos:', error);
    }
})();

// Login do bot no Discord
client.login(TOKEN);
