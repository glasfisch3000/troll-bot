const lindnerEmojiID = "1162812374554792058"

module.exports = async (client, message) => {
  if(message.content.toLowerCase().includes("lindner")) {
    message.react(lindnerEmojiID)
  }
}
