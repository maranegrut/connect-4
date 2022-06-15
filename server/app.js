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
  rebuildSocketToPlayerMap,
  canAddSocketToExistingRoom,
} = require("./utilities");

const app = express();

const expressServer = app.listen(5000);

const io = require("socket.io")(expressServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const rows = 6;
const columns = 7;
const array = createStartingArray(rows, columns);

const socketToUidMap = {
  //socket1: user1
  //socket2: user2
  //etc.
};

const socketToPlayerMap = {
  //socket1: 1
  //socket2: 2
  //etc.
};

const roomToPlayersMap = {
  1: [],
  //roomId: [socket1, socket2]
  //etc.
};

let roomId = 1;
let playersReady = 0;

io.on("connection", (socket) => {
  // check if any existing rooms have less than 2 players
  // if no room available, make new room
  if (!canAddSocketToExistingRoom(roomToPlayersMap, socket)) {
    roomToPlayersMap[+roomId + 1] = [socket.id];
  }
  for (key in roomToPlayersMap) {
    if (roomToPlayersMap[key].includes(socket.id)) {
      roomId = key;
      console.log("roomId", roomId);
    }
  }
  console.log("room to sockets map", roomToPlayersMap);

  const uid = socket.handshake.query.uid;
  socketToUidMap[socket.id] = uid;
  console.log("socket to uid map", socketToUidMap);

  let numberOfPlayersConnected = Object.keys(socketToPlayerMap).length + 1;
  socketToPlayerMap[socket.id] = numberOfPlayersConnected;

  playersReady = roomToPlayersMap[roomId].length;
  console.log("room id", roomId);
  console.log("players ready", playersReady);
  checkIfReadyToStartGame(playersReady, io, roomId.toString());

  socket.emit(
    "updatedState",
    startingState(socket, roomToPlayersMap, socketToUidMap, roomId)
  );

  socket.on("dropTile", (index) => {
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    const playerNumber = socketToPlayerMap[socket.id];
    array[lowestEmptyRow][col] = playerNumber;

    const nextPlayerUid = determineNextPlayerUid(socketToUidMap, socket.id);

    const winner = searchForWinner(array, playerNumber, lowestEmptyRow, col);
    for (key in roomToPlayersMap) {
      if (roomToPlayersMap[key].includes(socket.id)) {
        roomId = key;
        console.log("roomId", roomId);
      }
    }
    console.log("dropping tile in room", roomId);
    io.to(roomId.toString()).emit("updatedState", {
      array,
      winner,
      nextPlayerUid,
    });
  });

  socket.on("restart", () => {
    for (let i = 0; i < rows; i++) {
      array[i].fill(0, 0, columns);
    }

    io.to(roomId.toString()).emit(
      "updatedState",
      startingState(socket, roomToPlayersMap, socketToUidMap, roomId)
    );

    playersReady = Object.keys(socketToPlayerMap).length;
    checkIfReadyToStartGame(playersReady, io);
  });

  socket.on("disconnect", () => {
    io.to(roomId.toString()).emit("playerDisconnected");

    delete socketToPlayerMap[socket.id];
    delete socketToUidMap[socket.id];

    for (key in roomToPlayersMap) {
      console.log("in disconnect");
      if (roomToPlayersMap[key].includes(socket.id)) {
        const index = roomToPlayersMap[key].indexOf(socket.id);
        console.log(roomToPlayersMap);
        roomToPlayersMap[key].splice(index, 1);
        console.log(roomToPlayersMap);
      }
    }

    rebuildSocketToPlayerMap(socketToPlayerMap);

    playersReady = 0;
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
