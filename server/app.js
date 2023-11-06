const express = require("express");
const server = express();
const http = require("http").Server(server);
const port = 4269;

const { log, err, childLogger } = require(__dirname + "/../logging.js")(["app"]);

server.get("/", (req, res) => {
  res.redirect("https://betterrickrollredirect.github.io")
})

server.get("/style.css", (req, res) => {
  res.sendFile(__dirname + "/client/style.css");
})

server.get("/game.js", (req, res) => {
  res.sendFile(__dirname + "/client/game.js");
})

let clients = [];
let chat = [];
let playerConnectionTimeout = 25_000;

function newGame() {
  let random = Math.random();
  if(random<0.33) database.createGame(7, 5, 4, true);
  else if(random<0.66) database.createGame(3, 3, 3, false);
  else database.createGame(5, 5, 4, false);
}

function checkPlayerConnections() {
  for (let socket of clients) {
    if (socket) {
      let player = database.getPlayer(socket.handshake.address);
      if (player) {
        if (socket.connected) player.updateConnection();
        if (player.getCurrentGame() && player.getConnectionOffset() > playerConnectionTimeout) kickPlayer(socket);
      }
    }
  }
}

function kickPlayer(socket) {
  if(!socket) return;

  var player = database.getPlayer(socket.handshake.address);
  if(!player) return;

  logger.log("kicking player for inactivity (" + player.getConnectionOffset() + "ms): " + socket.handshake.address);
  player.kickFromGame();

  socket.emit("kick", "inactivity");
}

setInterval(checkPlayerConnections, 1000);

const io = require("socket.io")(http);
io.on("connection", (socket) => {
  database.connect(socket.handshake.address);
  clients.push(socket);
  logger.log("player connected: " + socket.handshake.address);

  distributePlayer();

  socket.on("disconnect", () => {
    logger.log("player disconnected: " + socket.handshake.address);
  })

  socket.on("game-data", () => {
    var game = getGame();
    if(!game) {
      socket.emit("game-data", null);
      return;
    }

    var gameObj = {};
    gameObj.game = game.game;
    gameObj.player1 = database.getUsername(game.player1);
    gameObj.player2 = database.getUsername(game.player2);
    gameObj.winner = game.winner;
    gameObj.width = game.width;
    gameObj.height = game.height;
    gameObj.minLength = game.minLength;
    gameObj.id = game.id;
    socket.emit("game-data", gameObj);
  })

  socket.on("available", () => {
    socket.emit("available", available());
  })

  socket.on("turn", (pos) => {
    logger.log("socket.io: 'turn', " + JSON.stringify(pos));
    if(!pos) return;
    if(available()) {
      pos.x = parseInt(pos.x);
      pos.y = parseInt(pos.y);
      var game = getGame();
      if(pos.x>=0 && pos.x<game.width && pos.y>=0 && pos.y<game.height && game.game && game.game[pos.x] && !game.game[pos.x][pos.y]) {
        while(game.fallThrough && pos.y<game.height-1 && !game.game[pos.x][pos.y+1]) pos.y++;
        game.game[pos.x][pos.y] = getPlayerNum();
        game.turn++;
        if(game.turn>2) game.turn = 1;

        game.checkWinner();
        if(game.winner) logger.log("game " + game.id + (game.winner===1 || game.winner===2 ? " won by player " + game.winner : (game.winner===3 ? " drawn" : " ended with unknown winner: " + game.winner)));
      }
    }
  })

  socket.on("player-data", () => {
    socket.emit("player-data", getPlayerNum());
  })

  socket.on("client-data", () => {
    socket.emit("client-data", socket.handshake.address);
  })

  socket.on("username", () => {
    socket.emit("username", database.getUsername(socket.handshake.address));
  })

  socket.on("rename", (newUsername) => {
    if(!newUsername || !("" + newUsername)) return;

    logger.log("player " + socket.handshake.address + " rename: '" + database.getUsername(socket.handshake.address) + "' -> '" + newUsername + "'");

    var text = database.getUsername(socket.handshake.address) + " ";
    database.rename(socket.handshake.address, "" + newUsername);
    text += "hat seinen Namen zu '" + newUsername + "' geändert";

    chatMessage({system: true}, text, new Date().getTime());
  })

  socket.on("chat-message", (msg) => {
    logger.log("socket.io: 'chat-message', '" + msg + "' (ip: " + socket.handshake.address + ")");
    if(msg) {
      chatMessage({ip: socket.handshake.address}, "[" + database.getUsername(socket.handshake.address) + "] " + msg, new Date().getTime());
    }
  })

  socket.on("chat-data", () => {
    socket.emit("chat-data", chat);
  })

  socket.on("end-game", () => {
    logger.log("socket.io: 'end-game'");
    var game = getGame();
    if(!game) return;
    game.end();
  })

  socket.on("distribute", () => {
    distributePlayer();
  })

  socket.on("custom-game", (game) => {
    logger.log("socket.io: 'custom-game', " + JSON.stringify(game))
    if(!game) return;
    var width = parseInt(game.width) || 0;
    var height = parseInt(game.height) || 0;
    var minLength = parseInt(game.minLength) || 0;
    var fallThrough = game.fallThrough ? true : false;

    var gameID = database.createGame(width, height, minLength, fallThrough);

    if(gameID) database.joinGame(socket.handshake.address, gameID);
    else socket.emit("chat-message", {player: {system: true, error: true}, msg: "[System] Ein Fehler ist aufgetreten, das Spiel konnte nicht erstellt werden", time: new Date().getTime()})
  })

  function available() {
    var game = getGame();
    return game && !game.winner && ((game.player1===socket.handshake.address && game.turn===1) || (game.player2===socket.handshake.address && game.turn===2));
  }

  function getGame() {
    var player = database.getPlayer(socket.handshake.address);
    if(player) return player.getCurrentGame();
    else return null;
  }

  function chatMessage(player, msg, time) {
    var chat_obj = {player: player, msg: msg, time: time};
    chat.push(chat_obj);
    io.emit("chat-message", chat_obj);
  }

  function getPlayerNum() {
    var game = getGame();
    return game ? (game.player1===socket.handshake.address ? 1 : (game.player2===socket.handshake.address ? 2 : 0)) : 0
  }

  function distributePlayer() {
    database.distributePlayer(socket.handshake.address);
    if(!getGame()) {
      newGame();
      database.distributePlayer(socket.handshake.address);
    }
  }
})

http.listen(port, () => {logger.log("listening on port " + port)});
