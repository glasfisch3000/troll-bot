module.exports = (environment) => {
  return {
    log: (message) => { _log(new Date(), environment, "LOG", message) },
    err: (message) => { _log(new Date(), environment, "ERROR", message) },
    childLogger: (child) => { return module.exports((environment || []).concat([`${child}`])) },
  }
}

function _log(date, environment, status, message) {
  var text = `${date.toISOString()} `
  for(const component of environment) {
    text = `${text}[${component}] `
  }
  text = `${text}${status || "LOG"}: ${message}`

  console.log(text)
}
