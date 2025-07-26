import ChatRoom from "./chatroom";

function App() {
  // ✅ Replace with your actual chat_id and JWT token
  const chatId = "6c0b4971-5963-48dc-91c8-8d824ee06aef";
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNoYXJhbm50bS5kZXZAZ21haWwuY29tIiwiZXhwIjoxNzUzNTY1NTUyfQ.Rdt70S9swdF7lKsvW6xngcJQSrSaCgEP3n1JUEBoyh8";

  return (
    <div>
      <h1 style={{ textAlign: "center" }}>🚀 FastAPI WebSocket Chat</h1>
      <ChatRoom chat_id={chatId} token={token} />
    </div>
  );
}

export default App;
