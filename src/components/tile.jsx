import "./tile.scss";

const Tile = ({ value, index, addTileHandler }) => {
  const sendTileInfo = () => {
    addTileHandler(index);
  };

  return (
    <div className="grid-item" onClick={value === 0 ? sendTileInfo : null}>
      <div
        className={`tile ${value === 2 ? "yellow" : ""} ${
          value !== 0 ? "clicked" : ""
        }`}
      ></div>
    </div>
  );
};

export default Tile;
