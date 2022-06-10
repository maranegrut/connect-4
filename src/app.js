import "./app.scss";
import Overlay from "./components/overlay";
import Board from "./components/board";
import Tile from "./components/tile";
import { useEffectOnce } from "./hooks/useEffectOnce";
import { io } from "socket.io-client";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

function App() {
  const [tiles, setTiles] = useState(false);
  const [winner, setWinner] = useState();
  const [socket, setSocket] = useState();
  const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState();
  const [uid] = useState(uuidv4());

  const serverUrl = "http://localhost:5000";

  const addTileHandler = async (index, socket) => {
    socket.emit("dropTile", { row: index.row, col: index.col });
  };

  const playAgainHandler = async () => {
    console.log("in play agian", socket.id);
    socket.emit("restart");
  };

  const populateBoard = (tileData, nextPlayerUid, socket) => {
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
    setIsCurrentPlayersTurn(nextPlayerUid === uid);
  };

  useEffectOnce(() => {
    const socket = io(serverUrl, {
      query: {
        uid: uid,
      },
    });
    console.log(uid);

    socket.on("updatedState", (updatedData) => {
      populateBoard(updatedData.array, updatedData.nextPlayerUid, socket);
      setWinner(updatedData.winner);
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log("connected", socket.id);
    });
  }, []);

  return (
    <div>
      <Board tiles={tiles} isCurrentPlayersTurn={isCurrentPlayersTurn} />
      {winner && (
        <Overlay playerNumber={winner} playAgainHandler={playAgainHandler} />
      )}
    </div>
  );
}

export default App;
