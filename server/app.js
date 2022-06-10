const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const {
  createStartingArray,
  searchForWinner,
  findLowestEmptyRowInCol,
  determineNextPlayerUid,
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

io.on("connection", (socket) => {
  const uid = socket.handshake.query.uid;
  socketToUidMap[socket.id] = uid;
  console.log(socketToUidMap);

  const numberOfPlayersConnected = Object.keys(socketToPlayerMap).length;
  socketToPlayerMap[socket.id] = numberOfPlayersConnected + 1;

  const winner = undefined;

  // player who connects first goes first
  const firstPlayerUid = Object.values(socketToUidMap)[0];
  socket.emit("updatedState", {
    array,
    winner,
    nextPlayerUid: firstPlayerUid,
  });

  socket.on("dropTile", (index) => {
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    const playerNumber = socketToPlayerMap[socket.id];
    array[lowestEmptyRow][col] = playerNumber;
    console.log(socketToPlayerMap);

    const nextPlayerUid = determineNextPlayerUid(socketToUidMap, socket.id);

    const winner = searchForWinner(array, playerNumber, lowestEmptyRow, col);

    io.emit("updatedState", { array, winner, nextPlayerUid });
  });

  socket.on("restart", () => {
    for (let i = 0; i < rows; i++) {
      array[i].fill(0, 0, columns);
    }
    const winner = undefined;
    io.emit("updatedState", { array, winner });
  });

  socket.on("disconnect", () => {
    delete socketToPlayerMap[socket.id];
    delete socketToUidMap[socket.id];
  });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
