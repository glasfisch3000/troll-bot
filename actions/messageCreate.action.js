const fs = require("fs").promises
const { clientID } = require(__dirname + "/../ids.js")
const sessionID = require(__dirname + "/sessionid.js")

module.exports = async (client, logger) => {
  const { log, err, childLogger } = logger("messageCreate.action")

  try {
    log("adding client listener")
    client.on("messageCreate", async message => {
      const child = childLogger("session-" + sessionID())

      try {
        child.log(`received message: ${message.id} from ${message.author.id} in ${message.channelId} (${message.guildId})`)

        if(message.author.id == clientID) {
          child.log("message came from me lol")
          return
        }

        child.log("listing filters")
        const files = await fs.readdir(__dirname + "/messageCreateFilters")

        for(const file of files) {
          log("checking file " + file)
          if(file.endsWith(".filter.js")) {
            log("activating file " + file)
            require(__dirname + "/messageCreateFilters/" + file)(client, message, child.childLogger)
          }
        }
      } catch(err) {
        err(err)
      }
    })
  } catch(error) {
    err(error)
  }

  log("setup done")
}
