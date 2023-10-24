const fs = require("fs").promises
var actions = []

async function init(client) {
  console.log("[actions-setup] listing action files")
  const files = await fs.readdir(__dirname + "/actions")

  console.log("[actions-setup] importing action files")
  for(const file of files) {
    if(file.endsWith(".action.js")) {
      actions.push(require(__dirname + "/actions/" + file))
    }
  }
  console.log("[actions-setup] successfully imported action files")

  for(const action of actions) {
    action(client)
  }

  console.log("[action-setup] setup done")
}

module.exports = init
