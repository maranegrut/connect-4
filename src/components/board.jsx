import "./board.scss";
import Overlay from "./overlay";

const Board = ({ tiles, winner, playAgainHandler }) => {
    return (
        <div>
            <h1>SOMEBODY'S TURN</h1>
            <div className="game-board">
                <div className="grid">{tiles}</div>
            </div>
            {winner && (
                <Overlay
                    playerNumber={winner}
                    playAgainHandler={playAgainHandler}
                />
            )}
        </div>
    );
};

export default Board;
