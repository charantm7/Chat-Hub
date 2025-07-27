import React from "react";
import Navbar from "./Navbar";
import Main from "./Main";

function Chat() {
  return (
    <div className="bg-[#0d1117f1] flex flex-col p-[.5rem]  overflow-hidden min-h-screen">
      <Navbar />
      <Main className="flex-1 overflow-hidden" />
    </div>
  );
}

export default Chat;
