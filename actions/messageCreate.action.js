const fs = require("fs").promises
const { EmbedBuilder, WebhookClient } = require("discord.js");

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

        if(!message.author) {
          child.err("unable to check message author")
          return
        }

        if(message.author.bot) {
          child.log("message came from a bot")
          return
        }

        if(message.author.id == clientID) {
          child.log("message came from me lol")
          return
        }

        if(message.author.system) {
          child.log("system message")
          return
        }

        if(message.webhookId) {
          child.log("webhook message")
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
    if(!filter || !filter.patterns || !filter.applications) return

    const matches = checkPatterns(message, filter.patterns)
    if(!matches) return

    log("applying filter")

    invokeFilterApplications(childLogger, client, message, matches, filter.applications)
  } catch(error) {
    err(error)
  }
}

function invokeFilterApplications(logger, client, message, matches, applications, pickRandom) {
  const { log, err, childLogger } = logger("applications")

  try {
    log("parsing applications")

    if(!applications || typeof applications[Symbol.iterator] != "function") {
      err("applications not iterable")
      return
    }

    let parsedApplications = []

    for(const application of applications) {
      if(!application) continue

      if(application.react) {
        parsedApplications.push(() => { 
          react(childLogger, message, application.react) 
        })
      }
  
      if(application.reply) {
        parsedApplications.push(() => {
          reply(childLogger, client, message, application.reply.reply, application.reply.stickers)
        })
      }
  
      if(application.setNickname && application.setNickname.guildID && application.setNickname.userID) {
        parsedApplications.push(() => {
          setNickname(childLogger, client, message, application.setNickname.guildID, application.setNickname.userID, application.setNickname.newNickname, application.setNickname.replacements)
        })
      }
  
      if(application.kickMember) {
        parsedApplications.push(() => {
          kickMember(childLogger, client, message, application.kickMember)
        })
      }
  
      if(application.edit) {
        parsedApplications.push(() => {
          editMessage(childLogger, client, message, matches, application.edit)
        })
      }
  
      if(application.random && typeof application.random == "array") {
        log(`parsing random array (length ${application.random.length})`)
        parsedApplications.push(() => {
          invokeFilterApplications(childLogger, client, message, application.random, true)
        })
      }
    }

    if(pickRandom) {
      log("activating random application")

      const randomIndex = Math.floor(Math.random() * parsedApplications.length)
      const randomElement = parsedApplications[randomIndex]
      randomElement()
    } else {
      log("activating applications")

      for(const application of parsedApplications) {
        application()
      }
    }
  } catch(error) {
    err(error)
  }
}

function checkPatterns(message, patterns) {
  if(!message.content) return false

  let matches = []
  for(const pattern of patterns) {
    let regexp
    if(typeof pattern == "RegExp") regexp = new RegExp(pattern, "g")
    else if(typeof pattern == "string") regexp = new RegExp(pattern, "g")
    else if(pattern && pattern.regex) regexp = new RegExp(pattern.regex, (pattern.flags || "") + "g")

    if(!regexp) continue

    let match = regexp.exec(message.content)
    while(match != null) {
      matches.push({ index: match.index, string: match[0] })
      match = regexp.exec(message.content)
    }
  }

  return (matches.length > 0) ? matches : false
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

  try {
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
  } catch(error) {
    err(error)
  }
}

async function setNickname(logger, client, message, guildID, userID, newNickname, replacements) {
  const { log, err, childLogger } = logger("setNickname")

  try {
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
  } catch(error) {
    err(error)
  }
}

async function kickMember(logger, client, message, members) {
  const { log, err, childLogger } = logger("kickMember")

  try {
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
  } catch(error) {
    err(error)
  }
}

async function editMessage(logger, client, message, matches, editPattern) {
  const { log, err, childLogger } = logger("editMessage")

  try {
    if(!message || !message.author || !message.channel || !message.content || typeof message.content != "string") {
      err("message or channel not found")
      return
    }

    if(!matches) {
      err("no matches")
      return
    }

    log("constructing message")

    matches.sort((a, b) => {
      if(!a || !a.index) return 1
      if(!b || !b.index) return -1
      if(a.index < b.index) return -1
      if(a.index > b.index) return 1
      return 0
    })

    let lastMatchEnd = 0
    let currentMatchStart = 0
    let currentMatchEnd = -1
    let result = ""

    for(const match of matches) {
      if(!match || (!match.index && match.index !== 0) || !match.string || typeof match.string != "string") continue

      const start = match.index
      const end = match.index + match.string.length

      if(start <= currentMatchEnd) {
        if(end > currentMatchEnd) currentMatchEnd = end
      } else if(currentMatchEnd == -1) {
        currentMatchStart = start
        currentMatchEnd = end
      } else {
        result += message.content.slice(lastMatchEnd, currentMatchStart)
        result += editPattern.replaceAll("$match$", message.content.slice(currentMatchStart, currentMatchEnd))
        lastMatchEnd = currentMatchEnd
        currentMatchStart = start
        currentMatchEnd = end
      }
    }

    if(currentMatchEnd == -1) {
      result = message.content
    } else {
      result += message.content.slice(lastMatchEnd, currentMatchStart)
      result += editPattern.replaceAll("$match$", message.content.slice(currentMatchStart, currentMatchEnd))
      result += message.content.slice(currentMatchEnd)
    }

    log("creating webhook")

    const webhook = await message.channel.createWebhook({
      name: message.member?.nickname || message.author.globalName || message.author.username,
      avatar: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}`,
    })

    const embeds = []
    if (message.reference) {
      log("message reference")
      const reference = await message.fetchReference();

      const member = message.guild?.members.cache.find((member => member.id == reference.author.id))
      const tagged = member?.displayName ?? reference.author.displayName

      const embed = new EmbedBuilder()
        .setTitle(`replying to @${tagged}`)
        .setURL(`https://discord.com/channels/${message.guildId}/${message.channelId}/${reference.id}`)

        if (reference.content) {
          log("add message content to embed")
          embed.setDescription(reference.content)
        }

        embeds.push(embed)
    }

    log("sending altered message")
    await webhook.send({
      content: result,
      embeds,
    })

    log("deleting old message")
    await message.delete()

    log("deleting webhook")
    await webhook.delete()
  } catch(error) {
    err(error)
  }
}
