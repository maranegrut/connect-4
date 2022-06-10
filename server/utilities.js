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
exports.searchForWinner = searchForWinner;
exports.findLowestEmptyRowInCol = findLowestEmptyRowInCol;
