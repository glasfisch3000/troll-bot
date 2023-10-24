const emojiID = "1163430015678029884"
const patterns = [
  "edwin",
  "sysadwin",
  "sus",
]

module.exports = async (client, message, logger) => {
  const { log, err } = logger("susedwin.filter")

  try {
    let content = message.content.toLowerCase()

    for(const pattern of patterns) {
      log(`checking pattern '${pattern}'`)
      if(content.includes(pattern)) {
        log("pattern found, reacting")
        message.react(emojiID)
        break
      }
    }
  } catch(error) {
    err(error)
  }
}
