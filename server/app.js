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
    sockets: [],
    socketToUidMap: {},
    socketToPlayerMap: {},
  },
};

io.on("connection", (socket) => {
  let roomId = addSocketToRoom(rooms, socket);

  //pull out the array and maps from room
  let { sockets, socketToUidMap, socketToPlayerMap } = rooms[roomId];

  //add socket to socketToUidMap
  const uid = socket.handshake.query.uid;
  socketToUidMap[socket.id] = uid;

  //add socket to socketToPlayerMap
  let playersReady = sockets.length;
  socketToPlayerMap[socket.id] = playersReady;
  console.log("room to sockets map after connect", rooms);

  //if 2 players are in the room, tell the front end 'ready'
  //otherwise tell it 'wait'
  console.log("room id", roomId);
  console.log("players ready", playersReady);
  checkIfReadyToStartGame(playersReady, io, roomId.toString());

  //send the front-end starting state:
  //empty array, undefined winner, first player uid
  socket.emit("updatedState", startingState(sockets, socketToUidMap));

  socket.on("dropTile", (index) => {
    // determine in which room the turn was played
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        roomId = key;
      }
    }
    let { array, socketToUidMap, socketToPlayerMap } = rooms[roomId];

    //figure out where to drop the tile
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    //and which player dropped it, update array
    const playerNumber = socketToPlayerMap[socket.id];
    array[lowestEmptyRow][col] = playerNumber;

    const nextPlayerUid = determineNextPlayerUid(socketToUidMap, socket.id);

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
    console.log("room after winner", rooms[roomId]);
  });

  socket.on("newGame", () => {
    let roomId = addSocketToRoom(rooms, socket);
    let { sockets, socketToUidMap, socketToPlayerMap } = rooms[roomId];

    //add socket to maps
    playersReady = sockets.length;
    socketToPlayerMap[socket.id] = playersReady;
    socketToUidMap[socket.id] = uid;

    playersReady = sockets.length;

    console.log("rooms after restart", rooms);
    console.log("players ready after restart", playersReady);

    // start new game with empty array and first player uid
    socket.emit("updatedState", startingState(sockets, socketToUidMap));

    checkIfReadyToStartGame(playersReady, io, roomId);
  });

  socket.on("disconnect", () => {
    //do nothing if both players are gone from room (after win)
    let roomId = undefined;
    //if one player is left, reset their room
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        roomId = key;
        //let the front end know to display disconnected message
        io.to(roomId.toString()).emit("playerDisconnected");
        console.log(roomId);

        let { sockets, socketToPlayerMap, socketToUidMap, array } =
          rooms[roomId]; // why does it not work?

        //reset the room
        //player who is left with the disconnect message is not assigned to a room
        //until they click 'new game'
        resetRoom(rooms, roomId);
        console.log("in disconnect", rooms);
      }
    }
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
