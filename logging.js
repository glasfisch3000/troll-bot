const fs = require("fs").promises

module.exports = (environment) => {
  return {
    log: async (message) => { await _log(new Date(), environment, "LOG", message) },
    err: async (message) => { await _log(new Date(), environment, "ERROR", message) },
    childLogger: (child) => { module.exports((environment || []).concat([child])) }
  }
}

async function _log(date, environment, status, message) {
  try {
    var message = `${date} `
    for(const component of environment) {
      message = `${message}[${component}] `
    }
    message = `${message}${status || "LOG"}: ${message}\n`

    var file = await fs.open(__dirname + "/log.txt")
    if(!file) return

    await fs.appendFile(file, message)
  } catch(error) {
    console.error("logging: " + error);
  } finally {
    await file?.close()
  }
}
