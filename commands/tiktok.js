const { Tiktok } = require("../lib/tiktok");

module.exports = async function tiktokCommand(sock, chatId, message, args) {
  try {
    if (!args[0]) {
      return sock.sendMessage(chatId, {
        text:
          "❌ URL TikTok kosong\n\n" +
          "Contoh:\n" +
          ".tiktok <url>\n" +
          ".tiktok <url> --vv\n" +
          ".tiktokmp3 <url>\n" +
          ".tiktokall <url>"
      }, { quoted: message });
    }

    const isVV = args.includes("--vv");
    const url = args.find(a => a.startsWith("http"));

    if (!url || !url.includes("tiktok")) {
      return sock.sendMessage(chatId, {
        text: "❌ URL TikTok tidak valid"
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    });

    const data = await Tiktok(url);

    if (!data.nowm && !data.audio) {
      return sock.sendMessage(chatId, {
        text: "❌ Gagal mengambil data TikTok"
      }, { quoted: message });
    }

    const caption =
      `🎵 TikTok Download\n` +
      (data.title ? `📌 ${data.title}\n` : "") +
      (data.author ? `👤 ${data.author}` : "");

    // ===== VIDEO =====
    if (message.message?.conversation?.startsWith(".tiktok")) {
      return sock.sendMessage(chatId, {
        video: { url: data.nowm },
        caption,
        viewOnce: isVV
      }, { quoted: message });
    }

    // ===== AUDIO / MP3 =====
    if (message.message?.conversation?.startsWith(".tiktokmp3")) {
      return sock.sendMessage(chatId, {
        audio: { url: data.audio },
        mimetype: "audio/mpeg",
        ptt: true,
        viewOnce: isVV
      }, { quoted: message });
    }

    // ===== ALL =====
    if (message.message?.conversation?.startsWith(".tiktokall")) {
      await sock.sendMessage(chatId, {
        video: { url: data.nowm },
        caption
      }, { quoted: message });

      return sock.sendMessage(chatId, {
        audio: { url: data.audio },
        mimetype: "audio/mpeg",
        ptt: true
      }, { quoted: message });
    }

  } catch (err) {
    console.error("tiktok error:", err);
    await sock.sendMessage(chatId, {
      text: "❌ Error TikTok: " + err.message
    }, { quoted: message });
  }
};
