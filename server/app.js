const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const {
  createStartingArray,
  searchForWinner,
  findLowestEmptyRowInCol,
} = require("./utilities");

const app = express();

const expressServer = app.listen(5000);

const io = require("socket.io")(expressServer, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const rows = 6;
const columns = 7;
const array = createStartingArray(rows, columns);

const socketToUserMap = {
  //socket1: user1
  //socket2: user2
  //etc.
};

const playerToSocketMap = {
  //socket1: 1
  //socket2: 2
  //etc.
};

io.on("connection", (socket) => {
  const uid = socket.handshake.query.uid;
  socketToUserMap[socket.id] = uid;

  const numberOfPlayersConnected = Object.keys(playerToSocketMap).length;
  playerToSocketMap[socket.id] = numberOfPlayersConnected + 1;

  const winner = undefined;
  // player who connects first goes first
  const firstPlayer = Object.values(socketToUserMap)[0];
  socket.emit("updatedState", {
    array,
    winner,
    nextPlayerUid: firstPlayer,
  });

  socket.on("dropTile", (index) => {
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    const playerNumber = playerToSocketMap[socket.id];
    array[lowestEmptyRow][col] = playerNumber;

    // it's their turn if they're not the one who just played
    // aka if they're not the one whose socket we got the message from
    // we have the socket id, get the uid corresponding to it
    // send back the id for the front-end to decide
    const uids = Object.values(socketToUserMap);
    const currentPlayerUid = socketToUserMap[socket.id];
    const isCurrentPlayersUid = (uid) => uid === currentPlayerUid;
    const nextPlayerIndex =
      uids.findIndex(isCurrentPlayersUid) + 1 < uids.length
        ? uids.findIndex(isCurrentPlayersUid) + 1
        : 0;

    const nextPlayerUid = uids[nextPlayerIndex];
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
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));
