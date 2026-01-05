const { handleWelcome } = require('../lib/welcome');
const { isWelcomeOn, getWelcome } = require('../lib/index');
const { channelInfo } = require('../lib/messageConfig');

const FALLBACK_IMAGE = 'https://files.catbox.moe/nwvkbt.png';

async function welcomeCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: 'This command can only be used in groups.' });
    }

    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        '';

    const matchText = text.split(' ').slice(1).join(' ');
    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    if (!(await isWelcomeOn(id))) return;

    const customMessage = await getWelcome(id);
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    const groupDesc = groupMetadata.desc || 'No description available';

    for (const participant of participants) {
        const jid =
            typeof participant === 'string'
                ? participant
                : participant.id || participant.toString();

        try {
            let displayName;
            try {
                displayName = await sock.getName(jid);
            } catch {
                displayName = jid.split('@')[0];
            }

            const finalMessage = customMessage
                ? customMessage
                      .replace(/{user}/g, `@${displayName}`)
                      .replace(/{group}/g, groupName)
                      .replace(/{description}/g, groupDesc)
                : `👋 Welcome @${displayName}!\n\nSelamat datang di *${groupName}*\n\n📌 ${groupDesc}`;

            let imageBuffer;

            try {
                // coba PP user
                const ppUrl = await sock.profilePictureUrl(jid, 'image');
                imageBuffer = (await sock.getFile(ppUrl)).data;
            } catch {
                // fallback image
                imageBuffer = (await sock.getFile(FALLBACK_IMAGE)).data;
            }

            await sock.sendMessage(
                id,
                {
                    image: imageBuffer,
                    caption: finalMessage,
                    mentions: [jid],
                    ...channelInfo
                }
            );
        } catch (err) {
            console.error('WELCOME ERROR:', err);
        }
    }
}

module.exports = { welcomeCommand, handleJoinEvent };
