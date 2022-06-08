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

io.on("connection", (socket) => {
    console.log("server connected");
    socket.on("dropTile", (index) => {
        const col = index.col;
        const lowestEmptyRow = findLowestEmptyRowInCol(array, col, rows);

        isFirstPlayer = !isFirstPlayer;
        array[lowestEmptyRow][col] = isFirstPlayer ? 1 : 2;

        const winner = searchForWinner(
            array,
            isFirstPlayer,
            lowestEmptyRow,
            col
        );
        io.emit("updatedState", { array, winner });
    });
    socket.on("restart", () => {
        for (let i = 0; i < rows; i++) {
            array[i].fill(0, 0, columns);
        }
        console.log(array);
        io.emit("startNewGame", { array });
    });
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

app.use("/", (req, res, next) => {
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
    res.status(200).send({ tileData: array });
});
