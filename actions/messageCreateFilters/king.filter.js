const guildID = require(__dirname + "/../../ids.js").guildID
const kingStickerID = "1164858902739963914"
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

        const guild = await client.guilds.cache.get(guildID) || await client.guilds.fetch(guildID)
        if(!guild) {
          log("guild not found")
          break
        }

        const sticker = await guild.stickers.fetch(kingStickerID)
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
