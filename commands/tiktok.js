const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Tiktok = require("../lib/tiktok");

async function tiktokCommand(sock, chatId, message, args, cmd) {
  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    const url = args.find(a => a.startsWith("http"));
    const isViewOnce = args.includes("--vv");

    if (!url) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Masukkan URL TikTok\n\nContoh:\n.tiktok <url>\n.tiktokmp3 <url>" },
        { quoted: message }
      );
    }

    const data = await Tiktok.download(url);
    if (!data) throw "DATA_EMPTY";

    const caption = `🎵 TikTok Downloader\n\n👤 ${data.author.nickname}\n📝 ${data.title || "-"}`;

    // ======================
    // TIKTOK VIDEO
    // ======================
    if (cmd === "tiktok") {
      return sock.sendMessage(
        chatId,
        {
          video: { url: data.play },
          caption,
          viewOnce: isViewOnce,
        },
        { quoted: message }
      );
    }

    // ======================
    // TIKTOK MP3
    // ======================
    if (cmd === "tiktokmp3") {
      return sock.sendMessage(
        chatId,
        {
          audio: { url: data.music },
          mimetype: "audio/mpeg",
          ptt: true,
          viewOnce: isViewOnce,
        },
        { quoted: message }
      );
    }

    // ======================
    // TIKTOK ALL
    // ======================
    if (cmd === "tiktokall") {
      await sock.sendMessage(
        chatId,
        {
          video: { url: data.play },
          caption,
        },
        { quoted: message }
      );

      await sock.sendMessage(
        chatId,
        {
          audio: { url: data.music },
          mimetype: "audio/mpeg",
          ptt: false,
        },
        { quoted: message }
      );
    }

  } catch (e) {
    console.error("tiktok error:", e);
    await sock.sendMessage(
      chatId,
      { text: "❌ Gagal download TikTok (link/private/limit)" },
      { quoted: message }
    );
  }
}

module.exports = tiktokCommand;
