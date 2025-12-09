import { useState } from "react";

export function Menu() {
  const [loadedModel, setModel] = useState<string>();
  const [loadedMmproj, setMmproj] = useState<string>();

  const chooseModel = async () => {
    setModel('')
  };

  const chooseMmproj = async () => {
    setMmproj('')
  };

  const start = async () => {

  };

  return (
    <div className="side-menu">
      <button className="menu-button" onClick={chooseModel}>
        Choose model
      </button>
      <p>model loaded: {loadedModel}</p>

      <button className="menu-button" onClick={chooseMmproj}>
        Choose mmproj
      </button>
      <p>mmproj loaded: {loadedMmproj}</p>

      <button className="menu-button" onClick={start}>
        Start model
      </button>
    </div>
  );
}
