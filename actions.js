const fs = require("fs").promises

async function init(client, logger) {
  const { log, err, childLogger } = logger("actions")

  try {
    log("listing action files")
    const files = await fs.readdir(__dirname + "/actions")

    for(const file of files) {
      log("checking file " + file)
      if(file.endsWith(".action.js")) {
        log("activating file " + file)
        require(__dirname + "/actions/" + file)(client, childLogger)
      }
    }
  } catch(error) {
    err(error)
  }

  log("setup done")
}

module.exports = init
