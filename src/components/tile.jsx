import "./tile.scss";

const Tile = ({ isFilled, playerNumber, addTileHandler, index, socket }) => {
  const sendIndex = () => {
    addTileHandler(index, socket);
  };

  return (
    <div className="grid-item" onClick={!isFilled ? sendIndex : null}>
      {isFilled && (
        <div className={`tile ${playerNumber === 2 ? "yellow" : ""}`}></div>
      )}
    </div>
  );
};

export default Tile;
