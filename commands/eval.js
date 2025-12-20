const util = require("util");
const fs = require("fs");

module.exports = {
  name: "eval",
  alias: ["=>", ">"],
  category: "owner",
  desc: "Evaluate JavaScript (Owner only)",
  isOwner: true,

  async run({ msg, conn, args }) {
    if (!args[0]) return msg.reply("Masukkan kode JS");

    let code = args.join(" ");

    try {
      // support await seperti wabot-aq
      let evaled = await eval(`(async () => { ${code} })()`);

      if (typeof evaled !== "string")
        evaled = util.inspect(evaled, { depth: 3 });

      if (evaled.length > 4000) {
        const file = "./eval-result.txt";
        fs.writeFileSync(file, evaled);
        await conn.sendMessage(
          msg.from,
          {
            document: { url: file },
            fileName: "eval-result.txt",
            mimetype: "text/plain"
          },
          { quoted: msg }
        );
        fs.unlinkSync(file);
      } else {
        msg.reply(evaled);
      }
    } catch (e) {
      msg.reply(util.format(e));
    }
  }
};
