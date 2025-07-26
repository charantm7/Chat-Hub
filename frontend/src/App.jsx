import ChatRoom from "./chatroom";

function App() {
  // ✅ Replace with your actual chat_id and JWT token
  const chatId = "";
  const token = "";

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🚀 FastAPI WebSocket Chat</h1>
      <ChatRoom chat_id={chatId} token={token} />
    </div>
  );
}

export default App;
