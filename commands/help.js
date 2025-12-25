const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
*── 「 ALL MENU 」 ──*

*GENERAL*
.help / .menu → Menampilkan semua menu bot
.ping → Cek respon bot
.alive → Cek status bot aktif
.owner → Info owner bot
.jid → Menampilkan JID chat
.url → Menampilkan URL chat

*AUTORESPON*
.addautorespon <kata>|<respon*> → Menambah autorespon (text / media)
.listautorespon → Menampilkan daftar autorespon
.delautorespon <kata> → Menghapus autorespon

*UTILITY*
.tts <text> → Ubah teks jadi suara
.trt <text> <lang> → Translate teks
.ss <link> → Screenshot website
.vv → View once ke biasa
.weather <city> → Info cuaca
.news → Berita terbaru
.lyrics <judul> → Lirik lagu
.8ball <pertanyaan> → Jawaban random
.groupinfo → Info grup
.staff / .admins → List admin grup

*STICKER & IMAGE*
.sticker → Buat stiker dari gambar
.attp <text> → Stiker teks animasi
.blur → Blur gambar
.crop → Crop gambar
.simage → Sticker ke gambar
.removebg → Hapus background
.remini → HD gambar
.tgsticker <link> → Sticker Telegram
.meme → Meme random
.take <packname> → Ubah pack sticker
.emojimix 😄+😂 → Gabung emoji
.igs <link> → Download story IG
.igsc <link> → Download highlight IG

*DOWNLOADER*
.snapsave <link> → Download TikTok / Instagram / Facebook
.play <judul> → Download lagu
.song <judul> → Download lagu
.spotify <query> → Download Spotify
.instagram <link> → Download Instagram
.facebook <link> → Download Facebook
.tiktok <link> → Download TikTok
.video <judul> → Cari video
.ytmp4 <link> → Download YouTube

*XVIDEOS CONTENT*
.xvsearch  <judul> → Cari video XVideos
.getxvideo <nomor> → Download video dari hasil pencarian

*PIES*
.pies <country> → Gambar cewek negara
.china → Cewek China
.indonesia → Cewek Indonesia
.japan → Cewek Jepang
.korea → Cewek Korea
.hijab → Cewek Hijab

*GAME*
.tictactoe @user → Game tic tac toe
.hangman → Game tebak kata
.guess <huruf> → Tebak huruf
.trivia → Soal trivia
.answer <jawaban> → Jawab trivia
.truth → Truth game
.dare → Dare game

*AI*
.gpt <pertanyaan> → Chat GPT
.gemini <pertanyaan> → Chat Gemini
.imagine <prompt> → Gambar AI
.flux <prompt> → Gambar AI
.sora <prompt> → Video AI

*FUN*
.compliment @user → Pujian
.insult @user → Ejekan
.flirt → Gombalan
.shayari → Puisi
.goodnight → Ucapan malam
.roseday → Ucapan roseday
.character @user → Cek karakter
.wasted @user → Efek wasted
.ship @user → Cek kecocokan
.simp @user → Cek simp
.stupid @user <text> → Stupid meme

*TEXTMAKER*
.metallic <text> → Teks metallic
.ice <text> → Teks es
.snow <text> → Teks salju
.impressive <text> → Teks keren
.matrix <text> → Teks matrix
.light <text> → Teks cahaya
.neon <text> → Teks neon
.devil <text> → Teks devil
.purple <text> → Teks ungu
.thunder <text> → Teks petir
.leaves <text> → Teks daun
.1917 <text> → Teks 1917
.arena <text> → Teks arena
.hacker <text> → Teks hacker
.sand <text> → Teks pasir
.blackpink <text> → Teks blackpink
.glitch <text> → Teks glitch
.fire <text> → Teks api

*ADMIN*
.ban @user → Ban member
.promote @user → Jadikan admin
.demote @user → Turunkan admin
.mute <menit> → Mute grup
.unmute → Unmute grup
.delete / .del → Hapus pesan
.kick @user → Kick member
.warn @user → Warn member
.warnings @user → List warning
.antilink → Anti link
.antibadword → Anti kata kasar
.clear → Bersihkan chat
.tag <pesan> → Tag dengan pesan
.tagall → Tag semua
.tagnotadmin → Tag non-admin
.hidetag <pesan> → Tag diam-diam
.chatbot → Chatbot grup
.resetlink → Reset link grup
.antitag on/off → Anti tag
.welcome on/off → Welcome grup
.goodbye on/off → Goodbye grup
.setgdesc <teks> → Set deskripsi grup
.setgname <nama> → Set nama grup
.setgpp → Set foto grup

*OWNER*
.mode public/private → Mode bot
.clearsession → Hapus session
.antidelete → Anti delete
.cleartmp → Hapus file temp
.update → Update bot
.settings → Pengaturan bot
.setpp → Set PP bot
.autoreact on/off → Auto react
.autostatus on/off → Auto status
.autotyping on/off → Auto typing
.autoread on/off → Auto read
.anticall on/off → Anti call
.pmblocker on/off → Block PM
.pmblocker setmsg <text> → Set pesan PM
.setmention → Set mention
.mention on/off → Mention mode

*ANIME*
.nom → Anime nom
.poke → Anime poke
.cry → Anime cry
.kiss → Anime kiss
.pat → Anime pat
.hug → Anime hug
.wink → Anime wink
.facepalm → Anime facepalm

Join our channel for updates:https://whatsapp.com/channel/0029VbBixHRCxoAyg44uoi41
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363423464130445@newsletter',
                        newsletterName: 'Lydia Bot by @barxnl250_',
                        serverMessageId: -1
                    }
                }
            },{ quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363423464130445@newsletter',
                        newsletterName: 'Lydia Bot by @barxnl250_',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
