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

let roomId = 1;
let playersReady = 0;

io.on("connection", (socket) => {
  addSocketToRoom(rooms, socket);

  //set current room id to the one the socket is in
  for (key in rooms) {
    if (rooms[key].sockets.includes(socket.id)) {
      roomId = key;
    }
  }

  //pull out the array and maps from room
  let { array, socketToUidMap, socketToPlayerMap } = rooms[roomId];

  //add socket to socketToUidMap
  const uid = socket.handshake.query.uid;
  rooms[roomId].socketToUidMap[socket.id] = uid;

  //add socket to socketToPlayerMap
  playersReady = rooms[roomId].sockets.length;
  rooms[roomId].socketToPlayerMap[socket.id] = playersReady;
  console.log("room to sockets map after connect", rooms);

  //if 2 players are in the room, tell the front end 'ready'
  //otherwise tell it 'wait'
  console.log("room id", roomId);
  console.log("players ready", playersReady);
  checkIfReadyToStartGame(playersReady, io, roomId.toString());

  //sent the front-end starting state:
  //empty array, undefined winner, first player
  socket.emit(
    "updatedState",
    startingState(rooms[roomId].sockets, rooms[roomId].socketToUidMap)
  );

  socket.on("dropTile", (index) => {
    // determine which room the turn was played
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        roomId = key;
      }
    }
    //figure out where to drop the tile
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(
      rooms[roomId].array,
      col,
      rows
    );

    //and which player dropped it
    const playerNumber = rooms[roomId].socketToPlayerMap[socket.id];
    rooms[roomId].array[lowestEmptyRow][col] = playerNumber;

    const nextPlayerUid = determineNextPlayerUid(
      rooms[roomId].socketToUidMap,
      socket.id
    );

    const winner = searchForWinner(
      rooms[roomId].array,
      playerNumber,
      lowestEmptyRow,
      col
    );

    //send updated array, winner if any, and next player
    io.to(roomId.toString()).emit("updatedState", {
      array: rooms[roomId].array,
      winner,
      nextPlayerUid,
    });

    //if there was a winner, game is over
    //remove players from room and reset room
    if (winner) {
      for (key in rooms) {
        if (rooms[key].sockets.includes(socket.id)) {
          rooms[key].sockets = [];
          rooms[key].socketToPlayerMap = {};
          rooms[key].socketToUidMap = {};
          rooms[key].array = createStartingArray(rows, columns);
        }
      }
    }
  });

  socket.on("newGame", () => {
    addSocketToRoom(rooms, socket);

    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        roomId = key;
      }
    }

    //add their info to the right room
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        playersReady = rooms[key].sockets.length;

        rooms[key].socketToPlayerMap[socket.id] = playersReady;
        rooms[key].socketToUidMap[socket.id] = uid;

        playersReady = rooms[key].sockets.length;
      }
    }
    console.log("rooms after restart", rooms);
    console.log("players ready after restart", playersReady);

    // start new game with empty array and first player uid
    socket.emit(
      "updatedState",
      startingState(rooms[roomId].sockets, rooms[roomId].socketToUidMap)
    );

    checkIfReadyToStartGame(playersReady, io, roomId);
  });

  socket.on("disconnect", () => {
    //assume the player could be removed from their room (on win)
    let roomId = undefined;
    //if they're in a room, find which one (on 'opponent disconnected')
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        roomId = key;
        //let the front end know to display disconnected message
        io.to(roomId.toString()).emit("playerDisconnected");
      }
    }

    //find out in which room the disconnect came from
    //reset the room
    //player who is left with the disconnect message is not assigned to a room
    //until they click 'new game'
    for (key in rooms) {
      if (rooms[key].sockets.includes(socket.id)) {
        rooms[key].sockets = [];
        rooms[key].socketToPlayerMap = {};
        rooms[key].socketToUidMap = {};
        rooms[key].array = createStartingArray(rows, columns);
        console.log("in disconnect", rooms);
      }
    }
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
