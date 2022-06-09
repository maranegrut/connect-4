import "./board.scss";

const Board = ({ tiles }) => {
  return (
    <div>
      <h1>SOMEBODY'S TURN</h1>
      <div className="game-board">
        <div className="grid">{tiles}</div>
      </div>
    </div>
  );
};

export default Board;
