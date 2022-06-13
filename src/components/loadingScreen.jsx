import "./loadingScreen.scss";
import Modal from "./modal";

const LoadingScreen = () => {
  return (
    <Modal>
      <div className="container">
        <h2>Waiting for other player...</h2>
        <div className="spinner"></div>
      </div>
    </Modal>
  );
};

export default LoadingScreen;
