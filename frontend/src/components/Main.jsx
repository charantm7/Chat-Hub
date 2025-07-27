import React from "react";
import ChatList from "./ChatList";
import ChatArea from "./ChatArea";

function Main() {
  return (
    <main className="border border-[var(--border)] bg-[#0104099e] h-[90.5vh] rounded-b-lg flex overflow-hidden">
      <ChatList />
      <ChatArea />
    </main>
  );
}

export default Main;
