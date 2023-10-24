const fs = require("fs").promises
const id = require(__dirname + "/actions/sessionid.js")()

module.exports = (environment) => {
  return {
    log: async (message) => { await _log(new Date(), environment, "LOG", message) },
    err: async (message) => { await _log(new Date(), environment, "ERROR", message) },
    childLogger: (child) => { module.exports((environment || []).concat([child])) },
  }
}

async function _log(date, environment, status, message) {
  var message = `(${id}) ${date} `
  for(const component of environment) {
    message = `${message}[${component}] `
  }
  message = `${message}${status || "LOG"}: ${message}\n`

  await _print(message)
}

async function _print(data) {
  try {
    var file = await fs.open(__dirname + "/log.txt")
    if(!file) return

    await fs.appendFile(file, data)
  } catch(error) {
    console.error("logging: " + error)
  } finally {
    file?.close()
  }
}
