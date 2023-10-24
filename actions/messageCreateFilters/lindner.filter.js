const lindnerEmojiID = "1162812374554792058"
const patterns = [
  "lindner",
  "fdp",
  "geringverdiener",
  "kapital",
  "markt",
  "wirtschaft",
]

module.exports = async (client, message) => {
  let content = message.content.toLowerCase()

  for(const pattern in patterns) {
    if(content.includes(pattern)) {
      message.react(lindnerEmojiID)
      break
    }
  }
}
