import "./board.scss";

const Board = ({ tiles, isCurrentPlayersTurn }) => {
  const heading = isCurrentPlayersTurn
    ? "YOUR TURN!"
    : "OTHER PLAYER'S TURN...";

  return (
    <div>
      <h1>{heading}</h1>
      <div className="game-board">
        <div className="grid">{tiles}</div>
      </div>
    </div>
  );
};

export default Board;
