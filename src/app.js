import "./app.scss";
import Overlay from "./components/winnerOverlay";
import Board from "./components/board";
import { useEffectOnce } from "./hooks/useEffectOnce";
import { io } from "socket.io-client";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import LoadingScreen from "./components/loadingScreen";
import DisconnectedOverlay from "./components/disconnectedOverlay";

function App() {
  const [boardArray, setBoardArray] = useState([]);
  const [winner, setWinner] = useState();
  const [socket, setSocket] = useState();
  const [isReady, setIsReady] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [isCurrentPlayersTurn, setIsCurrentPlayersTurn] = useState();
  const [uid] = useState(uuidv4());

  const serverUrl = "http://localhost:5000";

  const addTileHandler = async (index) => {
    const row = Math.floor(index / 7);
    const col = index % 7;

    if (isCurrentPlayersTurn) {
      socket.emit("turn", { row: row, col: col });
    }
  };

  const playAgainHandler = async () => {
    setOpponentDisconnected(false);
    socket.emit("newGame");
  };

  const populateBoard = (tileData, nextPlayerUid) => {
    setBoardArray(tileData);
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
      populateBoard(updatedData.array, updatedData.nextPlayerUid);
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
      <Board tiles={boardArray} addTileHandler={addTileHandler} />
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
