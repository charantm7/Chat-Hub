import React from "react";
import Navbar from "./components/Navbar";
import Main from "./components/Main";

const App = () => {
  return (
    <div className="bg-[#0d1117f1] flex flex-col p-[.7rem] gap-[.7rem]">
      <Navbar />
      <Main />
    </div>
  );
};

export default App;
