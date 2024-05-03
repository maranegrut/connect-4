const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const {
  createStartingArray,
  searchForWinner,
  findLowestEmptyRowInCol,
  determineNextPlayerUid,
  checkIfReadyToStartGame,
  startingState,
  addSocketToRoom,
  resetRoom,
  findRoomId,
} = require("./utilities");

const app = express();

const expressServer = app.listen(5000);

const io = require("socket.io")(expressServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const rows = 6;
const columns = 7;

const rooms = {
  1: {
    array: createStartingArray(rows, columns),
    sockets: [
      //{ id, uid, playerNumber }
    ],
  },
};

io.on("connection", (socket) => {
  let roomId = addSocketToRoom(rooms, socket);
  console.log("room to sockets map after connect", rooms);
  console.log("room id", roomId);

  let { sockets } = rooms[roomId];
  let playersReady = sockets.length;
  console.log("players ready", playersReady);

  //if 2 players are in the room, tell the front end 'ready'
  //otherwise tell it 'wait'
  checkIfReadyToStartGame(playersReady, io, roomId.toString());

  //send the front-end starting state:
  //empty array, undefined winner, first player uid
  socket.emit("updatedState", startingState(sockets));

  socket.on("turn", (index) => {
    console.log("playing a turn", index);
    // determine in which room the turn was played
    roomId = findRoomId(rooms, socket);

    let { array, sockets } = rooms[roomId];

    //figure out which player added the tile
    const roomSocketIds = sockets.map((socket) => socket.id);
    const socketIndex = roomSocketIds.indexOf(socket.id);
    const playerNumber = sockets[socketIndex].playerNumber;

    //update array
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);
    array[lowestEmptyRow][col] = playerNumber;

    const nextPlayerUid = determineNextPlayerUid(sockets, socketIndex);

    const winner = searchForWinner(array, playerNumber, lowestEmptyRow, col);

    //send updated array, winner if any, and next player
    io.to(roomId.toString()).emit("updatedState", {
      array: array,
      winner,
      nextPlayerUid,
    });

    //if there was a winner, game is over
    //remove players from room and reset room
    if (winner) {
      resetRoom(rooms, roomId);
    }
    console.log("room after turn", rooms[roomId]);
  });

  socket.on("newGame", () => {
    let roomId = addSocketToRoom(rooms, socket);
    let { sockets } = rooms[roomId];

    //add socket to maps
    playersReady = sockets.length;

    console.log("rooms after restart", rooms);
    console.log("players ready after restart", playersReady);

    // start new game with empty array and first player uid
    socket.emit("updatedState", startingState(sockets));

    checkIfReadyToStartGame(playersReady, io, roomId);
  });

  socket.on("disconnect", () => {
    //do nothing if both players are gone from room (after win)
    //if one player is left, find and reset their room
    const roomId = findRoomId(rooms, socket);
    if (roomId) {
      //let the front end know to display disconnected message
      io.to(roomId).emit("playerDisconnected");

      //reset the room
      //player who is left with the disconnect message is not assigned to a room
      //until they click 'new game'
      resetRoom(rooms, roomId);
    }

    console.log("in disconnect", rooms);
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
