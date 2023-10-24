const guildID = require(__dirname + "/../../ids.js").guildID
const userID = "594877920036651031"
const patterns = [
  "mai",
]

module.exports = async (client, message, logger) => {
  const { log, err } = logger("mai.filter")

  try {
    let content = message.content.toLowerCase()

    for(const pattern of patterns) {
      log(`checking pattern '${pattern}'`)
      if(content.includes(pattern)) {
        log("pattern found, changing nickname")

        const guild = await client.guilds.cache.get(guildID) || await client.guilds.fetch(guildID)
        if(!guild) {
          log("guild not found")
          break
        }

        const member = await guild.members.fetch(userID)
        if(!member) {
          log("member not found")
          break
        }

        member.setNickname(member.nickname.replace("mai", "Mai"))

        break
      }
    }
  } catch(error) {
    err(error)
  }
}
