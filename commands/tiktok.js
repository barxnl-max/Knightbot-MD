const { Tiktok } = require("../lib/tiktok");

async function tiktokCommand(sock, chatId, message, args = []) {
  try {
    if (!args.length) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Contoh:\n.tiktok <url>\n.tiktokmp3 <url> --vv\n.tiktokall <url>" },
        { quoted: message }
      );
    }

    const isViewOnce = args.includes("--vv");
    const url = args.find(v => v.startsWith("http"));

    if (!url) {
      return sock.sendMessage(
        chatId,
        { text: "❌ URL TikTok tidak ditemukan" },
        { quoted: message }
      );
    }

    const command = (
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      ""
    ).split(" ")[0].replace(".", "").toLowerCase();

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    });

    const res = await Tiktok(url);

    // =========================
    // TIKTOK VIDEO
    // =========================
    if (command === "tiktok") {
      return sock.sendMessage(
        chatId,
        {
          video: { url: res.nowm },
          caption: `🎵 ${res.title}\n👤 ${res.author}`,
          viewOnce: isViewOnce
        },
        { quoted: message }
      );
    }

    // =========================
    // TIKTOK MP3
    // =========================
    if (command === "tiktokmp3") {
      return sock.sendMessage(
        chatId,
        {
          audio: { url: res.audio },
          mimetype: "audio/mpeg",
          ptt: isViewOnce === true, // --vv => voice note
          viewOnce: isViewOnce === true
        },
        { quoted: message }
      );
    }

    // =========================
    // TIKTOK ALL
    // =========================
    if (command === "tiktokall") {
      await sock.sendMessage(
        chatId,
        {
          video: { url: res.nowm },
          caption: `🎬 Video\n${res.title}`
        },
        { quoted: message }
      );

      await sock.sendMessage(
        chatId,
        {
          audio: { url: res.audio },
          mimetype: "audio/mpeg",
          ptt: false
        },
        { quoted: message }
      );
      return;
    }

  } catch (err) {
    console.error("tiktok error:", err);
    return sock.sendMessage(
      chatId,
      { text: "❌ Gagal mengambil TikTok" },
      { quoted: message }
    );
  }
}

module.exports = tiktokCommand;
