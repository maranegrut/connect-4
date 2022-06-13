import "./button.scss";

const Button = ({ playAgainHandler, children }) => {
  return <button onClick={playAgainHandler}>{children}</button>;
};

export default Button;
