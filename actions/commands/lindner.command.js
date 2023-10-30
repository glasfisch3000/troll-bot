const fs = require("fs").promises

module.exports.name = "lindner"
module.exports.callback = async (logger, client, interaction) => {
  const { log, err, childLogger } = logger("lindner.command")

  try {
    log("received interaction")
    log("reading quotes")

    const quotes = await fs.readFile(__dirname + "/../../data/lindnerquotes.txt")

    if(!quotes) {
      err("no quotes found")
      await interaction.reply({ content: "couldn't find any content" })
      return
    }

    const lines = new String(quotes).split(/\n/g)

    if(!lines) {
      err("quotes empty")
      await interaction.reply({ content: "couldn't find any content" })
      return
    }

    const line = lines[floor(Math.random()*lines.length)]

    log("replying")
    await interaction.reply({ content: line })
  } catch(error) {
    err(error)

    try {
      await interaction.reply({ content: "error. idfk, check the logs" })
    } catch(error) {
      err(error)
    }
  }
}
