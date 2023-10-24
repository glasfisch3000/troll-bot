const fs = require("fs").promises
const id = require(__dirname + "/actions/sessionid.js")()

module.exports = (environment) => {
  return {
    log: async (message) => { await _log(new Date(), environment, "LOG", message) },
    err: async (message) => { await _log(new Date(), environment, "ERROR", message) },
    childLogger: (child) => { return module.exports((environment || []).concat([child])) },
  }
}

async function _log(date, environment, status, message) {
  var text = `(${id}) ${date.toISOString()} `
  for(const component of environment) {
    text = `${text}[${component}] `
  }
  text = `${text}${status || "LOG"}: ${message}\n`

  await _print(text)
}

async function _print(data) {
  try {
    var file = await fs.open(__dirname + "/log.txt", "a")
    if(!file) return

    await file.appendFile(data)
  } catch(error) {
    console.error("logging: " + error)
  } finally {
    file?.close()
  }
}
