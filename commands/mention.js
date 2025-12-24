const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/* ================= STATE ================= */

const STATE_PATH = path.join(__dirname, '..', 'data', 'mention.json');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch {
        return {
            enabled: false,
            assetPath: '',
            type: 'text',
            ptt: false,
            gifPlayback: false,
            mimetype: ''
        };
    }
}

function saveState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/* ================= MENTION DETECTOR ================= */

async function handleMentionDetection(sock, chatId, message) {
    try {
        if (!message.message || message.key?.fromMe) return;

        const state = loadState();
        if (!state.enabled) return;

        const rawId = sock.user?.id;
        if (!rawId) return;

        const botNum = rawId.split('@')[0].split(':')[0];
        const botJid = `${botNum}@s.whatsapp.net`;

        const msg = message.message;

        /* ===== ambil mentionedJid SAJA ===== */
        let mentioned = [];

        const ctxList = [
            msg.extendedTextMessage?.contextInfo,
            msg.imageMessage?.contextInfo,
            msg.videoMessage?.contextInfo,
            msg.documentMessage?.contextInfo,
            msg.stickerMessage?.contextInfo
        ].filter(Boolean);

        for (const ctx of ctxList) {
            if (Array.isArray(ctx.mentionedJid)) {
                mentioned.push(...ctx.mentionedJid);
            }
        }

        /* ===== STRICT FILTER ===== */
        // Ada mention tapi BUKAN bot → STOP
        if (mentioned.length > 0 && !mentioned.includes(botJid)) return;

        // Tidak ada mention sama sekali → STOP
        if (mentioned.length === 0) return;

        /* ===== KIRIM RESPON ===== */
        if (!state.assetPath) {
            await sock.sendMessage(chatId, { text: 'Hi' }, { quoted: message });
            return;
        }

        const assetFullPath = path.join(__dirname, '..', state.assetPath);
        if (!fs.existsSync(assetFullPath)) {
            await sock.sendMessage(chatId, { text: 'Hi' }, { quoted: message });
            return;
        }

        const payload = {};

        if (state.type === 'sticker') {
            payload.sticker = fs.readFileSync(assetFullPath);
        } else if (state.type === 'image') {
            payload.image = fs.readFileSync(assetFullPath);
        } else if (state.type === 'video') {
            payload.video = fs.readFileSync(assetFullPath);
            if (state.gifPlayback) payload.gifPlayback = true;
        } else if (state.type === 'audio') {
            payload.audio = fs.readFileSync(assetFullPath);
            payload.mimetype = state.mimetype || 'audio/mpeg';
            payload.ptt = !!state.ptt;
        } else if (state.type === 'text') {
            payload.text = fs.readFileSync(assetFullPath, 'utf8');
        }

        await sock.sendMessage(chatId, payload, { quoted: message });

    } catch (err) {
        console.error('MENTION ERROR:', err);
    }
}

/* ================= COMMANDS ================= */

async function mentionToggleCommand(sock, chatId, message, args) {
    const mode = args?.toLowerCase();
    if (!['on', 'off'].includes(mode)) {
        return sock.sendMessage(chatId, { text: 'Usage: .mention on|off' }, { quoted: message });
    }
    const state = loadState();
    state.enabled = mode === 'on';
    saveState(state);
    await sock.sendMessage(chatId, { text: `Mention reply ${mode}` }, { quoted: message });
}

async function setMentionCommand(sock, chatId, message) {
    const q = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!q) {
        return sock.sendMessage(chatId, { text: 'Reply media / text' }, { quoted: message });
    }

    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

    let type, dataType, buffer, mimetype = '', ptt = false, gifPlayback = false;

    if (q.stickerMessage) {
        type = 'sticker';
        dataType = 'stickerMessage';
    } else if (q.imageMessage) {
        type = 'image';
        dataType = 'imageMessage';
    } else if (q.videoMessage) {
        type = 'video';
        dataType = 'videoMessage';
        gifPlayback = q.videoMessage.gifPlayback;
    } else if (q.audioMessage) {
        type = 'audio';
        dataType = 'audioMessage';
        mimetype = q.audioMessage.mimetype;
        ptt = q.audioMessage.ptt;
    } else if (q.conversation || q.extendedTextMessage?.text) {
        type = 'text';
    } else {
        return sock.sendMessage(chatId, { text: 'Unsupported type' }, { quoted: message });
    }

    if (type === 'text') {
        buffer = Buffer.from(q.conversation || q.extendedTextMessage.text, 'utf8');
    } else {
        const stream = await downloadContentFromMessage(q[dataType], type === 'sticker' ? 'sticker' : type);
        const chunks = [];
        for await (const c of stream) chunks.push(c);
        buffer = Buffer.concat(chunks);
    }

    const extMap = {
        sticker: 'webp',
        image: 'jpg',
        video: 'mp4',
        audio: 'mp3',
        text: 'txt'
    };

    const outPath = path.join(ASSETS_DIR, `mention_custom.${extMap[type]}`);
    fs.writeFileSync(outPath, buffer);

    saveState({
        enabled: true,
        assetPath: `assets/mention_custom.${extMap[type]}`,
        type,
        mimetype,
        ptt,
        gifPlayback
    });

    await sock.sendMessage(chatId, { text: 'Mention reply updated ✅' }, { quoted: message });
}

/* ================= EXPORT ================= */

module.exports = {
    handleMentionDetection,
    mentionToggleCommand,
    setMentionCommand
};
