import "./app.scss";
import Overlay from "./components/winnerOverlay";
import Board from "./components/board";
import Tile from "./components/tile";
import { useEffectOnce } from "./hooks/useEffectOnce";
import { io } from "socket.io-client";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import LoadingScreen from "./components/loadingScreen";
import DisconnectedOverlay from "./components/disconnectedOverlay";

function App() {
  const [tiles, setTiles] = useState();
  const [winner, setWinner] = useState();
  const [socket, setSocket] = useState();
  const [isReady, setIsReady] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState();
  const [uid] = useState(uuidv4());

  const serverUrl = "http://localhost:5000";

  const addTileHandler = async (index, socket, canPlay) => {
    if (canPlay) {
      socket.emit("dropTile", { row: index.row, col: index.col });
    }
  };

  const playAgainHandler = async () => {
    setOpponentDisconnected(false);
    socket.emit("newGame");
  };

  const populateBoard = (tileData, nextPlayerUid, socket) => {
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
            isCurrentPlayersTurn={nextPlayerUid === uid} //have to pass this to tile handler bc otherwise undefined
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

    setSocket(socket);

    socket.on("ready", () => {
      setIsReady(true);
    });

    socket.on("waiting", () => {
      setIsReady(false);
    });

    socket.on("updatedState", (updatedData) => {
      populateBoard(updatedData.array, updatedData.nextPlayerUid, socket);
      setWinner(updatedData.winner);
    });

    socket.on("playerDisconnected", () => {
      setOpponentDisconnected(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const heading = isCurrentPlayersTurn ? "YOUR TURN!" : "OPPONENT'S TURN...";

  return (
    <div>
      <h1>{isReady ? heading : ""}</h1>
      <p>{uid}</p>
      {opponentDisconnected && (
        <DisconnectedOverlay playAgainHandler={playAgainHandler} />
      )}
      {!isReady && !opponentDisconnected && <LoadingScreen />}
      <Board tiles={tiles} />
      {winner && (
        <Overlay
          playerNumber={winner}
          iWon={winner && !isCurrentPlayersTurn}
          playAgainHandler={playAgainHandler}
        />
      )}
    </div>
  );
}

export default App;
