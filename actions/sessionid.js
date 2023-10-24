module.exports = () => {
  ('0000' + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase()).slice(-8)
}
