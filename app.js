const discordjs = require("discord.js")
const { Client, GatewayIntentBits } = discordjs
const token = require(__dirname + "/token.js")

console.log("[setup] library imports done")

const client = new Client({ intents: [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] })
client.once("ready", () => {
	console.log("[setup] discord.js client ready")
})

client.login(token)
	.then(() => {
		console.log("[setup] successfully logged in to discord api")
	})
	.catch(err => {
		throw err
	})

require(__dirname + "/actions.js")(client)
