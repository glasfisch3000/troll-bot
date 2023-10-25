const fs = require("fs").promises
const { clientID } = require(__dirname + "/../ids.js")
const sessionID = require(__dirname + "/sessionid.js")

module.exports = async (client, logger) => {
  const { log, err, childLogger } = logger("messageCreate.action")

  try {
    log("adding client listener")
    client.on("messageCreate", async message => {
      const child = childLogger("session-" + sessionID())

      try {
        child.log(`received message: "${message.id}"`)

        if(message.author.id == clientID) {
          child.log("message came from me lol")
          return
        }

        child.log("listing filters")
        const files = await fs.readdir(__dirname + "/../data/messageCreateFilters")

        for(const file of files) {
          child.log(`checking file "${file}"`)
          if(file.endsWith(".filter.json")) {
            child.log(`checking filter file "${file}"`)

            checkFilterFile(child.childLogger, client, message, file)
          }
        }
      } catch(error) {
        child.err(error)
      }
    })
  } catch(error) {
    err(error)
  }

  log("setup done")
}

async function checkFilterFile(logger, client, message, file) {
  const { log, err, childLogger } = logger(file)

  try {
    const filter = JSON.parse(await fs.readFile(__dirname + "/messageCreateFilters/" + file))
    if(!filter || !filter.patterns) return
    if(!checkPatterns(message, filter.patterns)) return

    log("applying filter")

    if(filter.react) {
      react(childLogger, message, filter.react)
    }

    if(filter.reply) {
      reply(childLogger, client, message, filter.reply.reply, filter.reply.stickers)
    }

    if(filter.setNickname && filter.setNickname.guildID && filter.setNickname.userID) {
      setNickname(childLogger, client, message, filter.setNickname.guildID, filter.setNickname.userID, filter.setNickname.newNickname, filter.setNickname.replacements)
    }
  } catch(error) {
    err(error)
  }
}

function checkPatterns(message, patterns) {
  if(!message.content) return false

  for(const pattern of patterns) {
    let regexp
    if(typeof pattern == "RegExp") regexp = pattern
    else if(typeof pattern == "string") regexp = new RegExp(pattern)
    else if(pattern && pattern.regex) regexp = new RegExp(pattern.regex, pattern.flags)

    if(!regexp) continue

    if(regexp.test(message.content)) {
      return true
    }
  }

  return false
}

async function react(logger, message, emojiID) {
  await message.react(emojiID)
}

async function reply(logger, client, message, reply, stickers) {
  const { log, err, childLogger } = logger("reply")

  log(`replying with ${reply ? "reply message" : "no reply message"}, ${stickers ? "stickers" : "no stickers"}`)

  var stickerAttachments = []

  if(stickers && typeof stickers[Symbol.iterator] == "function") {
    for(const sticker of stickers) {
      if(!sticker || !sticker.id || !sticker.guildID) continue

      log("checking sticker " + sticker.id + " - " + sticker.guildID)

      const guild = await client.guilds.cache.get(sticker.guildID) || await client.guilds.fetch(sticker.guildID)
      if(!guild) {
        log("guild not found")
        continue
      }

      const stickerAttachment = await guild.stickers.fetch(sticker.id)
      if(!stickerAttachment) {
        log("sticker not found")
        continue
      }

      stickerAttachments.push(stickerAttachment)
    }
  }

  log("sending reply")
  return await message.reply({
    content: reply || "",
    stickers: stickerAttachments
  })
}

async function setNickname(logger, client, message, guildID, userID, newNickname, replacements) {
  const { log, err, childLogger } = logger("setNickname")

  log(`setting nickname with ${newNickname ? "new nickname" : "no new nickname"}, ${replacements ? "replacements" : "no replacements"}`)

  const guild = await client.guilds.cache.get(guildID) || await client.guilds.fetch(guildID)
  if(!guild) {
    log("guild not found")
    return
  }

  const member = await guild.members.fetch(userID)
  if(!member) {
    log("member not found")
    return
  }

  var nickname = member.nickname

  if(newNickname) nickname = newNickname

  for(const replacement of replacements) {
    if(!replacement || !replacement.pattern) continue
    log(`replacing "${replacement.pattern}" with "${replacement.replacement}"`)

    nickname = nickname.replace(replacement.pattern, `${replacement.replacement}`)
  }

  log("changing nickname")
  await member.setNickname(nickname)
}
