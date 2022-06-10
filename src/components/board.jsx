import "./board.scss";

const Board = ({ tiles }) => {
  return (
    <div className="game-board">
      <div className="grid">{tiles}</div>
    </div>
  );
};

export default Board;
