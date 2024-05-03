import "./board.scss";
import Tile from "./tile";

const Board = ({ tiles, addTileHandler }) => {
  const flatTiles = tiles.flat();

  return (
    <div className="game-board">
      <div className="grid">
        {flatTiles.map((tile, index) => (
          <Tile
            value={tile}
            index={index}
            addTileHandler={addTileHandler}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
