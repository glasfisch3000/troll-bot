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
      await interaction.reply({ content: "keine zitate gefunden" })
      return
    }

    let lines = new String(quotes).split(/\n/g)

    if(!lines) {
      err("quotes empty")
      await interaction.reply({ content: "keine zitate gefunden" })
      return
    }

    const filters = interaction.options._hoistedOptions.find(option => option.name === "filter")
    if(filters && filters.value) {
      log("checking filters")
      for(const filter of new String(filters.value).split(/ /g)) {
        log(`checking filter: "${filter}"`)
        lines = lines.filter(line => line.toLowerCase().includes(filter.toLowerCase()))
      }
    }

    if(!lines || lines.length < 1) {
      err("no quotes matching filters")
      await interaction.reply({ content: "keine zitate gefunden" })
      return
    }

    const line = lines[Math.floor(Math.random()*lines.length)]

    log("replying")
    await interaction.reply({ content: line })
  } catch(error) {
    err(error)

    try {
      await interaction.reply({ content: "error. idfk, guck halt in die logs" })
    } catch(error) {
      err(error)
    }
  }
}
