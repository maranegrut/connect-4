import "./app.scss";
import Overlay from "./components/overlay";
import Board from "./components/board";
import Tile from "./components/tile";
import { io } from "socket.io-client";
import { useState, useEffect } from "react";

function App() {
  const [tiles, setTiles] = useState(false);
  const [winner, setWinner] = useState();
  const [socket, setSocket] = useState();

  const serverUrl = "http://localhost:5000";

  const addTileHandler = async (index, socket) => {
    socket.emit("dropTile", { row: index.row, col: index.col });
  };

  const playAgainHandler = async () => {
    console.log("in play agian", socket.id);
    socket.emit("restart");
  };

  const populateBoard = (tileData, socket) => {
    console.log("in populate board", socket.id);
    for (let i = 0; i < tileData.length; i++) {
      for (let j = 0; j < tileData[i].length; j++) {
        tileData[i][j] = (
          <Tile
            isFilled={tileData[i][j] === 0 ? false : true}
            playerNumber={tileData[i][j]}
            addTileHandler={addTileHandler}
            index={{ row: i, col: j }}
            key={i + "," + j}
            socket={socket}
          />
        );
      }
    }
    setTiles(tileData);
  };

  useEffect(() => {
    const socket = io(serverUrl);

    socket.on("updatedState", (updatedData) => {
      populateBoard(updatedData.array, socket);
      setWinner(updatedData.winner);
    });

    const renderBoard = async () => {
      try {
        const response = await fetch(serverUrl);
        const responseData = await response.json();
        populateBoard(responseData.tileData, socket);
      } catch (error) {
        console.log(error);
      }
    };
    renderBoard();
    setSocket(socket);

    socket.on("connect", () => {
      console.log("connected", socket.id);
    });
  }, []);

  return (
    <div>
      <Board tiles={tiles} />
      {winner && (
        <Overlay playerNumber={winner} playAgainHandler={playAgainHandler} />
      )}
    </div>
  );
}

export default App;
