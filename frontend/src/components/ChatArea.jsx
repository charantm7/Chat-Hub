import React, { useEffect, useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import chatHubLogo from "../assets/chat-hub-logo-2.png";

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
  faCircleInfo,
  faPaperPlane,
  faUser,
  faUsers,
  faImage,
  faFileAlt,
  faVideo,
  faThumbtack,
  faThumbTack,
  faRobot,
  faGears,
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

function showNotification(title, body) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: chatHubLogo,
    });
  }
}

function ChatArea({ users, onCancleSelect }) {
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
  const [editContent, setEditContent] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    x: 0,
    y: 0,
    msgId: null,
  });
  // console.log("reply", currentUserID);
  // const chatMessages = messages[user?.chat_id] || [];
  const sortedMessages = [{}];
  // [...chatMessages].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  // function handleOverlayClick(e) {
  //   if (e.target.id === "overlay") {
  //     resetFile();
  //     setMessageInfo(null);
  //     setEditContent(null);
  //     setShowModal(null);
  //   }
  // }

  // const prevChatId = useRef(null);
  // useEffect(() => {
  //   if (messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: "auto" });
  //   }
  // }, [chatMessages]);

  // useEffect(() => {
  //   const init = async () => {
  //     const t = await GetValidAccessToken();
  //     setToken(t);

  //     if (t) {
  //       try {
  //         const res = await fetch("http://127.0.0.1:8000/", {
  //           headers: { Authorization: `Bearer ${t}` },
  //         });
  //         if (!res.ok) throw new Error("Unauthorized");
  //         const data = await res.json();
  //         setCurrentUserID(data);
  //       } catch (err) {
  //         console.error(err);
  //       }
  //     }
  //   };

  //   init();
  // }, []);
  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     if (contextMenu.msgId !== null) {
  //       setContextMenu({ x: 0, y: 0, msgId: null });
  //     }
  //   };

  //   window.addEventListener("click", handleClickOutside);
  //   return () => window.removeEventListener("click", handleClickOutside);
  // }, [contextMenu]);

  // useEffect(() => {
  //   if (!token || !user?.chat_id) return;
  //   (async () => {
  //     try {
  //       const res = await fetch(`http://127.0.0.1:8000/v1/chat/${user.chat_id}/message`, {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       if (!res.ok) throw new Error("Failed to load messages");
  //       const data = await res.json();
  //       setMessages((prev) => ({
  //         ...prev,
  //         [user.chat_id]: Array.isArray(data.messages) ? data.messages : [],
  //       }));
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   })();
  // }, [token, user?.chat_id]);

  // useEffect(() => {
  //   if (!token || !user?.chat_id) return;
  //   async function markread() {
  //     try {
  //       const res = await fetch(`http://127.0.0.1:8000/v1/chat/markread/${user.chat_id}`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       if (!res.ok) throw new Error("Request failed");
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   }
  //   markread();
  // }, [token, user?.chat_id]);

  // useEffect(() => {
  //   if (!token || !user?.chat_id) return;

  //   socketRef.current = new WebSocket(`ws://127.0.0.1:8000/v1/ws/${user.chat_id}?token=${token}`);

  //   socketRef.current.onopen = () => console.log("WebSocket connected");

  //   socketRef.current.onmessage = (event) => {
  //     const msg = JSON.parse(event.data);
  //     console.log("Received:", msg);

  //     switch (msg.type) {
  //       case "typing":
  //         if (msg.sender_id !== currentUserID?.id) {
  //           if (msg.isTyping) {
  //             setTypingUser((prev) => [...prev.filter((u) => u !== msg.sender_id), msg.sender_id]);
  //           } else {
  //             setTypingUser((prev) => prev.filter((u) => u != msg.sender_id));
  //           }
  //         }
  //         break;

  //       case "message_read":
  //         setMessages((prev) => {
  //           const updated = { ...prev };
  //           const chatId = user?.chat_id;
  //           if (!chatId || !updated[chatId]) return prev;

  //           const ids = msg.message_ids || [];
  //           updated[chatId] = updated[chatId].map((m) => (ids.includes(m.id) ? { ...m, read: true } : m));

  //           return updated;
  //         });
  //         break;

  //       case "message_edit":
  //         setMessages((prev) => {
  //           const updated = { ...prev };
  //           updated[msg.chat_id] = updated[msg.chat_id].map((m) =>
  //             m.id === msg.message_id ? { ...m, content: msg.content } : m
  //           );
  //           return updated;
  //         });

  //         break;

  //       case "delete_message":
  //         setMessages((prev) => {
  //           const updated = { ...prev };
  //           updated[msg.chat_id] = updated[msg.chat_id].map((m) =>
  //             m.id === msg.message_id ? { ...m, is_deleted: true } : m
  //           );
  //           return updated;
  //         });
  //         break;

  //       default:
  //         if (msg.Message) return;

  //         if (document.hidden) {
  //           console.log("tryingg");
  //           showNotification("New Message", msg.content);
  //           console.log("notification sent");
  //         }

  //         setMessages((prev) => {
  //           const chatId = user?.chat_id;
  //           if (!chatId) return prev;

  //           const previous = prev[chatId] || [];

  //           const incomingMsg = {
  //             ...msg,
  //             sent_at: msg.sent_at || msg.timestamp,
  //             content: msg.content || msg.message,
  //           };

  //           const existingIndex = previous.findIndex(
  //             (m) =>
  //               m.sender_id === incomingMsg.sender_id &&
  //               m.content === incomingMsg.content &&
  //               m.id?.startsWith("temp-")
  //           );

  //           let updated;
  //           if (existingIndex !== -1) {
  //             updated = [...previous];
  //             updated[existingIndex] = incomingMsg;
  //           } else if (!previous.some((m) => m.id === incomingMsg.id)) {
  //             updated = [...previous, incomingMsg];
  //           } else {
  //             updated = previous;
  //           }

  //           updated.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
  //           return { ...prev, [chatId]: updated };
  //         });

  //         if (document.hidden) {
  //           console.log("tryingg");
  //           showNotification("New Message", msg.content);
  //           console.log("notification sent");
  //         }
  //     }
  //   };

  //   socketRef.current.onclose = () => console.log("WebSocket closed");
  //   return () => {
  //     socketRef.current?.close();
  //     setTypingUser([]);
  //   };
  // }, [token, user?.chat_id, currentUserID?.id]);

  // const sendMessage = () => {
  //   if (!input.trim()) return;

  //   const newMsg = {
  //     id: "temp-" + crypto.randomUUID(),
  //     sender_id: currentUserID?.id,
  //     sender_name: currentUserID?.name,
  //     content: input,
  //     chat_id: user?.chat_id,
  //     sent_at: new Date().toISOString(),
  //     is_deleted: false,
  //     reply_to: replyMessage?.replyMsgId || false,
  //     sender: {
  //       picture: currentUserID?.picture,
  //     },
  //   };

  //   setMessages((prev) => {
  //     const previous = prev[user?.chat_id] || [];
  //     return {
  //       ...prev,
  //       [user?.chat_id]: [...previous, newMsg],
  //     };
  //   });

  //   if (socketRef.current?.readyState === WebSocket.OPEN) {
  //     socketRef.current.send(
  //       JSON.stringify({
  //         data: input,
  //         type: "message",
  //         reply_to: replyMessage?.replyMsgId || false,
  //         is_group: user?.is_group,
  //       })
  //     );
  //     setReplyMessage(null);

  //     socketRef.current.send(
  //       JSON.stringify({
  //         type: "typing",
  //         isTyping: false,
  //       })
  //     );
  //   }

  //   setInput("");
  // };

  // const getUnreadMessage = () => {
  //   const chatId = user?.chat_id;
  //   if (!chatId || !messages[chatId]) return [];

  //   return messages[chatId]
  //     .filter((msg) => msg.sender_id !== currentUserID?.id && !msg.read) // only messages from others
  //     .map((msg) => msg.id);
  // };

  // const sendReadReceipt = () => {
  //   const unreadIds = getUnreadMessage();

  //   if (unreadIds.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
  //     socketRef.current.send(
  //       JSON.stringify({
  //         type: "message_read",
  //         message_ids: unreadIds,
  //         chat_id: user?.chat_id,
  //       })
  //     );
  //   }
  // };
  // useEffect(() => {
  //   if (user?.chat_id && !document.hidden) {
  //     sendReadReceipt();
  //   }
  // }, [messages, user?.chat_id]);

  // useEffect(() => {
  //   const chatMessages = messages[user?.chat_id] || [];
  //   chatMessages
  //     .filter((m) => m.sender_id !== currentUserID?.id && m.status !== "read")
  //     .forEach((m) => sendReadReceipt(m.id));
  // }, [messages, user?.chat_id]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  // const handleMessageSend = () => {
  //   sendMessage();
  // };

  // const sendTypingIndicatorTrue = useDebounce(() => {
  //   if (socketRef.current?.readyState === WebSocket.OPEN) {
  //     socketRef.current.send(
  //       JSON.stringify({
  //         type: "typing",
  //         isTyping: true,
  //         sender_id: currentUserID?.id,
  //       })
  //     );
  //   }
  // });
  // const sendTypingIndicatorFalse = useDebounce(() => {
  //   if (socketRef.current?.readyState === WebSocket.OPEN) {
  //     socketRef.current.send(
  //       JSON.stringify({
  //         type: "typing",
  //         isTyping: false,
  //         sender_id: currentUserID?.id,
  //       })
  //     );
  //   }
  // }, 1500);

  // const handleMessageChange = useCallback(
  //   (e) => {
  //     sendTypingIndicatorTrue();
  //     sendTypingIndicatorFalse();
  //   },
  //   [sendTypingIndicatorTrue, sendTypingIndicatorFalse]
  // );

  // const handleFileUpload = async () => {
  //   if (!file) return alert("Please select a file");

  //   const formData = new FormData();

  //   formData.append("file", file);
  //   formData.append("sender_id", currentUserID?.id);
  //   formData.append("chat_id", user?.chat_id);
  //   formData.append("is_group", user?.is_group);

  //   try {
  //     const res = await fetch(`http://127.0.0.1:8000/v1/chat/file/upload`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!res.ok) {
  //       throw new Error("Upload failed");
  //     }
  //     setFile(null);
  //     setShowModal(null);

  //     const response = await res.json();

  //     console.log(response);

  //     if (socketRef.current?.readyState === WebSocket.OPEN) {
  //       socketRef.current.send(
  //         JSON.stringify({
  //           type: "file",
  //           sender_id: currentUserID?.id,
  //           data: {
  //             file_url: response.url,
  //             file_name: response.file_name,
  //             file_type: response.file_type,
  //             unique_name: response.unique_name,
  //             size: response.size,
  //             is_group: response.is_group,
  //             sender: response.sender,
  //           },
  //         })
  //       );
  //     }

  //     const newFileMessage = {
  //       id: "temp-" + crypto.randomUUID(),
  //       sender_id: currentUserID?.id,
  //       file_name: response.file_name,
  //       type: "file",
  //       size: response.size,
  //       url: response.file_url,
  //       file_type: response.file_type,
  //       unique_name: response.unique_name,
  //       chat_id: user?.chat_id,
  //       sent_at: new Date().toISOString(),
  //       is_deleted: false,
  //       is_group: response.is_group,
  //       sender: response.sender,
  //     };
  //     setMessages((prev) => {
  //       const previous = prev[user?.chat_id] || [];
  //       return {
  //         ...prev,
  //         [user?.chat_id]: [...previous, newFileMessage],
  //       };
  //     });
  //   } catch (e) {
  //     console.log("upload error", e);
  //     alert("upload failed");
  //   }
  // };

  // const resetFile = () => {
  //   setFile(null);
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  // function formatFileSize(bytes) {
  //   if (bytes == null || isNaN(bytes)) return "-";
  //   if (bytes === 0) return "0 B";
  //   const sizes = ["B", "KB", "MB", "GB", "TB"];
  //   const i = Math.floor(Math.log(bytes) / Math.log(1024));
  //   return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  // }

  // function handleInfo(message_id) {
  //   setShowModal("msg_info");
  //   const msgArray = Object.values(messages).flat();
  //   const msg = msgArray.find((m) => m.id === message_id);

  //   if (msg) {
  //     setMessageInfo(msg);
  //   } else {
  //     console.error("no message found");
  //   }
  // }

  // async function handleDelete(message_id) {
  //   const msgArray = Object.values(messages).flat();
  //   const msg = msgArray.find((m) => m.id === message_id);

  //   if (!msg) return;

  //   try {
  //     const req = await fetch(`http://127.0.0.1:8000/v1/chat/delete/${message_id}`, {
  //       method: "POST",
  //     });

  //     if (!req.ok) throw new Error("Delete request failed");

  //     setMessages((prev) => {
  //       const newMessages = { ...prev };
  //       for (const chatId in newMessages) {
  //         newMessages[chatId] = newMessages[chatId].map((m) =>
  //           m.id === message_id ? { ...m, is_deleted: true } : m
  //         );
  //       }
  //       return newMessages;
  //     });
  //   } catch (err) {
  //     console.error("Error deleting message:", err);
  //   }
  // }

  // const handleMessageEditOnchage = (e) => {
  //   setEditContent(e.target.value);
  // };

  // async function handleEdit(message_id) {
  //   if (message_id) {
  //     console.log(message_id);
  //   } else {
  //     console.error("no message id");
  //   }
  //   const data = new FormData();

  //   data.append("content", editContent);

  //   try {
  //     const req = await fetch(`http://127.0.0.1:8000/v1/chat/edit/message/${message_id}`, {
  //       method: "PUT",
  //       body: data,
  //     });

  //     if (!req.ok) throw new Error("Edit request failed");
  //     setEditContent(null);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  // const getContextMenuXY = (clickX, clickY) => {
  //   let x = clickX;
  //   let y = clickY;

  //   const menuWidth = 73.8;
  //   const menuHeight = 180;

  //   if (x + menuWidth > window.innerWidth) {
  //     x = window.innerWidth - menuWidth - 10;
  //   }
  //   if (y + menuHeight > window.innerHeight) {
  //     y = window.innerHeight - menuHeight - 10;
  //   }
  //   return { x, y };
  // };

  // const ImageMessage = React.memo(
  //   ({
  //     type,
  //     id,
  //     sender_id,
  //     sender_name,
  //     sender_picture,
  //     content,
  //     sent_at,
  //     sent_time,
  //     is_read,
  //     is_deleted,
  //     reply_to,
  //     reply_content,
  //     reply_file_name,
  //     reply_file_type,
  //     reply_file_url,
  //     is_group,
  //     reply_sender_id,
  //     reply_sender_name,
  //     file_type,
  //     file_url,
  //     file_name,
  //     size,
  //     read,
  //     isCurrentUser,
  //     showAvatar,
  //   }) => (
  //     <div
  //       className={`relative min-w-[20%] max-w-[30%] inline-block
  //                      text-white `}
  //     >
  //       <div className="flex items-end gap-3">
  //         {!isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-8"></div>
  //         )}
  //         <div
  //           className={`w-[100%] ${
  //             sender_id === currentUserID?.id
  //               ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40  border border-white/10 text-white  text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
  //               : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
  //           } text-white p-[2px]  `}
  //           onContextMenu={(e) => {
  //             e.preventDefault();
  //             const { x, y } = getContextMenuXY(e.pageX, e.pageY);
  //             setContextMenu({
  //               x,
  //               y,
  //               msgId: id,
  //               senderId: sender_id,
  //               file_type: file_type,
  //               file_url: file_url,
  //               file_name: file_name,
  //               file_size: size,
  //             });
  //           }}
  //         >
  //           <a href={file_url}>
  //             <img
  //               src={file_url}
  //               alt={file_name}
  //               className={` ${
  //                 sender_id === currentUserID?.id
  //                   ? " rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
  //                   : "rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
  //               } `}
  //             />
  //             <span
  //               className={`absolute bottom-1 ${
  //                 sender_id === currentUserID?.id ? "right-18" : "right-2"
  //               }  text-[11px] text-gray-300 `}
  //               style={{ textShadow: "1px 1px 2px black" }}
  //             >
  //               {sent_time}
  //             </span>

  //             {sender_id === currentUserID?.id && (
  //               <>
  //                 {read | is_read ? (
  //                   <span className="absolute bottom-1 right-14 text-[14px] text-gray-300">
  //                     <FontAwesomeIcon icon={faCheckDouble} />
  //                   </span>
  //                 ) : (
  //                   <span className="absolute bottom-1 right-12 text-[14px] text-gray-300">
  //                     <FontAwesomeIcon icon={faCheck} />
  //                   </span>
  //                 )}
  //               </>
  //             )}
  //           </a>
  //         </div>
  //         {isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-8"></div>
  //         )}
  //       </div>
  //     </div>
  //   )
  // );
  // const FileMessage = React.memo(
  //   ({
  //     type,
  //     id,
  //     sender_id,
  //     sender_name,
  //     sender_picture,
  //     content,
  //     sent_at,
  //     sent_time,
  //     is_read,
  //     is_deleted,
  //     reply_to,
  //     reply_content,
  //     reply_file_name,
  //     reply_file_type,
  //     reply_file_url,
  //     is_group,
  //     reply_sender_id,
  //     reply_sender_name,
  //     file_type,
  //     file_url,
  //     file_name,
  //     size,
  //     read,
  //     isCurrentUser,
  //     showAvatar,
  //   }) => (
  //     <div
  //       className={`relative min-w-[16%] max-w-[70%] inline-block
  //                      text-white `}
  //     >
  //       <div className={`flex items-end gap-3`}>
  //         {!isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-8"></div>
  //         )}
  //         <div
  //           className={`w-[100%] ${
  //             sender_id === currentUserID?.id
  //               ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40  border border-white/10 text-white  text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
  //               : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
  //           } text-white pr-[5px] pl-[5px] pt-[5px] pb-[28px]  break-words`}
  //           onContextMenu={(e) => {
  //             e.preventDefault();
  //             const { x, y } = getContextMenuXY(e.pageX, e.pageY);
  //             setContextMenu({
  //               x,
  //               y,
  //               msgId: id,
  //               senderId: sender_id,
  //               file_type: file_type,
  //               file_url: file_url,
  //               file_name: file_name,
  //               file_size: size,
  //             });
  //           }}
  //         >
  //           <a href={file_url} target="_blank" rel="noopener noreferrer">
  //             <div
  //               className={` p-2 flex gap-2 items-center  ${
  //                 sender_id === currentUserID?.id
  //                   ? "bg-gradient-to-br from-blue-500/70 to-blue-600/10  border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
  //                   : "bg-gradient-to-br from-gray-600/50 to-gray-900/10  border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
  //               }`}
  //             >
  //               <FileIcons type={file_type} size={28} className="text-white" />

  //               <div className="flex flex-col gap-1">
  //                 <p className="text-[13.5px]">{file_name}</p>
  //                 <div className="flex items-center gap-1">
  //                   <span className="text-[10px] text-gray-300">{file_type}</span>
  //                   <span className="text-[10px] text-gray-300">•</span>
  //                   <span className="text-[10px] text-gray-300">{formatFileSize(Number(size))}</span>
  //                 </div>
  //               </div>
  //             </div>
  //           </a>
  //           <span
  //             className={`absolute bottom-1 ${
  //               sender_id === currentUserID?.id ? "right-18" : "right-2"
  //             }  text-[11px] text-gray-300`}
  //           >
  //             {sent_time}
  //           </span>
  //           {sender_id === currentUserID?.id && (
  //             <>
  //               {read || is_read ? (
  //                 <span className="absolute bottom-1 right-12 text-[14px] text-gray-300">
  //                   <FontAwesomeIcon icon={faCheckDouble} />
  //                 </span>
  //               ) : (
  //                 <span className="absolute bottom-1 right-12 text-[14px] text-gray-300">
  //                   <FontAwesomeIcon icon={faCheck} />
  //                 </span>
  //               )}
  //             </>
  //           )}
  //         </div>
  //         {isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-8"></div>
  //         )}
  //       </div>
  //     </div>
  //   )
  // );

  // const TextMessage = React.memo(
  //   ({
  //     type,
  //     id,
  //     sender_id,
  //     sender_name,
  //     sender_picture,
  //     content,
  //     sent_at,
  //     sent_time,
  //     is_read,
  //     is_deleted,
  //     reply_to,
  //     reply_content,
  //     reply_file_name,
  //     reply_file_type,
  //     reply_file_url,
  //     is_group,
  //     reply_sender_id,
  //     reply_sender_name,
  //     file_type,
  //     file_url,
  //     file_name,
  //     size,
  //     read,
  //     isCurrentUser,
  //     showAvatar,
  //   }) => (
  //     <div
  //       className={`relative min-w-[16%] max-w-[70%] inline-block
  //                      text-white `}
  //     >
  //       <div className={`flex items-end gap-3 `}>
  //         {!isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-10"></div>
  //         )}
  //         <div
  //           className={` w-[100%] ${
  //             sender_id === currentUserID?.id
  //               ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 border border-white/10 text-white text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
  //               : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
  //           } text-white pr-[5px] pl-[5px] pt-[5px] pb-[10px]  `}
  //           onContextMenu={(e) => {
  //             e.preventDefault();
  //             const { x, y } = getContextMenuXY(e.pageX, e.pageY);
  //             setContextMenu({
  //               x,
  //               y,
  //               msgId: id,
  //               senderId: sender_id,
  //               msgInfo: content,
  //             });
  //           }}
  //         >
  //           {" "}
  //           <span className="flex flex-col gap-1">
  //             {reply_to && (
  //               <span
  //                 className={` flex ${
  //                   sender_id === currentUserID?.id
  //                     ? "bg-gradient-to-br from-blue-500/70 to-blue-600/10  border border-white/10 text-white rounded-br-[6px] rounded-bl-[6px] rounded-tl-[6px] "
  //                     : "bg-gradient-to-br from-gray-600/50 to-gray-900/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[6px] rounded-bl-[6px] rounded-tr-[6px]"
  //                 }`}
  //               >
  //                 {reply_file_url ? (
  //                   reply_file_type.startsWith("image/") ? (
  //                     <div className="flex w-[100%] gap-2">
  //                       <div
  //                         className={`bg-[#ffffffcf] ${
  //                           sender_id === currentUserID?.id ? "rounded-l-[4px]" : "rounded-bl-[4px]"
  //                         }  w-[8px] `}
  //                       ></div>
  //                       <div className="flex justify-between gap-2 w-[100%]">
  //                         {reply_sender_id === currentUserID?.id ? (
  //                           <p className="mt-2 text-[12px]">You</p>
  //                         ) : (
  //                           <p className="mt-2 text-[12px]">{reply_sender_name}</p>
  //                         )}
  //                         <img src={reply_file_url} alt={reply_file_name} className="max-h-15 rounded-md" />
  //                       </div>
  //                     </div>
  //                   ) : (
  //                     <div className="flex gap-2">
  //                       <div
  //                         className={`bg-[#ffffffcf] ${
  //                           sender_id === currentUserID?.id ? "rounded-l-[4px]" : "rounded-bl-[4px]"
  //                         }  w-[8px] `}
  //                       ></div>
  //                       <div className="pb-2">
  //                         {reply_sender_id === currentUserID?.id ? (
  //                           <p className="mt-2 text-[12px]">You</p>
  //                         ) : (
  //                           <p className="mt-2 text-[12px]">{reply_sender_name}</p>
  //                         )}
  //                         <div className="flex items-center">
  //                           <FileIcons type={reply_file_type} size={23} className="text-white" />
  //                           <span className="p-2 text-[14px]">{reply_file_name}</span>
  //                         </div>
  //                       </div>
  //                     </div>
  //                   )
  //                 ) : (
  //                   <div className="flex gap-2">
  //                     <div
  //                       className={`bg-[#ffffffcf] ${
  //                         sender_id === currentUserID?.id ? "rounded-l-[4px]" : "rounded-bl-[4px]"
  //                       }  w-[8px] `}
  //                     ></div>
  //                     <div className="pb-2">
  //                       {reply_sender_id === currentUserID?.id ? (
  //                         <p className="mt-2 text-[12px]">You</p>
  //                       ) : (
  //                         <p className="mt-2 text-[12px]">{reply_sender_name}</p>
  //                       )}
  //                       <span className="pr-2  text-[13.5px]">{reply_content}</span>
  //                     </div>
  //                   </div>
  //                 )}
  //               </span>
  //             )}
  //             <span className="pr-20 pl-2 pt-1 text-[14px]">{content}</span>
  //           </span>
  //           <span
  //             className={`absolute bottom-1 ${
  //               sender_id === currentUserID?.id ? "right-18" : "right-2"
  //             }  text-[11px] text-gray-300`}
  //           >
  //             {sent_time}
  //           </span>
  //           {sender_id === currentUserID?.id && (
  //             <>
  //               {read || is_read ? (
  //                 <span className="absolute bottom-1 right-12 text-[14px] text-gray-300">
  //                   <FontAwesomeIcon icon={faCheckDouble} />
  //                 </span>
  //               ) : (
  //                 <span className="absolute bottom-1 right-12 text-[14px] text-gray-300">
  //                   <FontAwesomeIcon icon={faCheck} />
  //                 </span>
  //               )}
  //             </>
  //           )}
  //         </div>
  //         {isCurrentUser && showAvatar ? (
  //           <img src={sender_picture} loading="lazy" className="h-[30px] rounded-[50%]" />
  //         ) : (
  //           <div className="w-10"></div>
  //         )}
  //       </div>
  //     </div>
  //   )
  // );

  if (users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400">
        <p className="pl-3 pt-1 pb-1 pr-3 rounded-4xl bg-[#ffffff13]">Select a user to start chatting</p>
      </div>
    );
  }
  console.log("user", users);

  const is_pro = false;

  return (
    <>
      <div className={`flex ${is_pro ? "w-[75%]" : "w-[75%]"} `}>
        {users.map((user) => {
          return (
            <div className="w-full overflow-hidden bg-[#14171c] border-r-1 border-[#ffffff2c] flex flex-col">
              {/* Header */}
              <div className="text-[#e8e8e8e0] bg-[#01040963] flex justify-between items-center pr-4 pl-4 pt-2 pb-2 border-b border-[#ffffff30]">
                <div className="flex flex-col">
                  <p onClick={() => setShowModal("account")} className="text-[15px] cursor-pointer">
                    {user.name}
                  </p>
                  {typingUser.length > 0 ? (
                    <small className="text-[11px]  text-green-400">typing...</small>
                  ) : (
                    <small className="text-[11px] opacity-70">last seen recently</small>
                  )}
                </div>
                <div className="flex gap-4 text-sm items-center">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="cursor-pointer" />
                  <FontAwesomeIcon icon={faEllipsisVertical} className="cursor-pointer" />
                  <FontAwesomeIcon
                    onClick={() => onCancleSelect(user.chat_id)}
                    icon={faXmark}
                    className="p-[3px] pt-1 pb-1 rounded-[50%] cursor-pointer hover:bg-[#ff2b2bdf]"
                  />
                </div>
              </div>

              {/* Message Area */}
              <div
                className={`space-y-3  ${
                  currentUserID?.is_pro ? "w-[94%]" : "w-[100%]"
                } p-3 flex-1  overflow-y-auto  hide-scrollbar`}
              >
                {sortedMessages.map((msg, i) => {
                  const prevMsg = i > 0 ? sortedMessages[i - 1] : null;
                  const isCurrentUser = msg.sender_id === currentUserID?.id;
                  const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                  return (
                    <>
                      <div
                        key={msg.id}
                        className={` ${msg.sender_id === currentUserID?.id ? "text-right" : "text-left"}`}
                      >
                        {msg.is_deleted ? (
                          <>
                            {msg.is_group ? (
                              <>
                                {!isCurrentUser ? (
                                  <p
                                    className={`relative inline-block text center ml-10 min-w-[12%] max-w-[70%] ${
                                      msg.sender_id === currentUserID?.id
                                        ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px] text-left"
                                        : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                    } text-white p-2 break-words`}
                                  >
                                    <span className="flex items-center gap-2 text-[14px]">
                                      <Ban size={20} className="text-white" />
                                      This message was deleted
                                    </span>
                                  </p>
                                ) : (
                                  <p
                                    className={`relative inline-block text mr-10 center min-w-[12%] max-w-[70%] ${
                                      msg.sender_id === currentUserID?.id
                                        ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px] text-left"
                                        : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                    } text-white p-2 break-words`}
                                  >
                                    <span className="flex items-center gap-2 text-[14px]">
                                      <Ban size={20} className="text-white" />
                                      You deleted this message
                                    </span>
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                {isCurrentUser ? (
                                  <p
                                    className={`relative inline-block text center min-w-[12%] max-w-[70%] ${
                                      msg.sender_id === currentUserID?.id
                                        ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px] text-left"
                                        : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                    } text-white p-2 break-words`}
                                  >
                                    <span className="flex items-center gap-2 text-[14px]">
                                      <Ban size={20} className="text-white" />
                                      You deleted this message
                                    </span>
                                  </p>
                                ) : (
                                  <p
                                    className={`relative inline-block text center min-w-[12%] max-w-[70%] ${
                                      msg.sender_id === currentUserID?.id
                                        ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px] text-left"
                                        : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                    } text-white p-2 break-words`}
                                  >
                                    <span className="flex items-center gap-2 text-[14px]">
                                      <Ban size={20} className="text-white" />
                                      This message was deleted
                                    </span>
                                  </p>
                                )}
                              </>
                            )}
                          </>
                        ) : msg.is_group ? (
                          <>
                            {msg.file_url ? (
                              msg.file_type.startsWith("image/") ? (
                                <ImageMessage
                                  type={msg.type}
                                  id={msg.id}
                                  sender_id={msg.sender_id}
                                  sender_name={msg.sender_name}
                                  sender_picture={msg.sender.picture}
                                  content={msg.content}
                                  sent_at={msg.sent_at}
                                  sent_time={msg.sent_time}
                                  is_read={msg.is_read}
                                  is_deleted={msg.is_deleted}
                                  reply_to={msg.reply_to}
                                  reply_content={msg.reply_content}
                                  reply_file_name={msg.reply_file_name}
                                  reply_file_type={msg.reply_file_type}
                                  reply_file_url={msg.reply_file_url}
                                  is_group={msg.is_group}
                                  reply_sender_id={msg.reply_sender?.id}
                                  reply_sender_name={msg.reply_sender?.name}
                                  file_type={msg.file_type}
                                  file_url={msg.file_url}
                                  file_name={msg.file_name}
                                  size={msg.size}
                                  read={msg.read}
                                  isCurrentUser={isCurrentUser}
                                  showAvatar={showAvatar}
                                />
                              ) : (
                                <FileMessage
                                  type={msg.type}
                                  id={msg.id}
                                  sender_id={msg.sender_id}
                                  sender_name={msg.sender_name}
                                  sender_picture={msg.sender.picture}
                                  content={msg.content}
                                  sent_at={msg.sent_at}
                                  sent_time={msg.sent_time}
                                  is_read={msg.is_read}
                                  is_deleted={msg.is_deleted}
                                  reply_to={msg.reply_to}
                                  reply_content={msg.reply_content}
                                  reply_file_name={msg.reply_file_name}
                                  reply_file_type={msg.reply_file_type}
                                  reply_file_url={msg.reply_file_url}
                                  is_group={msg.is_group}
                                  reply_sender_id={msg.reply_sender?.id}
                                  reply_sender_name={msg.reply_sender?.name}
                                  file_type={msg.file_type}
                                  file_url={msg.file_url}
                                  file_name={msg.file_name}
                                  size={msg.size}
                                  read={msg.read}
                                  isCurrentUser={isCurrentUser}
                                  showAvatar={showAvatar}
                                />
                              )
                            ) : (
                              <TextMessage
                                type={msg.type}
                                id={msg.id}
                                sender_id={msg.sender_id}
                                sender_name={msg.sender_name}
                                sender_picture={msg.sender.picture}
                                content={msg.content}
                                sent_at={msg.sent_at}
                                sent_time={msg.sent_time}
                                is_read={msg.is_read}
                                is_deleted={msg.is_deleted}
                                reply_to={msg.reply_to}
                                reply_content={msg.reply_content}
                                reply_file_name={msg.reply_file_name}
                                reply_file_type={msg.reply_file_type}
                                reply_file_url={msg.reply_file_url}
                                is_group={msg.is_group}
                                reply_sender_id={msg.reply_sender?.id}
                                reply_sender_name={msg.reply_sender?.name}
                                file_type={msg.file_type}
                                file_url={msg.file_url}
                                file_name={msg.file_name}
                                size={msg.size}
                                read={msg.read}
                                isCurrentUser={isCurrentUser}
                                showAvatar={showAvatar}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {msg.file_url ? (
                              msg.file_type.startsWith("image/") ? (
                                <div
                                  className={`relative inline-block min-w-[12%] max-w-[70%] ${
                                    msg.sender_id === currentUserID?.id
                                      ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white  text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
                                      : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                  } text-white p-[2px]  break-words`}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    const { x, y } = getContextMenuXY(e.pageX, e.pageY);
                                    setContextMenu({
                                      x,
                                      y,
                                      msgId: msg.id,
                                      senderId: msg.sender_id,
                                      file_type: msg.file_type,
                                      file_url: msg.file_url,
                                      file_name: msg.file_name,
                                    });
                                  }}
                                >
                                  <a href={msg.file_url}>
                                    <img
                                      src={msg.file_url}
                                      alt={msg.file_name}
                                      className={`max-h-40 ${
                                        msg.sender_id === currentUserID?.id
                                          ? " rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
                                          : "rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                      } `}
                                    />
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
                                        {msg.read | msg.is_read ? (
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
                                    msg.sender_id === currentUserID?.id
                                      ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white  text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
                                      : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                  } text-white pr-[5px] pl-[5px] pt-[5px] pb-[28px]  break-words`}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    const { x, y } = getContextMenuXY(e.pageX, e.pageY);
                                    setContextMenu({
                                      x,
                                      y,
                                      msgId: msg.id,
                                      senderId: msg.sender_id,
                                      file_type: msg.file_type,
                                      file_url: msg.file_url,
                                      file_name: msg.file_name,
                                      file_size: msg.size,
                                    });
                                  }}
                                >
                                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                                    <div
                                      className={` p-2 flex gap-2 items-center  ${
                                        msg.sender_id === currentUserID?.id
                                          ? "bg-gradient-to-br from-blue-600/20 to-blue-600/10 backdrop-blur-md border border-white/10 text-white rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
                                          : "bg-gradient-to-br from-gray-600/50 to-gray-900/10 backdrop-blur-md border border-white/10 text-gray-100  rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
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
                              <div
                                className={`relative inline-block min-w-[12%] max-w-[70%] ${
                                  msg.sender_id === currentUserID?.id
                                    ? "bg-gradient-to-br from-blue-500/70 to-blue-500/40 backdrop-blur-md border border-white/10 text-white text-left rounded-br-[7px] rounded-bl-[7px] rounded-tl-[7px]"
                                    : "bg-gradient-to-br from-gray-200/20 to-gray-100/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[7px] rounded-bl-[7px] rounded-tr-[7px]"
                                }  pr-[5px] pl-[5px] pt-[5px] pb-[10px]  `}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  const { x, y } = getContextMenuXY(e.pageX, e.pageY);
                                  setContextMenu({
                                    x,
                                    y,
                                    msgId: msg.id,
                                    senderId: msg.sender_id,
                                    msgInfo: msg.content,
                                  });
                                }}
                              >
                                {" "}
                                <span className="flex flex-col gap-1">
                                  {msg.reply_to && (
                                    <span
                                      className={` flex ${
                                        msg.sender_id === currentUserID?.id
                                          ? "bg-gradient-to-br from-blue-600/20 to-blue-600/10 backdrop-blur-md border border-white/10 text-white rounded-br-[6px] rounded-bl-[6px] rounded-tl-[6px] "
                                          : "bg-gradient-to-br from-gray-600/50 to-gray-900/10 backdrop-blur-md border border-white/10 text-gray-100 rounded-br-[6px] rounded-bl-[6px] rounded-tr-[6px]"
                                      }`}
                                    >
                                      {msg.reply_file_url ? (
                                        msg.reply_file_type.startsWith("image/") ? (
                                          <div className="flex w-[100%] gap-2">
                                            <div
                                              className={`bg-[#ffffffcf] ${
                                                msg.sender_id === currentUserID?.id
                                                  ? "rounded-l-[4px]"
                                                  : "rounded-bl-[4px]"
                                              }  w-[8px] `}
                                            ></div>
                                            <div className="flex justify-between gap-2 w-[100%]">
                                              {msg.reply_sender?.id === currentUserID?.id ? (
                                                <p className="mt-2 text-[12px]">You</p>
                                              ) : (
                                                <p className="mt-2 text-[12px]">{msg.reply_sender?.name}</p>
                                              )}
                                              <img
                                                src={msg.reply_file_url}
                                                alt={msg.reply_file_name}
                                                className="max-h-15 rounded-md"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <div
                                              className={`bg-[#ffffffcf] ${
                                                msg.sender_id === currentUserID?.id
                                                  ? "rounded-l-[4px]"
                                                  : "rounded-bl-[4px]"
                                              }  w-[8px] `}
                                            ></div>
                                            <div className="pb-2">
                                              {msg.reply_sender?.id === currentUserID?.id ? (
                                                <p className="mt-2 text-[12px]">You</p>
                                              ) : (
                                                <p className="mt-2 text-[12px]">{msg.reply_sender?.name}</p>
                                              )}
                                              <div className="flex items-center">
                                                <FileIcons
                                                  type={msg.reply_file_type}
                                                  size={23}
                                                  className="text-white"
                                                />
                                                <span className="p-2 text-[14px]">{msg.reply_file_name}</span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      ) : (
                                        <div className="flex gap-2">
                                          <div
                                            className={`bg-[#ffffffcf] ${
                                              msg.sender_id === currentUserID?.id
                                                ? "rounded-l-[4px]"
                                                : "rounded-bl-[4px]"
                                            }  w-[8px] `}
                                          ></div>
                                          <div className="pb-2">
                                            {msg.reply_sender?.id === currentUserID?.id ? (
                                              <p className="mt-2 text-[12px]">You</p>
                                            ) : (
                                              <p className="mt-2 text-[12px]">{msg.reply_sender?.name}</p>
                                            )}
                                            <span className="pr-2  text-[13.5px]">{msg.reply_content}</span>
                                          </div>
                                        </div>
                                      )}
                                    </span>
                                  )}
                                  <span className="pr-20 pl-2 pt-1 text-[14px]">{msg.content}</span>
                                </span>
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
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {is_pro === false && (
                        <div className="absolute flex flex-col gap-10 items-center pt-7 right-[22px] top-[17%] h-[71%] w-[50px] bg-[rgba(1,4,9,0.29)] border-[1px] rounded-md border-[#ffffff14] text-gray-300/70">
                          {msg.is_group ? (
                            <FontAwesomeIcon icon={faUsers} className=" text-[16  px] cursor-pointer" />
                          ) : (
                            <FontAwesomeIcon icon={faUser} className=" text-[16 px] cursor-pointer" />
                          )}

                          <FontAwesomeIcon icon={faCircleInfo} className=" text-[16 px] cursor-pointer" />
                          <FontAwesomeIcon icon={faImage} className=" text-[16  px] cursor-pointer" />
                          <FontAwesomeIcon icon={faFileAlt} className=" text-[16  px] cursor-pointer" />
                          <FontAwesomeIcon icon={faVideo} className=" text-[16  px] cursor-pointer" />
                          <FontAwesomeIcon icon={faThumbTack} className=" text-[16  px] cursor-pointer" />
                          <FontAwesomeIcon icon={faRobot} className=" text-[16  px] cursor-pointer" />
                          <FontAwesomeIcon icon={faGears} className=" text-[16  px] cursor-pointer" />
                        </div>
                      )}
                    </>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="flex items-center  justify-evenly  pb-3  pt-3 w-full z-1">
                <div
                  className={`flex flex-col border-1 border-[#ffffff39] ${
                    users.length === 1 ? "w-[93%]" : "w-[85%]"
                  }  rounded-md  `}
                >
                  {replyMessage && (
                    <>
                      {replyMessage.replyFileUrl ? (
                        replyMessage.replyFileType.startsWith("image/") ? (
                          <div className="text-white flex animate-slideUp duration-200 rounded-t-md p-2 bg-[#01040963] border-t border-[#ffffff23]">
                            <div className="flex w-[100%]  rounded-md justify-between items-center-safe gap-10 bg-[#ffffff1d]">
                              <div className="flex h-[100%]">
                                <div className="bg-white w-[7px] rounded-l-md"></div>
                                <p className="flex flex-col gap-2 p-3">
                                  <span>Reply</span>
                                  {replyMessage.replyFileName}
                                </p>
                              </div>
                              <div className="flex gap-6 p-3">
                                <img
                                  src={replyMessage.replyFileUrl}
                                  alt={replyMessage.replyFileName}
                                  className="max-h-20 rounded-md border"
                                />
                                <button
                                  className="cursor-pointer  text-xl justify-center text-white flex items-center  mr-3 mb-8"
                                  onClick={() => setReplyMessage(null)}
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-white border-t border-[#ffffff23] flex animate-slideUp duration-200 rounded-t-md p-2 bg-[#01040963]">
                            <div className="flex w-[100%]  rounded-md justify-between items-center-safe gap-10 bg-[#ffffff1d]">
                              <div className="flex h-[100%]">
                                <div className="bg-white w-[7px] rounded-l-md"></div>
                                <p className="flex flex-col gap-2 p-3">
                                  <span>Reply</span>

                                  <span className="flex items-center gap-3 text-[14px]">
                                    <FileIcons
                                      type={replyMessage.replyFileType}
                                      size={25}
                                      className="text-white"
                                    />
                                    {replyMessage.replyFileName} -{" "}
                                    {formatFileSize(Number(replyMessage.replyFileSize))}
                                  </span>
                                </p>
                              </div>

                              <button
                                className="cursor-pointer  text-xl justify-center text-white flex items-center  mr-3 mb-8"
                                onClick={() => setReplyMessage(null)}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-white border-t border-[#ffffff23] flex animate-slideUp duration-200 rounded-t-md p-2 bg-[#01040963]">
                          <div className="flex w-[100%]  rounded-md justify-between items-center-safe gap-10 bg-[#ffffff1d]">
                            <div className="flex h-[100%]">
                              <div className="bg-white w-[7px] rounded-l-md"></div>
                              <p className="flex flex-col gap-2 p-3">
                                <span>Reply</span>

                                <span className="flex items-center gap-3 text-[14px]">
                                  {replyMessage.replyMsgContent}
                                </span>
                              </p>
                            </div>

                            <button
                              className="cursor-pointer  text-xl justify-center text-white flex items-center  mr-3 mb-8"
                              onClick={() => setReplyMessage(null)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex w-full bg-[rgba(1,4,9,0.39)] rounded-md items-center text-[#e8e8e8e0] pr-5 pl-4 gap-4  border-[#ffffff39]">
                    <FontAwesomeIcon icon={faFaceSmile} className="text-[20px]" />
                    <input
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        handleMessageChange(e);
                      }}
                      onKeyDown={handleKeyPress}
                      placeholder="Write a message..."
                      className="w-full h-[3.5rem] outline-0 bg-transparent text-white"
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
                </div>
                <div className="flex items-center h-full w-[40px]">
                  <FontAwesomeIcon
                    onClick={() => handleMessageSend()}
                    icon={faPaperPlane}
                    className={`rotate-45 pl-1 text-[25px] ${input ? "text-white" : "text-[#e8e8e8c8]"} `}
                  />
                </div>
              </div>
            </div>
          );
          {
            showModal == "account" && (
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
                        <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">
                          First name: {user.first_name}
                        </p>
                        <p className="pt-1 pb-1 pl-3 rounded-md bg-[#b7b7b7b3]">
                          Last name: {user.last_name}
                        </p>
                        <p className="pt-1 pb-1 pl-3  rounded-md bg-[#b7b7b7b3]">
                          Date of birth: {user.d_o_b}
                        </p>
                      </div>
                      <div className="w-[60%] mt-10 h-full flex flex-col pb-10 gap-[1rem]">
                        <p className="border-b-3 w-[2.7rem] ">About</p>
                        <p className="pt-1 pb-1 pl-3 h-full rounded-md bg-[#b7b7b7b3]"> {user.about}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          {
            contextMenu.msgId && (
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
                      onClick={() =>
                        setShowModal({ EditMsgId: contextMenu.msgId, EditMsgInfo: contextMenu.msgInfo })
                      }
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
                  onClick={() =>
                    setReplyMessage({
                      replyMsgId: contextMenu.msgId,
                      replyFileUrl: contextMenu.file_url || null,
                      replyFileType: contextMenu.file_type || null,
                      replyFileName: contextMenu.file_name || null,
                      replyFileSize: contextMenu.file_size || null,
                      replyMsgContent: contextMenu.msgInfo || null,
                    })
                  }
                >
                  Reply
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelect(contextMenu.msgId)}
                >
                  Select
                </li>
              </ul>
            );
          }
          {
            showModal == "file" && (
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
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="max-h-40 rounded-md border"
                        />
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
            );
          }

          {
            /* message info */
          }
          {
            showModal === "msg_info" && (
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
                            {messageInfo.sender.name || messageInfo.sender_name}
                          </p>
                          <p>
                            <span className="font-medium">Type:</span> {messageInfo.file_type}
                          </p>
                          <p>
                            <span className="font-medium">Size:</span>{" "}
                            {formatFileSize(Number(messageInfo.size))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <a href={messageInfo.file_url} target="_blank" rel="noopener noreferrer">
                          <div className="rounded-lg p-3 flex gap-3 items-center bg-gray-700 hover:bg-gray-600 transition">
                            <FileIcons type={messageInfo.file_type} size={32} className="text-white" />
                            <div>
                              <p className="text-sm font-medium text-white truncate">
                                {messageInfo.file_name}
                              </p>
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
                            {messageInfo.sender.name || messageInfo.sender_name}
                          </p>
                          <p>
                            <span className="font-medium">Type:</span> {messageInfo.file_type}
                          </p>
                          <p>
                            <span className="font-medium">Size:</span>{" "}
                            {formatFileSize(Number(messageInfo.size))}
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
                          {messageInfo.sender.name || messageInfo.sender_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          {
            /* Delete model */
          }
          {
            showModal?.msgId && (
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
            );
          }
          {
            showModal?.EditMsgId && (
              <div
                id="overlay"
                onClick={handleOverlayClick}
                className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex items-center justify-center z-50"
              >
                <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-80">
                  <h2 className="text-lg font-semibold mb-2">Edit Message</h2>
                  <p className="text-sm text-gray-300 mb-4">{showModal.EditMsgInfo}</p>
                  <textarea
                    name="content"
                    value={editContent}
                    onChange={(e) => {
                      if (e) {
                        handleMessageEditOnchage(e);
                      }
                      e.target.value = "";
                    }}
                    id="content"
                    className="w-[100%] border-1"
                  ></textarea>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowModal(null)}
                      className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleEdit(showModal.EditMsgId);
                        setShowModal(null);
                      }}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </>
  );
}

export default ChatArea;
