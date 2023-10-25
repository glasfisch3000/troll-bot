const guildID = require(__dirname + "/../../ids.js").guildID
const stickerID = "1166653231607320606"
const patterns = [
  "amthor",
  "schabernack",
  "cdu",
  "rentner",
]

module.exports = async (client, message, logger) => {
  const { log, err } = logger("amthor.filter")

  try {
    let content = message.content.toLowerCase()

    for(const pattern of patterns) {
      log(`checking pattern '${pattern}'`)
      if(content.includes(pattern)) {
        log("pattern found, replying")

        const guild = await client.guilds.cache.get(guildID) || await client.guilds.fetch(guildID)
        if(!guild) {
          log("guild not found")
          break
        }

        const sticker = await guild.stickers.fetch(stickerID)
        if(!sticker) {
          log("sticker not found")
          break
        }

        let reply = {
          content: "",
          stickers: [sticker]
        }
        message.reply(reply)

        break
      }
    }
  } catch(error) {
    err(error)
  }
}
