const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();

let isFirstPlayer = false;

const rows = 6;
const columns = 7;

let array = new Array(rows);
for (let i = 0; i < rows; i++) {
    array[i] = new Array(columns);
    array[i].fill(0, 0, columns);
}

const findStartingIndex = (playerNumber, row, col, direction) => {
    let startingIndex;
    if (direction === "horizontal") {
        while (0 <= row && row < rows) {
            if (array[row][col - 1] !== playerNumber) {
                startingIndex = { row, col };
                break;
            }
            col--;
        }
    }
    if (direction === "vertical") {
        row = 0;
        while (0 <= col && col < columns) {
            if (array[row][col] === playerNumber) {
                startingIndex = { row, col };
                break;
            }
            row++;
        }
    }
    if (direction === "diagonalDown") {
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
    if (direction === "diagonalUp") {
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

const findStreak = (row, col, direction) => {
    const playerNumber = isFirstPlayer ? 1 : 2;

    let streak = 0;

    const startingIndex = findStartingIndex(playerNumber, row, col, direction);
    row = startingIndex.row;
    col = startingIndex.col;

    while (0 <= row && row < rows) {
        if (0 <= col && col < columns) {
            if (array[row][col] === playerNumber) {
                streak++;
            } else break;
            if (direction === "horizontal") col++;
            if (direction === "vertical") row++;
            if (direction === "diagonalUp") {
                col++;
                row--;
            }
            if (direction === "diagonalDown") {
                col++;
                row++;
            }
        } else break;
    }
    if (streak >= 4) {
        console.log("WINNER: ", playerNumber);
        return playerNumber;
    }
};

const determineWinner = (row, col) => {
    findStreak(playerNumber, row, col, "horizontal");
    findStreak(playerNumber, row, col, "vertical");
    findStreak(playerNumber, row, col, "diagonalUp");
    findStreak(playerNumber, row, col, "diagonalDown");
};

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS"
    );
    next();
});

app.get("/", (req, res, next) => {
    res.status(200);
    res.send(array);
});

app.post("/", (req, res, next) => {
    isFirstPlayer = !isFirstPlayer;

    const { row, col } = req.body;
    let newRow = row;

    let i = 0;
    while (i < rows) {
        if (array[i][col] === 0) newRow = i;
        i++;
    }

    array[newRow][col] = isFirstPlayer ? 1 : 2;

    determineWinner(newRow, col, isFirstPlayer);

    res.status(200);
    res.send(array);
});

app.listen(5000);
