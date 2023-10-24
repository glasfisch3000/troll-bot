async function init() {
	const { log, err, childLogger, reset } = require(__dirname + "/logging.js")(["app"])

	try {
		log("starting app")
		log("importing libraries")

		const discordjs = require("discord.js")
		const { Client, GatewayIntentBits } = discordjs
		const token = require(__dirname + "/token.js")

		log("library imports done")
		log("starting client")

		const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions] })
		client.once("ready", async () => {
			log("discord.js client ready")
			log("starting action.js")
			require(__dirname + "/actions.js")(client, childLogger)
		})

		client.login(token)
			.then(() => {
				log("successfully logged in to discord api")
			})
			.catch(error => {
				throw error
			})
	} catch(error) {
		err(error)
		throw error
	}
}

init()
