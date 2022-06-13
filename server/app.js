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

let playersReady = 0;

io.on("connection", (socket) => {
  const uid = socket.handshake.query.uid;
  socketToUidMap[socket.id] = uid;
  console.log(socketToUidMap);

  let numberOfPlayersConnected = Object.keys(socketToPlayerMap).length + 1;
  socketToPlayerMap[socket.id] = numberOfPlayersConnected;

  playersReady++;

  checkIfReadyToStartGame(playersReady, io);

  socket.emit("updatedState", startingState(socketToUidMap));

  socket.on("dropTile", (index) => {
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    const playerNumber = socketToPlayerMap[socket.id];
    array[lowestEmptyRow][col] = playerNumber;

    const nextPlayerUid = determineNextPlayerUid(socketToUidMap, socket.id);

    const winner = searchForWinner(array, playerNumber, lowestEmptyRow, col);

    io.emit("updatedState", { array, winner, nextPlayerUid });
  });

  socket.on("restart", () => {
    for (let i = 0; i < rows; i++) {
      array[i].fill(0, 0, columns);
    }

    io.emit("updatedState", startingState(socketToUidMap));

    playersReady = Object.keys(socketToPlayerMap).length;
    checkIfReadyToStartGame(playersReady, io);
  });

  socket.on("disconnect", () => {
    io.emit("playerDisconnected");

    delete socketToPlayerMap[socket.id];
    delete socketToUidMap[socket.id];

    rebuildSocketToPlayerMap(socketToPlayerMap);

    playersReady = 0;
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
