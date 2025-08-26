import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { GetValidAccessToken, GetAllUsers } from "./index";
import GroupProfile from "../assets/group-profile.jpg";

export async function getFriends(token) {
  const response = await fetch("http://127.0.0.1:8000/v1/chat/friends", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unauthorized or failed to fetch friends");
  }
  const data = await response.json();
  console.log(data);
  return data;
}

const ChatList = ({ onSelect, selectedUser }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [request, setRequest] = useState({});
  const [search, setSearch] = useState("");
  const [addUserToGroup, setAddUserToGroup] = useState({});
  const [groupName, setGroupName] = useState("");

  const truncated = (message) => {
    if (!message) return;
    if (message.length > 27) {
      return message.slice(0, 27) + "...";
    }

    return message + "...";
  };

  function formatLastMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      // Show only the time if it's today
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    // Check if in the same week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday start
    startOfWeek.setHours(0, 0, 0, 0);

    if (date >= startOfWeek) {
      // Show weekday name if this week
      return date.toLocaleDateString([], { weekday: "long" });
    }

    // Otherwise show abbreviated month and day
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  useEffect(() => {
    const Getusers = async () => {
      try {
        const user = await GetAllUsers();
        if (user) {
          setUsers(user);
        }
      } catch (error) {
        console.log(error);
      }
    };
    Getusers();
  }, []);

  const SendFriendRquest = async (mail, id) => {
    const token = await GetValidAccessToken();
    if (!token) return;
    try {
      const res = await fetch("http://127.0.0.1:8000/v1/chat/invite/friend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: mail }),
      });

      if (!res.ok) throw new Error("friend Request failed");
      setRequest((prev) => ({ ...prev, [id]: "requested" }));

      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.log("invte", error);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.id === "overlay") {
      setShowModal(false);
      setGroupName("");
      if (Object.keys(addUserToGroup)) {
        setAddUserToGroup({});
      }
    }
  };

  const filterFriends = friends.filter((friend) => {
    if (filter === "unread" && friend.unread <= 0) return false;
    if (filter === "groups" && !friend.is_group) return false;
    if (!friend.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await GetValidAccessToken();
        const data = await getFriends(token);

        setFriends(data);
      } catch (error) {
        console.error("Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    Object.values(addUserToGroup).forEach((user) => {
      formData.append("member_ids", user.id);
    });

    if (groupName) {
      formData.append("name", groupName);
    } else return;

    try {
      const token = await GetValidAccessToken();

      const req = await fetch(`http://127.0.0.1:8000/v1/chat/create/group`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!req.ok) throw new Error("create group request failed");

      const data = await req.json();
      console.log("Group created:", data);

      setAddUserToGroup({});
      setGroupName("");
      setShowModal(false);
    } catch (error) {}
  };

  return (
    <div className="flex text-[#e8e8e8e0] flex-col w-[25%] border-r-1 border-[var(--border)]  ">
      <div className="flex flex-col w-[100%] gap-4 p-[1rem]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="bg-[#15191fd1] border-1 outline-0 h-[2.5rem] rounded-[10px] border-[var(--border)] text-md pl-4 pr-2"
        />
        <div className="flex w-[100%] justify-between items-center ">
          <div className="flex items-center gap-3 ">
            <button
              onClick={() => setFilter("all")}
              type="button"
              className={`text-sm  border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[10px] cursor-pointer ${
                filter === "all" ? "bg-[#ffffff33]" : "bg-0"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              type="button"
              className={`text-sm cursor-pointer border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[10px] ${
                filter === "unread" ? "bg-[#ffffff33]" : "bg-0"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("groups")}
              type="button"
              className={`text-sm cursor-pointer border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[10px] ${
                filter === "groups" ? "bg-[#ffffff33]" : "bg-0"
              }`}
            >
              Group
            </button>
          </div>

          <FontAwesomeIcon
            onClick={() => setShowModal("add")}
            icon={faPenToSquare}
            className="text-sm border-1 border-[var(--border)] pt-2 pb-2 pr-3 pl-3 rounded-[10px]"
          />
        </div>
      </div>
      {loading ? (
        <div className="p-4 space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-full bg-gray-700"></div>
              <div className="flex-1">
                <div className="w-1/3 h-3 bg-gray-700 rounded mb-2"></div>
                <div className="w-1/2 h-2 bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filterFriends.length === 0 ? (
        <p className="text-center p-4 text-gray-400">No friends found</p>
      ) : (
        filterFriends.map((friend) => (
          <div className="flex flex-col">
            <div
              onClick={() => onSelect(friend)}
              className={` hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer ${
                selectedUser === friend ? "bg-[#ffffff15]" : "bg-0"
              }`}
            >
              {friend.picture ? (
                <img
                  src={friend.picture}
                  alt="..."
                  referrerPolicy="no-referrer"
                  className="rounded-[50%] w-[40px] h-[40px]"
                />
              ) : (
                <img
                  src={GroupProfile}
                  alt="..."
                  referrerPolicy="no-referrer"
                  className="rounded-[50%] w-[40px] h-[40px]"
                />
              )}

              <div className="flex flex-col w-[100%] ml-1 gap-1">
                <p>{friend.name}</p>
                <small className="opacity-70">{truncated(friend?.last_message)}</small>
              </div>
              <div className="flex flex-col  gap-1 items-end">
                <p className="text-[13px] inline-block text-nowrap">
                  {formatLastMessageTime(friend.last_message_time)}
                </p>

                {friend.unread > 0 && (
                  <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">
                    {friend.unread}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
      {showModal == "add" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex justify-center items-center z-50"
        >
          <div className="bg-opacity-50 absolute left-[25%] top-[20%] flex flex-col  p-3 bg-[#000c] items-center text-[#ffffffd6] border-1 border-[#ffffff34] rounded-xl">
            <p
              onClick={() => setShowModal("adduser")}
              className="cursor-pointer hover:text-white hover:bg-[#ffffff13] p-2 rounded-md"
            >
              Add Friends
            </p>
            <p
              onClick={() => setShowModal("addgroup")}
              className="cursor-pointer hover:text-white hover:bg-[#ffffff15] p-2 rounded-md"
            >
              Create Group
            </p>
          </div>
        </div>
      )}
      {showModal == "adduser" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex justify-center items-center z-50"
        >
          <div className="bg-opacity-50 w-[30%] h-[80%] absolute left-[35%] top-[8%] flex flex-col gap-5   p-4 bg-gray-800 items-center text-[#fff] border-1 border-[#ffffff34] rounded-xl">
            <p className="flex font-semibold text-[17px] w-[100%]">Add User</p>
            <div className="flex w-[100%]">
              <input
                type="search"
                name="user"
                id="user"
                placeholder="search"
                className="border-1 w-[100%] h-10 pr-3 pl-5 outline-0 border-[#ffffff70] rounded-md"
              />
            </div>
            <div className="flex flex-col w-[100%]">
              {users.map((friend) => {
                const status = request[friend.id] || "adduser";
                return (
                  <div className="  flex w-[100%] items-center  pt-2 pb-2 gap-2">
                    <img src={friend.picture} alt="..." className="rounded-[50%] w-[40px] h-[40px]" />
                    <div className="flex flex-col  w-[100%] ml-1 gap-1">
                      <p>{friend.name}</p>
                    </div>
                    {status === "adduser" ? (
                      <button
                        onClick={() => SendFriendRquest(friend.email, friend.id)}
                        type="button"
                        className="w-[10rem] pt-[6px] pb-[6px] pr-2 pl-2 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-4xl text-[14px]"
                      >
                        Add Friend
                      </button>
                    ) : status === "requested" ? (
                      <button
                        type="button"
                        className="w-[10rem] pt-[6px] pb-[6px] pr-2 pl-2 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-4xl text-[14px]"
                      >
                        Requested
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showModal == "addgroup" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] backdrop-blur-[2px] flex justify-center items-center z-50"
        >
          <div className="bg-opacity-50 w-[30%] h-[80%] absolute left-[35%] top-[8%] flex flex-col gap-5  p-4 bg-gray-800 items-center text-[#fff] border-1 border-[#ffffff34] rounded-xl">
            <p className="flex font-semibold text-[17px] w-[100%]">New Group</p>
            <div className="flex w-[100%] gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name*"
                className="border-1 border-[#ffffff8f] w-[100%] h-10 pr-3 pl-5 outline-0 rounded-md"
              />
              <button
                onClick={(e) => handleSubmit(e)}
                className="cursor-pointer hover:bg-blue-600 bg-blue-500 rounded-md pr-3 pl-3"
              >
                Create
              </button>
            </div>
            {addUserToGroup ? (
              <div className=" flex w-[100%] gap-2">
                {Object.values(addUserToGroup).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2  pr-2 pl-2 pt-1 pb-1 rounded-md bg-[#ffffff2f]"
                  >
                    <span>{user.name}</span>
                    <button
                      onClick={() =>
                        setAddUserToGroup((prev) => {
                          const newState = { ...prev };
                          delete newState[user.id];
                          return newState;
                        })
                      }
                      className="text-red-500 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col w-[100%]">
              {friends.map((friend) => {
                return (
                  <div key={friend.id} className="flex w-[100%] items-center pt-2 pb-2 gap-2">
                    <img src={friend.picture} alt="..." className="rounded-[50%] w-[40px] h-[40px]" />
                    <div className="flex flex-col w-[100%] ml-1 gap-1">
                      <p>{friend.name}</p>
                    </div>
                    {addUserToGroup[friend.id] ? (
                      <button
                        onClick={() => {
                          setAddUserToGroup((prev) => {
                            const newState = { ...prev };
                            delete newState[friend.id];
                            return newState;
                          });
                        }}
                        type="button"
                        className="w-[10rem] pt-[6px] pb-[6px] pr-2 pl-2 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-md text-[14px]"
                      >
                        remove
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setAddUserToGroup((prev) => ({
                            ...prev,
                            [friend.id]: { id: friend.id, name: friend.name },
                          }))
                        }
                        type="button"
                        className="w-[10rem] pt-[6px] pb-[6px] pr-2 pl-2 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-md text-[14px]"
                      >
                        add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
