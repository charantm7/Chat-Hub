import { useEffect, useState } from "react";

function ChatRoom({ chat_id, token }) {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // ✅ Connect WebSocket when component mounts
  useEffect(() => {
    const socket = new WebSocket(`ws://127.0.0.1:8000/v1/ws/${chat_id}?token=${token}`);

    socket.onopen = () => console.log("✅ Connected to WebSocket");

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
    };

    socket.onclose = () => console.log("❌ WebSocket connection closed");

    setWs(socket);

    // Cleanup connection when leaving the page
    return () => socket.close();
  }, [chat_id, token]);

  // ✅ Send message to backend
  const sendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", data: input }));
      setInput("");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>🔥 Chat Room</h2>
      <div
        id="chat-box"
        style={{
          border: "1px solid gray",
          borderRadius: "5px",
          height: "250px",
          overflowY: "auto",
          padding: "5px",
          marginBottom: "10px",
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "5px" }}>
            <b>{m.sender}:</b> {m.message}
          </div>
        ))}
      </div>

      <input
        type="text"
        style={{
          width: "75%",
          padding: "5px",
          marginRight: "5px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} style={{ padding: "6px 12px" }}>
        Send
      </button>
    </div>
  );
}

export default ChatRoom;
