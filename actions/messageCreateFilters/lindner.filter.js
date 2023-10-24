const lindnerEmojiID = "1162812374554792058"
const patterns = [
  "lindner",
  "fdp",
  "geringverdiener",
  "kapital",
  "markt",
  "wirtschaft",
  "wiwi",
  "finanz",
  "reich",
]

module.exports = async (client, message, logger) => {
  const { log, err } = logger("lindner.filter")

  try {
    let content = message.content.toLowerCase()

    for(const pattern of patterns) {
      log(`checking pattern '${pattern}'`)
      if(content.includes(pattern)) {
        log("pattern found, reacting")
        message.react(lindnerEmojiID)
        break
      }
    }
  } catch(error) {
    err(error)
  }
}
