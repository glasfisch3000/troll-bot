module.exports = (environment) => {
  return {
    log: (message) => { _log(environment, "LOG", message) },
    err: (message) => { _log(environment, "ERROR", message) },
    childLogger: (child) => { return module.exports((environment || []).concat([`${child}`])) },
  }
}

function _log(environment, status, message) {
  const hrtime = process.hrtime()
  const timestamp = Math.floor(hrtime[0]*1_000_000 + hrtime[1]/1000)

  var text = `${timestamp} `
  for(const component of environment) {
    text = `${text}[${component}] `
  }
  text = `${text}${status || "LOG"}: ${message}`

  console.log(text)
}
