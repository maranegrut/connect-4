import Button from "./button";
import Modal from "./modal";

const DisconnectedOverlay = ({ playAgainHandler }) => {
  return (
    <Modal>
      <div className="overlayHeading">
        <h2>Opponent disconnected.</h2>
        <Button playAgainHandler={playAgainHandler}>New game</Button>
      </div>
    </Modal>
  );
};

export default DisconnectedOverlay;
