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
import profileBg from "../assets/profile.jpg";
import { CheckCircle, BadgeCheck } from "lucide-react";

function ChatArea({ user, onSelect }) {
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [token, setToken] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    msgId: null,
  });
  console.log(messages);
  const chatMessages = messages[user?.chat_id] || [];
  const sortedMessages = [...chatMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  function handleOverlayClick(e) {
    if (e.target.id === "overlay") {
      setShowModal(null);
    }
  }

  const prevChatId = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [chatMessages]);

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
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.msgId !== null) {
        setContextMenu({ x: 0, y: 0, msgId: null });
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

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
          [user.chat_id]: Array.isArray(data.messages) ? data.messages : [],
        }));
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, user?.chat_id]);

  useEffect(() => {
    if (!token || !user?.chat_id) return;

    socketRef.current = new WebSocket(`ws://127.0.0.1:8000/v1/ws/${user.chat_id}?token=${token}`);

    socketRef.current.onopen = () => console.log("WebSocket connected");

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received:", msg);

      if (msg.Message) return;

      setMessages((prev) => {
        const chatId = user?.chat_id;
        if (!chatId) return prev;

        const previous = prev[chatId] || [];

        const incomingMsg = {
          ...msg,
          sent_at: msg.sent_at || msg.timestamp,
          content: msg.content || msg.message,
        };

        const existingIndex = previous.findIndex(
          (m) =>
            m.sender_id === incomingMsg.sender_id &&
            m.content === incomingMsg.content &&
            m.id.startsWith("temp-")
        );

        let updated;
        if (existingIndex !== -1) {
          updated = [...previous];
          updated[existingIndex] = incomingMsg;
        } else if (!previous.some((m) => m.id === incomingMsg.id)) {
          updated = [...previous, incomingMsg];
        } else {
          updated = previous;
        }

        updated.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
        return { ...prev, [chatId]: updated };
      });
    };

    socketRef.current.onclose = () => console.log("WebSocket closed");
    return () => socketRef.current?.close();
  }, [token, user?.chat_id, currentUserID?.id]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: "temp-" + crypto.randomUUID(),
      sender_id: currentUserID?.id,
      content: input,
      chat_id: user?.chat_id,
      sent_at: new Date().toISOString(),
    };
    console.log(newMsg.sent_time);

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400">
        <p className="pl-3 pt-1 pb-1 pr-3 rounded-4xl bg-[#ffffff13]">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="w-[75%] overflow-hidden bg-[#14171c] flex flex-col">
      {/* Header */}
      <div className="text-[#e8e8e8e0] bg-[#01040963] flex justify-between items-center pr-4 pl-4 pt-2 pb-2 border-b border-[var(--border-2)]">
        <div className="flex flex-col">
          <p onClick={() => setShowModal("account")} className="text-[15px] cursor-pointer">
            {user.name}
          </p>
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
      <div className="flex-1 overflow-y-auto space-y-3 p-3 hide-scrollbar">
        {sortedMessages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 ${msg.sender_id === currentUserID?.id ? "text-right" : "text-left"}`}
          >
            <p
              className={`relative inline-block min-w-[8%] max-w-[70%] ${
                msg.sender_id === currentUserID?.id ? "bg-blue-600 text-left" : "bg-gray-700"
              } text-white pr-4 pl-4 pt-2 pb-[22px] rounded-[7px] break-words`}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.pageX, y: e.pageY, msgId: msg.id, senderId: msg.sender_id });
              }}
            >
              {msg.content}
              <span className="absolute bottom-1 right-2 text-[9px] text-gray-300">{msg.sent_time}</span>
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex w-full bg-[#01040963] items-center text-[#e8e8e8e0] pr-4 pl-4 gap-4 border-t border-[var(--border-2)]">
        <FontAwesomeIcon icon={faFaceSmile} className="text-[20px]" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Write a message..."
          className="w-full h-[4rem] outline-0 bg-transparent text-white"
        />
        <FontAwesomeIcon icon={faPaperclip} className="text-[20px]" />
        <FontAwesomeIcon icon={faMicrophone} className="text-[20px]" />
      </div>
      {showModal == "account" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
        >
          <div className="bg-[#ffffffd0] border border-black/10 h-[60%] w-[50%] rounded-2xl overflow-hidden">
            <div className="w-full">
              <img src={profileBg} alt="...." className="h-[10rem] w-full object-cover" />
            </div>
            <img src={user.picture} alt="..." className="absolute top-[37%] ml-[40px] rounded-[50%]" />
            <div className="h-[100%] p-[1rem] flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-xl ml-35">{user.name}</p>
                <p className="flex items-center gap-2">
                  {user.email}
                  {user.is_verified == true ? (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    <BadgeCheck className="h-5 w-5 text-blue-500 inline-block ml-1" />
                  )}
                </p>
              </div>
              <div className="flex gap-7">
                <div className="w-[40%] mt-10 h-full flex flex-col gap-[1rem]">
                  <p className="border-b-3 w-[3.1rem] ">Details</p>
                  <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">First name: {user.first_name}</p>
                  <p className="pt-1 pb-1 pl-3 rounded-md bg-[#b7b7b7b3]">Last name: {user.last_name}</p>
                  <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">Date of birth: {user.d_o_b}</p>
                </div>
                <div className="w-[60%] mt-10 h-full flex flex-col pb-10 gap-[1rem]">
                  <p className="border-b-3 w-[2.7rem] ">About</p>
                  <p className="pt-1 pb-1 pl-3 h-full rounded-md bg-[#b7b7b7b3]"> {user.about}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {contextMenu.msgId && (
        <ul
          className="absolute z-50 bg-gray-800 text-white rounded shadow-md text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={() => setContextMenu({ x: 0, y: 0, msgId: null })}
        >
          <li
            className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleInfo(contextMenu.msgId)}
          >
            Info
          </li>
          {contextMenu.senderId == currentUserID.id && (
            <div>
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => handleEdit(contextMenu.msgId)}
              >
                Edit
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={() => handleDelete(contextMenu.msgId)}
              >
                Delete
              </li>
            </div>
          )}
          <li
            className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
            onClick={() => handleSelect(contextMenu.msgId)}
          >
            Select
          </li>
        </ul>
      )}
    </div>
  );
}

export default ChatArea;
