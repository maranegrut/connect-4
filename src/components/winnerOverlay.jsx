import "./winnerOverlay.scss";
import Modal from "./modal";
import Button from "./button";

const Overlay = ({ playerNumber, iWon, playAgainHandler }) => {
  const playerColor = playerNumber === 1 ? "Red" : "Yellow";

  return (
    <Modal>
      <div className="imgContainer">
        <img
          className="partyHat left"
          src={process.env.PUBLIC_URL + "/party-hat.png"}
          alt="party-hat"
        />
      </div>
      <div>
        <h1 className="winnerHeading">{iWon ? "You" : playerColor} Won!</h1>
        <Button playAgainHandler={playAgainHandler}>Play again</Button>
      </div>
      <div className="imgContainer">
        <img
          className="partyHat"
          src={process.env.PUBLIC_URL + "/party-hat.png"}
          alt="party-hat"
        />
      </div>
    </Modal>
  );
};

export default Overlay;
