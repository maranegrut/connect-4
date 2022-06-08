import "./tile.scss";

const Tile = ({ isFilled, playerNumber, addTileHandler, index }) => {
    const sendIndex = () => {
        addTileHandler(index);
    };

    return (
        <div className="grid-item" onClick={!isFilled ? sendIndex : null}>
            {isFilled && (
                <div
                    className={`tile ${playerNumber === 2 ? "yellow" : ""}`}
                ></div>
            )}
        </div>
    );
};

export default Tile;
