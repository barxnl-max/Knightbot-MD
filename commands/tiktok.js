const { ttdl } = require("ruhend-scraper")
const axios = require("axios")

const processedMessages = new Set()

module.exports = async function tiktokCommand(sock, chatId, message) {
  try {
    if (processedMessages.has(message.key.id)) return
    processedMessages.add(message.key.id)
    setTimeout(() => processedMessages.delete(message.key.id), 300000)

    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text

    if (!text) return

    const args = text.split(" ").slice(1)
    const isViewOnce = args.includes("--vv")
    const isMp3 = args.includes("--mp3")

    const url = args.find(v => v.startsWith("http"))
    if (!url) {
      return sock.sendMessage(chatId, {
        text: "❌ Masukkan link TikTok"
      }, { quoted: message })
    }

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    })

    let videoUrl, audioUrl, title = "TikTok Video"

    // ================= SIPUTZX API =================
    try {
      const api = await axios.get(
        `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
        { timeout: 15000 }
      )

      const data = api.data?.data
      if (data) {
        videoUrl = data.urls?.[0] || data.video_url || data.url
        audioUrl = data.music || null
        title = data.metadata?.title || title
      }
    } catch {}

    // ================= FALLBACK TTDL =================
    if (!videoUrl) {
      const res = await ttdl(url)
      const media = res?.data?.find(v => v.type === "video")
      if (!media) throw "No video"
      videoUrl = media.url
    }

    // ================= DOWNLOAD =================
    if (isMp3 && audioUrl) {
      return sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: isViewOnce
      }, { quoted: message })
    }

    await sock.sendMessage(chatId, {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: `📥 TikTok Download\n📝 ${title}`,
      viewOnce: isViewOnce
    }, { quoted: message })

  } catch (e) {
    console.error(e)
    sock.sendMessage(chatId, {
      text: "❌ Gagal download TikTok"
    }, { quoted: message })
  }
}
