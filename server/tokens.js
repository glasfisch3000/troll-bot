const fs = require("fs").promises

module.exports.getToken = async (logger, id) => {
  const { log, err } = logger("getToken")

  try {
    const tokens = await fs.readFile(__dirname + "/data/tokens.json")

    if(!tokens || typeof tokens[Symbol.iterator] != "function") {
      err("tokens not iterable")
      return
    }

    for(const token of tokens) {
      if(!token) continue
      if(!token.guild) continue
      if(!token.token) continue

      if(token.guild == id) {
        log("token found")
        return token.token
      }
    }

    return undefined
  } catch(error) {
    err(error)
  }
}

module.exports.setToken = async (logger, guildID, token) => {
  const { log, err } = logger("getToken")

  if(!guildID) {
    err("no guild id")
    return false
  }

  if(!token) {
    err("no token")
    return false
  }

  try {
    let tokens = await fs.readFile(__dirname + "/data/tokens.json")

    tokens.splice(0, 0, {
      guild: guildID,
      token: token,
    })

    await fs.writeFile(__dirname + "/data/tokens.json", tokens)

    return true
  } catch(error) {
    err(error)
    return false
  }
}
