import "./tile.scss";

const Tile = ({
  isFilled,
  playerNumber,
  addTileHandler,
  index,
  socket,
  isCurrentPlayersTurn,
}) => {
  const sendTileInfo = () => {
    addTileHandler(index, socket, isCurrentPlayersTurn);
  };

  return (
    <div className="grid-item" onClick={!isFilled ? sendTileInfo : null}>
      <div
        className={`tile ${playerNumber === 2 ? "yellow" : ""} ${
          isFilled ? "clicked" : ""
        }`}
      ></div>
    </div>
  );
};

export default Tile;
