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

let isFirstPlayer = false;

const rows = 6;
const columns = 7;
const array = createStartingArray(rows, columns);

const socketToUserMap = {
  //uid1: socket1
  //uid2: socket2
  //etc.
};

const playerToSocketMap = {
  //socket1: 1
  //socket2: 2
  //etc.
};

//if socket is equal to the socket that is sending data, return 'other player's turn now'
io.on("connection", (socket) => {
  console.log("server connected");
  console.log("uid", socket.handshake.query.uid);
  const uid = socket.handshake.query.uid;
  socketToUserMap[uid] = socket.id;
  console.log("socket to user map", socketToUserMap);

  const numberOfPlayersConnected = Object.keys(playerToSocketMap).length;
  console.log("players connected", numberOfPlayersConnected);
  playerToSocketMap[socket.id] = numberOfPlayersConnected + 1;
  console.log("player to socket map", playerToSocketMap);

  const winner = undefined;
  socket.emit("updatedState", { array, winner });

  socket.on("dropTile", (index) => {
    const col = index.col;
    const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

    isFirstPlayer = !isFirstPlayer;
    console.log("current socket ID", socket.id);
    array[lowestEmptyRow][col] = playerToSocketMap[socket.id];
    console.log(array);

    const winner = searchForWinner(array, isFirstPlayer, lowestEmptyRow, col);
    io.emit("updatedState", { array, winner });
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
