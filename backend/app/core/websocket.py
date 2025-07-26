from typing import Dict, List
from uuid import UUID
from fastapi import WebSocket

class ConnectionManager:

    def __init__(self):
        
        self.active_connections: Dict[UUID, List[WebSocket]] = {}


    async def connect(self, chat_id: UUID, websocket: WebSocket):

        await websocket.accept()

        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []

        self.active_connections[chat_id].append(websocket)

        await websocket.send_json({"Message":"Connected to chat"})

    def disconnect(self, chat_id:UUID, websocket: WebSocket):

        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(websocket)

            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast(self, chat_id: UUID, message: str):

        if chat_id in self.active_connections:
            print(f"Broadcasting to {len(self.active_connections[chat_id])} connections")

            for connection in list(self.active_connections[chat_id]):

                try:
                    await connection.send_json(message)

                except Exception as e:
                    print(f"Error: {e}")

                    self.disconnect(chat_id, connection)


manager = ConnectionManager()