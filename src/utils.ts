import { VoiceChannel } from "discord.js";
import fs from 'fs';
import path from 'path';

export const bosses = [
    { id: 'boss1', name: 'GRUTA 1 - Tigdal', score: 2 },
    { id: 'boss2', name: 'GRUTA 2 - Gatfilian', score: 2 },
    { id: 'boss3', name: 'GRUTA 3 - Modi', score: 2 },
    { id: 'boss4', name: 'GRUTA 3 - Rotura', score: 2 },
    { id: 'boss5', name: 'GRUTA 4 - Pander', score: 2 },
    { id: 'boss6', name: 'GRUTA 5 - Moltanis', score: 6 },
    { id: 'boss7', name: 'GRUTA 6 - Dardalroka', score: 10 },
    { id: 'boss8', name: 'T.A - Cavaleiro (DK)', score: 2 },
    { id: 'boss9', name: 'Masmorra Global', score: 4 },
];

export async function exportParticipants(channel: VoiceChannel, event: string, contest: boolean) {
    const participants = channel.members.filter(member => !member.voice.selfDeaf);
    const data = participants.map(member => ({
        id: member.user.id,
        username: member.user.username,
    }));

    const exportData = {
        event: event,
        participants: data,
        timestamp: new Date().toISOString(),
        contest: contest, // Adiciona o campo contest para salvar
    };

    const filePath = path.join(__dirname, '../exports', `${event.replace(/\s+/g, '_')}_${Date.now()}.json`);

    // Cria a pasta exports se não existir
    if (!fs.existsSync(path.join(__dirname, '../exports'))) {
        fs.mkdirSync(path.join(__dirname, '../exports'));
    }

    // Salva os dados em um arquivo JSON
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    console.log(`Dados exportados para ${filePath}`);
}
