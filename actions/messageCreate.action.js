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
    const filter = JSON.parse(await fs.readFile(__dirname + "/../data/messageCreateFilters/" + file))
    if(!filter || !filter.patterns) return
    if(!checkPatterns(message, filter.patterns)) return

    log("applying filter")

    invokeFilterApplications(childLogger, client, message, filter)
  } catch(error) {
    err(error)
  }
}

function invokeFilterApplications(logger, client, message, applications) {
  const { log, err, childLogger } = logger("applications")

  try {
    log("checking applications")

    if(applications.react) {
      react(childLogger, message, applications.react)
    }

    if(applications.reply) {
      reply(childLogger, client, message, applications.reply.reply, applications.reply.stickers)
    }

    if(applications.setNickname && applications.setNickname.guildID && applications.setNickname.userID) {
      setNickname(childLogger, client, message, applications.setNickname.guildID, applications.setNickname.userID, applications.setNickname.newNickname, applications.setNickname.replacements)
    }

    if(applications.kickMember) {
      kickMember(childLogger, client, message, applications.kickMember)
    }

    if(actions.random && typeof applications.random == "array") {
      log(`parsing random array (length ${applications.random.length})`)

      invokeFilterApplications(childLogger, client, message, applications.random[Math.floor(Math.random() * applications.random.length)])
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
  const { log, err, childLogger } = logger("react")

  try {
    await message.react(emojiID)
  } catch(error) {
    err(error)
  }
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

  if(!replacements || typeof replacements[Symbol.iterator] != "function") {
    err("replacements not iterable")
    return
  }

  for(const replacement of replacements) {
    if(!replacement || !replacement.pattern) continue
    log(`replacing "${replacement.pattern}" with "${replacement.replacement}"`)

    nickname = nickname.replace(replacement.pattern, `${replacement.replacement}`)
  }

  log("changing nickname")
  await member.setNickname(nickname)
}

async function kickMember(logger, client, message, members) {
  const { log, err, childLogger } = logger("kickMember")

  log(`kicking members: ${members ? "members" : "no members"}`)

  if(!message.guild) {
    err("guild not found")
    return
  }

  if(!message.author) {
    err("author not found")
    return
  }

  if(!members || typeof members[Symbol.iterator] != "function") {
    err("members not iterable")
    return
  }

  for(const memberData of members) {
    const child = childLogger(`member-${sessionID()}`)
    if(!memberData) continue

    try {
      const guild = await client.guilds.fetch(memberData.guildID || message.guild.id)
      if(!guild) {
        child.err("guild not found")
        continue
      }

      const member = await guild.members.fetch(memberData.userID || message.author.id)
      if(!member) {
        child.err("member not found")
        continue
      }

      log(`kicking member ${member.id} from ${guild.id}`)
      await member.kick()
    } catch(error) {
      child.err(error)
    }
  }
}
