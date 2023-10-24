const fs = require("fs").promises
const { clientID } = require(__dirname + "/../ids.js")

module.exports = async (client) => {
  client.on("messageCreate", async message => {
    try {
      console.log(`received message: ${message.id} from ${message.author.id} in ${message.channelId} (${message.guildId})`)

      if(message.author.id == clientID) return

      const files = await fs.readdir(__dirname + "/messageCreateFilters")

      for(const file of files) {
        if(file.endsWith(".filter.js")) {
          require(__dirname + "/messageCreateFilters/" + file)(client, message)
        }
      }
    } catch(err) {
      console.log("[messageCreate] error: " + err)
    }
  })

  console.log("[messageCreate] setup done")
}
