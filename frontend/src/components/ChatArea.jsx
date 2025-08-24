import React, { useEffect, useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faMagnifyingGlass,
  faEllipsisVertical,
  faXmark,
  faFaceSmile,
  faPaperclip,
  faMicrophone,
  faPenToSquare,
  faCheck,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";

import { GetValidAccessToken } from "./index";
import profileBg from "../assets/profile.jpg";
import { CheckCircle, BadgeCheck } from "lucide-react";
import FileIcons from "./Icons";
import { Ban, CircleSlash } from "lucide-react";

const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

function ChatArea({ user, onSelect }) {
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [token, setToken] = useState(null);
  const [currentUserID, setCurrentUserID] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [typingUser, setTypingUser] = useState([]);
  const [messageInfo, setMessageInfo] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    msgId: null,
  });
  console.log("info messages", messages);
  const chatMessages = messages[user?.chat_id] || [];
  const sortedMessages = [...chatMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  function handleOverlayClick(e) {
    if (e.target.id === "overlay") {
      resetFile();
      setMessageInfo(null);
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
    async function markread() {
      try {
        const res = await fetch(`http://127.0.0.1:8000/v1/chat/markread/${user.chat_id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Request failed");
      } catch (err) {
        console.log(err);
      }
    }
    markread();
  }, [token, user?.chat_id]);

  useEffect(() => {
    if (!token || !user?.chat_id) return;

    socketRef.current = new WebSocket(`ws://127.0.0.1:8000/v1/ws/${user.chat_id}?token=${token}`);

    socketRef.current.onopen = () => console.log("WebSocket connected");

    socketRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("Received:", msg);

      switch (msg.type) {
        case "typing":
          if (msg.sender_id !== currentUserID?.id) {
            if (msg.isTyping) {
              setTypingUser((prev) => [...prev.filter((u) => u !== msg.sender_id), msg.sender_id]);
            } else {
              setTypingUser((prev) => prev.filter((u) => u != msg.sender_id));
            }
          }
          break;

        case "message_read":
          setMessages((prev) => {
            const updated = { ...prev };
            const chatId = user?.chat_id;
            if (!chatId || !updated[chatId]) return prev;

            const ids = msg.message_ids || [];
            updated[chatId] = updated[chatId].map((m) => (ids.includes(m.id) ? { ...m, read: true } : m));

            return updated;
          });
          break;

        case "delete_message":
          setMessages((prev) => {
            const updated = { ...prev };
            updated[msg.chat_id] = updated[msg.chat_id].map((m) =>
              m.id === msg.message_id ? { ...m, is_deleted: true } : m
            );
            return updated;
          });
          break;

        default:
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
                m.id?.startsWith("temp-")
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
      }
    };

    socketRef.current.onclose = () => console.log("WebSocket closed");
    return () => {
      socketRef.current?.close();
      setTypingUser([]);
    };
  }, [token, user?.chat_id, currentUserID?.id]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: "temp-" + crypto.randomUUID(),
      sender_id: currentUserID?.id,
      content: input,
      chat_id: user?.chat_id,
      sent_at: new Date().toISOString(),
      is_deleted: false,
    };

    setMessages((prev) => {
      const previous = prev[user?.chat_id] || [];
      return {
        ...prev,
        [user?.chat_id]: [...previous, newMsg],
      };
    });

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          data: input,
          type: "message",
        })
      );

      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          isTyping: false,
        })
      );
    }

    setInput("");
  };

  const getUnreadMessage = () => {
    const chatId = user?.chat_id;
    if (!chatId || !messages[chatId]) return [];

    return messages[chatId]
      .filter((msg) => msg.sender_id !== currentUserID?.id && !msg.read) // only messages from others
      .map((msg) => msg.id);
  };

  const sendReadReceipt = () => {
    const unreadIds = getUnreadMessage();

    if (unreadIds.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "message_read",
          message_ids: unreadIds,
          chat_id: user?.chat_id,
        })
      );
    }
  };
  useEffect(() => {
    if (user?.chat_id) {
      sendReadReceipt();
    }
  }, [messages, user?.chat_id]);

  useEffect(() => {
    const chatMessages = messages[user?.chat_id] || [];
    chatMessages
      .filter((m) => m.sender_id !== currentUserID?.id && m.status !== "read")
      .forEach((m) => sendReadReceipt(m.id));
  }, [messages, user?.chat_id]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendTypingIndicatorTrue = useDebounce(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          isTyping: true,
          sender_id: currentUserID?.id,
        })
      );
    }
  });
  const sendTypingIndicatorFalse = useDebounce(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "typing",
          isTyping: false,
          sender_id: currentUserID?.id,
        })
      );
    }
  }, 1500);

  const handleMessageChange = useCallback(
    (e) => {
      sendTypingIndicatorTrue();
      sendTypingIndicatorFalse();
    },
    [sendTypingIndicatorTrue, sendTypingIndicatorFalse]
  );

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();

    formData.append("file", file);
    formData.append("sender_id", currentUserID?.id);
    formData.append("chat_id", user?.chat_id);

    try {
      const res = await fetch(`http://127.0.0.1:8000/v1/chat/file/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }
      setFile(null);
      setShowModal(null);

      const response = await res.json();

      console.log(response);

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "file",
            sender_id: currentUserID?.id,
            data: {
              file_url: response.url,
              file_name: response.file_name,
              file_type: response.file_type,
              unique_name: response.unique_name,
              size: response.size,
            },
          })
        );
      }

      const newFileMessage = {
        id: "temp-" + crypto.randomUUID(),
        sender_id: currentUserID?.id,
        file_name: response.file_name,
        type: "file",
        size: response.size,
        url: response.file_url,
        file_type: response.file_type,
        unique_name: response.unique_name,
        chat_id: user?.chat_id,
        sent_at: new Date().toISOString(),
        is_deleted: false,
      };
      setMessages((prev) => {
        const previous = prev[user?.chat_id] || [];
        return {
          ...prev,
          [user?.chat_id]: [...previous, newFileMessage],
        };
      });
    } catch (e) {
      console.log("upload error", e);
      alert("upload failed");
    }
  };

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  function formatFileSize(bytes) {
    if (bytes == null || isNaN(bytes)) return "-"; // fallback when null/invalid
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  }

  function handleInfo(message_id) {
    setShowModal("msg_info");
    const msgArray = Object.values(messages).flat();
    const msg = msgArray.find((m) => m.id === message_id);

    if (msg) {
      setMessageInfo(msg);
    } else {
      console.error("no message found");
    }
  }

  async function handleDelete(message_id) {
    const msgArray = Object.values(messages).flat();
    const msg = msgArray.find((m) => m.id === message_id);

    if (!msg) return;

    try {
      const req = await fetch(`http://127.0.0.1:8000/v1/chat/delete/${message_id}`, {
        method: "POST",
      });

      if (!req.ok) throw new Error("Delete request failed");

      setMessages((prev) => {
        const newMessages = { ...prev };
        for (const chatId in newMessages) {
          newMessages[chatId] = newMessages[chatId].map((m) =>
            m.id === message_id ? { ...m, is_deleted: true } : m
          );
        }
        return newMessages;
      });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  }

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
          {typingUser.length > 0 ? (
            <small className="text-[11px] opacity-70 text-green-400">typing...</small>
          ) : (
            <small className="text-[11px] opacity-70">last seen recently</small>
          )}
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
            {msg.is_deleted ? (
              <p
                className={`relative inline-block text center min-w-[12%] max-w-[70%] ${
                  msg.sender_id === currentUserID?.id ? "bg-blue-600 text-left" : "bg-gray-700"
                } text-white p-2 rounded-[7px] break-words`}
              >
                <span className="flex items-center gap-2">
                  <Ban size={20} className="text-white" />
                  You deleted this message
                </span>
              </p>
            ) : (
              <>
                {msg.file_url ? (
                  msg.file_type.startsWith("image/") ? (
                    <div
                      className={`relative inline-block min-w-[12%] max-w-[70%] ${
                        msg.sender_id === currentUserID?.id ? "bg-blue-600 text-left" : "bg-gray-700"
                      } text-white p-[2px] rounded-[7px] break-words`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.pageX,
                          y: e.pageY,
                          msgId: msg.id,
                          senderId: msg.sender_id,
                        });
                      }}
                    >
                      <a href={msg.file_url}>
                        <img src={msg.file_url} alt={msg.file_name} className="max-h-40 rounded-md border" />
                        <span
                          className={`absolute bottom-1 ${
                            msg.sender_id === currentUserID?.id ? "right-7" : "right-2"
                          }  text-[11px] text-gray-300 `}
                          style={{ textShadow: "1px 1px 2px black" }}
                        >
                          {msg.sent_time}
                        </span>

                        {msg.sender_id === currentUserID?.id && (
                          <>
                            {msg.read || msg.is_read ? (
                              <span
                                className="absolute bottom-1 right-2 text-[14px] text-gray-300"
                                tyle={{ textShadow: "1px 1px 2px black" }}
                              >
                                <FontAwesomeIcon icon={faCheckDouble} />
                              </span>
                            ) : (
                              <span className="absolute bottom-1 right-2 text-[14px] text-gray-300">
                                <FontAwesomeIcon icon={faCheck} />
                              </span>
                            )}
                          </>
                        )}
                      </a>
                    </div>
                  ) : (
                    <div
                      className={`relative inline-block min-w-[12%] max-w-[70%] ${
                        msg.sender_id === currentUserID?.id ? "bg-blue-600 text-left" : "bg-gray-700"
                      } text-white pr-2 pl-2 pt-2 pb-[30px] rounded-[7px] break-words`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.pageX,
                          y: e.pageY,
                          msgId: msg.id,
                          senderId: msg.sender_id,
                        });
                      }}
                    >
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                        <div
                          className={`rounded-[5px] p-2 flex gap-2 items-center  ${
                            msg.sender_id === currentUserID?.id ? "bg-blue-800" : "bg-gray-600"
                          }`}
                        >
                          <FileIcons type={msg.file_type} size={28} className="text-white" />

                          <div className="flex flex-col gap-1">
                            <p className="text-[13.5px]">{msg.file_name}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-300">{msg.file_type}</span>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-gray-300">
                                {formatFileSize(Number(msg.size))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </a>
                      <span
                        className={`absolute bottom-1 ${
                          msg.sender_id === currentUserID?.id ? "right-7" : "right-2"
                        }  text-[11px] text-gray-300`}
                      >
                        {msg.sent_time}
                      </span>
                      {msg.sender_id === currentUserID?.id && (
                        <>
                          {msg.read || msg.is_read ? (
                            <span className="absolute bottom-1 right-2 text-[14px] text-gray-300">
                              <FontAwesomeIcon icon={faCheckDouble} />
                            </span>
                          ) : (
                            <span className="absolute bottom-1 right-2 text-[14px] text-gray-300">
                              <FontAwesomeIcon icon={faCheck} />
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )
                ) : (
                  <p
                    className={`relative inline-block min-w-[12%] max-w-[70%] ${
                      msg.sender_id === currentUserID?.id ? "bg-blue-600 text-left" : "bg-gray-700"
                    } text-white pr-4 pl-4 pt-2 pb-[26px] rounded-[7px] break-words`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ x: e.pageX, y: e.pageY, msgId: msg.id, senderId: msg.sender_id });
                    }}
                  >
                    {msg.content}
                    <span
                      className={`absolute bottom-1 ${
                        msg.sender_id === currentUserID?.id ? "right-7" : "right-2"
                      }  text-[11px] text-gray-300`}
                    >
                      {msg.sent_time}
                    </span>
                    {msg.sender_id === currentUserID?.id && (
                      <>
                        {msg.read || msg.is_read ? (
                          <span className="absolute bottom-1 right-2 text-[14px] text-gray-300">
                            <FontAwesomeIcon icon={faCheckDouble} />
                            {console.log("read", msg.is_read)}
                          </span>
                        ) : (
                          <span className="absolute bottom-1 right-2 text-[14px] text-gray-300">
                            <FontAwesomeIcon icon={faCheck} />
                          </span>
                        )}
                      </>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex w-full bg-[#01040963] items-center text-[#e8e8e8e0] pr-4 pl-4 gap-4 border-t border-[var(--border-2)]">
        <FontAwesomeIcon icon={faFaceSmile} className="text-[20px]" />
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleMessageChange(e);
          }}
          onKeyDown={handleKeyPress}
          placeholder="Write a message..."
          className="w-full h-[4rem] outline-0 bg-transparent text-white"
        />
        <label className="flex items-center cursor-pointer">
          <FontAwesomeIcon icon={faPaperclip} className="text-[20px]" />
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const selectfile = e.target.files[0];
              if (selectfile) {
                setFile(selectfile);
                setShowModal("file");
              }
              e.target.value = "";
            }}
          />
        </label>

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
                onClick={() => setShowModal({ msgId: contextMenu.msgId })}
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
      {showModal == "file" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
        >
          <div className="bg-[#ffffffd0] border border-black/10 p-3 rounded-2xl overflow-hidden">
            {file && (
              <div className="space-y-3">
                <p className="text-sm">📄 {file.name}</p>

                {/* Image preview if applicable */}
                {file.type.startsWith("image/") && (
                  <img src={URL.createObjectURL(file)} alt="preview" className="max-h-40 rounded-md border" />
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="bg-red-500 text-white text-md cursor-pointer pl-2 pr-2 rounded-[4px] hover:bg-red-600"
                    onClick={() => {
                      setShowModal(null);
                      resetFile();
                    }}
                  >
                    cancel
                  </button>
                  <button
                    className="bg-blue-500 text-white text-md pl-2 pr-2 cursor-pointer rounded-[4px] hover:bg-blue-600"
                    onClick={handleFileUpload}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showModal === "msg_info" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            className="bg-white/95 border border-gray-200 shadow-2xl rounded-xl p-5 w-[90%] max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Message Details</h2>

            {messageInfo.file_url ? (
              messageInfo.file_type.startsWith("image/") ? (
                <div className="flex flex-col gap-4">
                  <a
                    href={messageInfo.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center"
                  >
                    <img
                      src={messageInfo.file_url}
                      alt={messageInfo.file_name}
                      className="max-h-56 rounded-lg shadow-md border"
                    />
                  </a>

                  <div className="grid grid-cols-2 gap-3 bg-gray-100 p-3 rounded-lg text-sm">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {messageInfo.read || messageInfo.is_read ? "Seen" : "Delivered"}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {messageInfo.sent_time}
                    </p>
                    <p>
                      <span className="font-medium">Sender:</span>{" "}
                      {messageInfo.sender.name || messageInfo.sender}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {messageInfo.file_type}
                    </p>
                    <p>
                      <span className="font-medium">Size:</span> {formatFileSize(Number(messageInfo.size))}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <a href={messageInfo.file_url} target="_blank" rel="noopener noreferrer">
                    <div className="rounded-lg p-3 flex gap-3 items-center bg-gray-700 hover:bg-gray-600 transition">
                      <FileIcons type={messageInfo.file_type} size={32} className="text-white" />
                      <div>
                        <p className="text-sm font-medium text-white truncate">{messageInfo.file_name}</p>
                        <p className="text-xs text-gray-300">
                          {messageInfo.file_type} • {formatFileSize(messageInfo.size)}
                        </p>
                      </div>
                    </div>
                  </a>

                  <div className="grid grid-cols-2 gap-3 bg-gray-100 p-3 rounded-lg text-sm">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {messageInfo.read || messageInfo.is_read ? "Seen" : "Delivered"}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span> {messageInfo.sent_time}
                    </p>
                    <p>
                      <span className="font-medium">Sender:</span>{" "}
                      {messageInfo.sender.name || messageInfo.sender}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {messageInfo.file_type}
                    </p>
                    <p>
                      <span className="font-medium">Size:</span> {formatFileSize(Number(messageInfo.size))}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-[#c4c3c3e1]  p-3 rounded-lg text-sm text-gray-800 ">
                  {messageInfo.content}
                </div>
                <div className="grid grid-cols-2 gap-3 bg-gray-100 p-3 rounded-lg text-sm">
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {messageInfo.read || messageInfo.is_read ? " Seen" : "Delivered"}
                  </p>
                  <p>
                    <span className="font-medium">Time:</span> {messageInfo.sent_time}
                  </p>
                  <p>
                    <span className="font-medium">Sender:</span>{" "}
                    {messageInfo.sender.name || messageInfo.sender}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal?.msgId && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
        >
          <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-2">Delete Message</h2>
            <p className="text-sm text-gray-300 mb-4">Are you sure you want to delete this message?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(null)}
                className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete(showModal.msgId);
                  setShowModal(null);
                }}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;
