const sessionID = require(__dirname + "/sessionid.js")
const fs = require("fs").promises
var commands = []

module.exports = async (client, logger) => {
  const { log, err, childLogger } = logger("interactionCreate.action")

  try {
    let commands = []

    log("importing command files")
    const files = await fs.readdir(__dirname + "/commands")

    for(const file of files) {
      log(`checking file ${file}`)
      if(file.endsWith(".command.js")) {
        log(`adding command file ${file}`)
        commands.push(require(__dirname + "/commands/" + file))
      }
    }

    log("adding client listener")
    client.on("interactionCreate", async interaction => {
      const child = childLogger("session-" + sessionID())

      try {
        child.log(`received interaction: "${interaction.id}"`)

        if(!interaction.isChatInputCommand()) {
          child.log("interaction is not a command")
          return
        }

        for(const command of commands) {
          if(interaction.commandName === command.name) await command.callback(child.childLogger, client, interaction)
        }
      } catch(error) {
        child.err(error)
      }
    })

    log("setup done")
  } catch(error) {
    err(error)
  }
}
