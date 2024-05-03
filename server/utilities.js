const rows = 6;
const columns = 7;

const Directions = {
  horizontal: "horizontal",
  vertical: "vertical",
  diagonalUp: "diagonalUp",
  diagonalDown: "diagonalDown",
};

const createStartingArray = (rows, columns) => {
  const array = new Array(rows);
  for (let i = 0; i < rows; i++) {
    array[i] = new Array(columns);
    array[i].fill(0, 0, columns);
  }
  return array;
};

const findLowestEmptyRowInCol = (array, col, rows) => {
  let lowestEmptyRow = 0;
  let i = 0;
  while (i < rows) {
    if (array[i][col] === 0) {
      lowestEmptyRow = i;
    }
    i++;
  }
  return lowestEmptyRow;
};

const checkIfReadyToStartGame = (playersReady, io, roomId) => {
  if (playersReady >= 2) {
    io.to(roomId).emit("ready");
    console.log("emitting ready to room", roomId);
  } else {
    io.to(roomId).emit("waiting");
    console.log("emitting wait to room", roomId);
  }
};

const startingState = (socketsInRoom) => {
  // player who connects first goes first
  const firstPlayerUid = socketsInRoom[0].uid;

  return {
    array: createStartingArray(rows, columns),
    winner: undefined,
    nextPlayerUid: firstPlayerUid,
  };
};

const addSocketToRoom = (rooms, socket) => {
  const uid = socket.handshake.query.uid;

  //check first if there is a room with a player waiting
  for (roomId in rooms) {
    if (rooms[roomId].sockets.length === 1) {
      socket.join(roomId);
      rooms[roomId].sockets.push({ id: socket.id, uid: uid, playerNumber: 2 });
      return roomId;
    }
  }

  //else check if there is an empty room
  for (roomId in rooms) {
    if (rooms[roomId].sockets.length === 0) {
      socket.join(roomId);
      rooms[roomId].sockets.push({ id: socket.id, uid: uid, playerNumber: 1 });
      return roomId;
    }
  }
  //if not, add socket to new room
  const newRoomId = +roomId + 1;
  socket.join(newRoomId);
  rooms[newRoomId] = {
    array: createStartingArray(rows, columns),
    sockets: [{ id: socket.id, uid: uid, playerNumber: 1 }],
  };

  return newRoomId;
};

const findRoomId = (rooms, socket) => {
  for (key in rooms) {
    const socketIds = rooms[key].sockets.map((socket) => socket.id);
    if (socketIds.includes(socket.id)) {
      console.log("room id", key);
      return key.toString();
    }
  }
  return undefined;
};

const resetRoom = (rooms, roomId) => {
  rooms[roomId].sockets = [];
  rooms[roomId].array = createStartingArray(rows, columns);
};

const determineNextPlayerUid = (sockets, currentPlayerIndex) => {
  // it's their turn if they're not the one who just played
  // aka if they're not the one whose socket we got the message from
  // we have the socket id, get the uid corresponding to it
  // send back the id for the front-end to decide
  const nextPlayerIndex = currentPlayerIndex === 1 ? 0 : 1;
  console.log("next player index", nextPlayerIndex);
  const nextPlayerUid = sockets[nextPlayerIndex].uid;
  return nextPlayerUid;
};

const findStartingIndex = (array, playerNumber, row, col, direction) => {
  let startingIndex;

  if (direction === Directions.vertical) {
    startingIndex = { row, col };
  }
  if (direction === Directions.horizontal) {
    while (0 <= col && col < columns) {
      if (array[row][col - 1] !== playerNumber) {
        startingIndex = { row, col };
        break;
      }
      col--;
    }
  }
  if (direction === Directions.diagonalDown) {
    while (0 <= col && col < columns) {
      if (0 <= row && row < rows) {
        if (array[row - 1]) {
          if (array[row - 1][col - 1] !== playerNumber) {
            startingIndex = { row, col };
            break;
          }
        } else {
          startingIndex = { row, col };
          break;
        }
      }
      col--;
      row--;
    }
  }
  if (direction === Directions.diagonalUp) {
    while (0 <= col && col < columns) {
      if (0 <= row && row < rows) {
        if (array[row + 1]) {
          if (array[row + 1][col - 1] !== playerNumber) {
            startingIndex = { row, col };
            break;
          }
        } else {
          startingIndex = { row, col };
          break;
        }
      }
      col--;
      row++;
    }
  }
  return startingIndex;
};

const findStreak = (array, playerNumber, row, col, direction) => {
  let streak = 0;
  const startingIndex = findStartingIndex(
    array,
    playerNumber,
    row,
    col,
    direction
  );
  row = startingIndex.row;
  col = startingIndex.col;

  while (0 <= row && row < rows) {
    if (0 <= col && col < columns) {
      if (array[row][col] === playerNumber) {
        streak++;
      } else break;
      if (direction === Directions.horizontal) col++;
      if (direction === Directions.vertical) row++;
      if (direction === Directions.diagonalUp) {
        col++;
        row--;
      }
      if (direction === Directions.diagonalDown) {
        col++;
        row++;
      }
    } else break;
  }
  return streak;
};

const searchForWinner = (array, playerNumber, row, col) => {
  const directions = ["vertical", "horizontal", "diagonalUp", "diagonalDown"];

  for (const direction of directions) {
    const streak = findStreak(array, playerNumber, row, col, direction);
    if (streak >= 4) {
      const winner = playerNumber;
      console.log("WINNER: ", winner);
      return winner;
    }
  }
};

exports.createStartingArray = createStartingArray;
exports.findLowestEmptyRowInCol = findLowestEmptyRowInCol;
exports.determineNextPlayerUid = determineNextPlayerUid;
exports.searchForWinner = searchForWinner;
exports.checkIfReadyToStartGame = checkIfReadyToStartGame;
exports.startingState = startingState;
exports.addSocketToRoom = addSocketToRoom;
exports.resetRoom = resetRoom;
exports.findRoomId = findRoomId;
