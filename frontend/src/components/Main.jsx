import React from "react";
import ChatList from "./ChatList";
import ChatArea from "./ChatArea";
import { useState } from "react";

function Main() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <main className="border border-[var(--border)] bg-[#0104099e] h-[90.5vh] rounded-b-lg flex overflow-hidden">
      <ChatList onSelect={setSelectedUser} selectedUser={selectedUser} />
      <ChatArea user={selectedUser} />
    </main>
  );
}

export default Main;
