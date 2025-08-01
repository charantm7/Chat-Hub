import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faEllipsisVertical,
  faXmark,
  faFaceSmile,
  faPaperclip,
  faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import { GetValidAccessToken } from "./index";

function ChatArea({ user, onSelect }) {
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [token, setToken] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // ✅ ref to scroll to bottom

  const chatMessages = messages[user?.chat_id] || [];

  // ✅ Auto-scroll whenever chatMessages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // ✅ Fetch Token and Current User
  useEffect(() => {
    const init = async () => {
      const t = await GetValidAccessToken();
      setToken(t);

      if (t) {
        try {
          const res = await fetch("http://127.0.0.1:8000/", {
            headers: { Authorization: `Bearer ${t}` },
          });
          if (!res.ok) throw new Error("Unauthorized");
          const data = await res.json();
          setCurrentUserID(data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, []);

  // ✅ Fetch Initial Messages
  useEffect(() => {
    if (!token || !user?.chat_id) return;
    (async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/v1/chat/${user.chat_id}/message`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load messages");
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [user.chat_id]: Array.isArray(data) ? data : [],
        }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, user?.chat_id]);

  // ✅ WebSocket Setup
  useEffect(() => {
    if (!token || !user?.chat_id) return;

    socketRef.current = new WebSocket(`ws://127.0.0.1:8000/v1/ws/${user.chat_id}?token=${token}`);

    socketRef.current.onopen = () => console.log("✅ WebSocket connected");

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      setMessages((prev) => {
        const previous = prev[user?.chat_id] || [];

        // ✅ Avoid duplicates
        if (previous.some((m) => m.id === msg.id)) return prev;

        return {
          ...prev,
          [user?.chat_id]: [...previous, msg],
        };
      });
    };

    socketRef.current.onclose = () => console.log("❌ WebSocket closed");

    return () => socketRef.current?.close();
  }, [token, user?.chat_id, currentUserID?.id]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: crypto.randomUUID(),
      sender_id: currentUserID?.id,
      content: input,
      chat_id: user?.chat_id,
      sent_at: new Date().toISOString(),
    };

    setMessages((prev) => {
      const previous = prev[user?.chat_id] || [];
      return {
        ...prev,
        [user?.chat_id]: [...previous, newMsg],
      };
    });

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ data: input }));
    }

    setInput("");
  };

  // ✅ Handle Enter Key to Send Message
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ If No User Selected
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400">
        <p className="pl-3 pt-1 pb-1 pr-3 rounded-4xl bg-[#ffffff13]">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="w-[75%] bg-[#14171c] flex flex-col">
      {/* Header */}
      <div className="text-[#e8e8e8e0] bg-[#01040963] flex justify-between items-center pr-4 pl-4 pt-2 pb-2 border-b border-[var(--border-2)]">
        <div className="flex flex-col">
          <p className="text-[15px]">{user.name}</p>
          <small className="text-[11px] opacity-70">last seen recently</small>
        </div>
        <div className="flex gap-4 text-sm items-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="cursor-pointer" />
          <FontAwesomeIcon icon={faEllipsisVertical} className="cursor-pointer" />
          <FontAwesomeIcon
            onClick={() => onSelect(null)}
            icon={faXmark}
            className="p-[3px] pt-1 pb-1 rounded-[50%] cursor-pointer hover:bg-[#ff2b2bdf]"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 ${msg.sender_id === currentUserID?.id ? "text-right" : "text-left"}`}
          >
            <p className="inline-block max-w-[70%] bg-gray-700 text-white pr-4 pl-4 pt-2 pb-2 rounded-4xl break-words">
              {msg.content}
            </p>
          </div>
        ))}
        {/* ✅ Auto Scroll Target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex w-full bg-[#01040963] items-center text-[#e8e8e8e0] pr-4 pl-4 gap-4 border-t border-[var(--border-2)]">
        <FontAwesomeIcon icon={faFaceSmile} className="text-[20px]" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress} // ✅ Send on Enter
          placeholder="Write a message..."
          className="w-full h-[3.3rem] outline-0 bg-transparent text-white"
        />
        <button className="px-4 bg-blue-500 hover:bg-blue-600 rounded-r-lg" onClick={sendMessage}>
          Send
        </button>
        <FontAwesomeIcon icon={faPaperclip} className="text-[20px]" />
        <FontAwesomeIcon icon={faMicrophone} className="text-[20px]" />
      </div>
    </div>
  );
}

export default ChatArea;
