const guildID = require(__dirname + "/../../ids.js").guildID
const kingStickerID = "1160180926492463154"
const patterns = [
  "king",
]

module.exports = async (client, message, logger) => {
  const { log, err } = logger("king.filter")

  try {
    let content = message.content.toLowerCase()

    for(const pattern of patterns) {
      log(`checking pattern '${pattern}'`)
      if(content.includes(pattern)) {
        log("pattern found, replying")

        const guild = client.guilds.cache.get(guildID) || client.guilds.fetch(guildID)
        if(!guild) {
          log("guild not found")
          break
        }

        const sticker = guild.stickers.fetch(kingStickerID)
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
