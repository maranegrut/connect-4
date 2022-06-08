import "./overlay.scss";

const Overlay = ({ playerNumber, playAgainHandler }) => {
    return (
        <div className="backdrop">
            <div className="modal">
                <div className="imgContainer">
                    <img
                        className="partyHat left"
                        src={process.env.PUBLIC_URL + "/party-hat.png"}
                        alt="party-hat"
                    />
                </div>
                <div>
                    <h1 className="winnerHeading">
                        Player {playerNumber} Won!
                    </h1>
                    <button onClick={playAgainHandler}>Play Again</button>
                </div>
                <div className="imgContainer">
                    <img
                        className="partyHat"
                        src={process.env.PUBLIC_URL + "/party-hat.png"}
                        alt="party-hat"
                    />
                </div>
            </div>
        </div>
    );
};

export default Overlay;
