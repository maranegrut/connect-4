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
  } else {
    io.to(roomId).emit("waiting");
  }
};

const startingState = (socket, roomToPlayersMap, socketToUidMap, roomId) => {
  // player who connects first goes first
  let firstPlayerSocket;
  for (key in roomToPlayersMap) {
    if (roomToPlayersMap[key].includes(socket.id)) {
      firstPlayerSocket = roomToPlayersMap[key][0];
    }
  }
  const firstPlayerUid = socketToUidMap[firstPlayerSocket];

  return {
    array: createStartingArray(rows, columns),
    winner: undefined,
    nextPlayerUid: firstPlayerUid,
  };
};

const rebuildSocketToPlayerMap = (socketToPlayerMap) => {
  const playersRemaining = Object.keys(socketToPlayerMap);

  for (key of playersRemaining) {
    delete socketToPlayerMap[key]; // delete everyone to remake the map;
    // could also have used let instead of const
  }
  for (key of playersRemaining) {
    socketToPlayerMap[key] = Object.keys(socketToPlayerMap).length + 1;
  }
};

const canAddSocketToExistingRoom = (roomToPlayersMap, socket) => {
  for (roomId in roomToPlayersMap) {
    if (roomToPlayersMap[roomId].length < 2) {
      // if yes, add player to that room
      socket.join(roomId);
      roomToPlayersMap[roomId].push(socket.id);
      return true;
    }
  }
  return false;
};

const determineNextPlayerUid = (socketToUserMap, socketId) => {
  // it's their turn if they're not the one who just played
  // aka if they're not the one whose socket we got the message from
  // we have the socket id, get the uid corresponding to it
  // send back the id for the front-end to decide
  const uids = Object.values(socketToUserMap);
  const currentPlayerUid = socketToUserMap[socketId];
  const isCurrentPlayerUid = (uid) => uid === currentPlayerUid;
  //if current player uid is at an even index (0, 2, 4, etc.)
  //next player uid is current player uid at index + 1
  const currentPlayerIndex = uids.findIndex(isCurrentPlayerUid);
  let nextPlayerIndex;
  if (currentPlayerIndex % 2 === 0) {
    nextPlayerIndex = currentPlayerIndex + 1;
  } else {
    nextPlayerIndex = currentPlayerIndex - 1;
  }
  console.log("next player index", nextPlayerIndex);
  const nextPlayerUid = uids[nextPlayerIndex];
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
exports.rebuildSocketToPlayerMap = rebuildSocketToPlayerMap;
exports.canAddSocketToExistingRoom = canAddSocketToExistingRoom;
