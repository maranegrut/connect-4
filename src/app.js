import "./app.scss";
import Board from "./components/board";
import Tile from "./components/tile";
import { io } from "socket.io-client";
import { useState, useEffect } from "react";

function App() {
    const [tiles, setTiles] = useState(false);
    const [winner, setWinner] = useState();

    const serverUrl = "http://localhost:5000";

    const socket = io(serverUrl);

    socket.on("updatedState", (updatedData) => {
        populateBoard(updatedData.array);
        setWinner(updatedData.winner);
    });

    socket.on("startNewGame", (data) => {
        populateBoard(data.array);
        setWinner();
    });

    const addTileHandler = async (index) => {
        socket.emit("dropTile", { row: index.row, col: index.col });
    };

    const playAgainHandler = async () => {
        socket.emit("restart");
    };

    const populateBoard = (tileData) => {
        for (let i = 0; i < tileData.length; i++) {
            for (let j = 0; j < tileData[i].length; j++) {
                tileData[i][j] = (
                    <Tile
                        isFilled={tileData[i][j] === 0 ? false : true}
                        playerNumber={tileData[i][j]}
                        addTileHandler={addTileHandler}
                        index={{ row: i, col: j }}
                        key={i + "," + j}
                    />
                );
            }
        }
        setTiles(tileData);
    };

    useEffect(() => {
        const renderBoard = async () => {
            try {
                const response = await fetch(serverUrl);
                const responseData = await response.json();
                populateBoard(responseData.tileData);
            } catch (error) {
                console.log(error);
            }
        };
        renderBoard();

        socket.on("connect", () => {
            console.log("connected", socket.id);
        });
    }, []);

    return (
        <div>
            <Board
                tiles={tiles}
                winner={winner}
                playAgainHandler={playAgainHandler}
            />
        </div>
    );
}

export default App;
