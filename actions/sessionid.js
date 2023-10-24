module.exports = () => {
  return ('0000000000000000' + Math.floor(Math.random() * 0xffff_ffff_ffff_ffff).toString(16).toUpperCase()).slice(-16)
}
