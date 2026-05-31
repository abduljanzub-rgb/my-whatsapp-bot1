const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");

const reactions = [
"🥰","🩷","❤️","🧡","💛","💚","🩵","💙","💜","🖤","🩶",
"🤍","🤎","💋","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓",
"💗","💖","💝","💘","♥️"
];

let i = 0;

// گرفتن نام کاربر
function getName(msg){
  try{
    const name = msg.pushName;
    const num = msg.key.participant || msg.key.remoteJid;
    return (name && name !== "undefined") ? name : num.split("@")[0];
  }catch{
    return "عزیزم";
  }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  // اتصال
  sock.ev.on("connection.update", (u) => {
    if (u.qr) {
      console.log("\n📱 QR CODE:\n");
      console.log(u.qr);
    }

    if (u.connection === "open") {
      console.log("✅ Bot Connected");
    }

    if (u.connection === "close") {
      const reason = u.lastDisconnect?.error?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        start();
      }
    }
  });

  // پیام‌ها
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const jid = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    const isLong = text.split(" ").length > 15;

    const isMedia =
      m.message.imageMessage ||
      m.message.videoMessage ||
      m.message.stickerMessage;

    // ری‌اکشن
    if (isLong || isMedia) {
      const emoji = reactions[i];
      i = (i + 1) % reactions.length;

      await sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: m.key
        }
      });
    }

    // welcome گروه
    if (jid.endsWith("@g.us") && m.messageStubType === 27) {
      const name = getName(m);

      await sock.sendMessage(jid, {
        text: `⫷✧♛WELCOME♛✧⫸\nWelcome, ${name}`
      });
    }
  });
}

start();
