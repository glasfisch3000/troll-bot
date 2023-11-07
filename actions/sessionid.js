const crypto = require("crypto")

module.exports = () => {
  const randomBuffer = new Uint32Array(2);
  crypto.getRandomValues(randomBuffer);

  const part1 = ('00000000' + randomBuffer[0].toString(16).toUpperCase()).slice(-8)
  const part2 = ('00000000' + randomBuffer[1].toString(16).toUpperCase()).slice(-8)

  return part1 + part2
}
