import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { GetValidAccessToken, logout } from "./index";
import { faUserPlus, faInbox } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { getFriends } from "./ChatList";

function Navbar() {
  const [showModal, setShowModal] = useState(null);
  const [friendRequests, setFriendRequest] = useState([]);
  const [count, setCount] = useState(null);
  const [requestStatus, setRequestStatus] = useState({});
  const [user, setUser] = useState([]);

  const handleOverlayClick = (e) => {
    if (e.target.id == "overlay") {
      setShowModal(null);
      window.location.reload();
    }
  };

  const acceptRequest = async (id) => {
    const token = await GetValidAccessToken();

    try {
      const res = await fetch(`http://127.0.0.1:8000/v1/chat/friend-requests/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setRequestStatus((prev) => ({ ...prev, [id]: "Accepted" }));
      await getFriends();
      console.log(data);
    } catch (error) {
      console.log("accept", error);
    }
  };
  const rejectRequest = async (id) => {
    const token = await GetValidAccessToken();

    try {
      const res = await fetch(`http://127.0.0.1:8000/v1/chat/friend-requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setRequestStatus((prev) => ({ ...prev, [id]: "Rejected" }));
      await getFriends();
      console.log(data);
    } catch (error) {
      console.log("accept", error);
    }
  };

  useEffect(() => {
    const getIncomingRequest = async () => {
      const token = await GetValidAccessToken();

      try {
        const res = await fetch("http://127.0.0.1:8000/v1/chat/friend-requests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("fetching request failed");

        const data = await res.json();
        console.log(data);
        setFriendRequest(data);
        setCount(data.length);
      } catch (error) {
        console.log(error);
      }
    };
    const getUser = async () => {
      const token = await GetValidAccessToken();
      console.log(token);
      try {
        const response = await fetch("http://127.0.0.1:8000/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response) {
          throw new Error("Unauthorized ");
        }
        const data = await response.json();
        console.log(data);
        setUser(data);
      } catch (error) {
        console.error(error);
      }
    };
    getUser();
    getIncomingRequest();
  }, []);

  return (
    <nav className=" bg-[#0104099e] text-[#e8e8e8e0] flex flex-row justify-between pt-[.5rem] pb-[.5rem] pr-[1rem] pl-[1rem] border-1 border-b-0 border-[var(--border)] items-center rounded-t-lg">
      <div>
        <h3 className="text-2xl font-bold font-sans">Chat Hub</h3>
      </div>
      <div className="flex text-[#e8e8e8e0] gap-[2rem] items-center">
        <div className="flex items-center">
          <FontAwesomeIcon
            icon={faInbox}
            onClick={() => setShowModal("inbox")}
            className="text-[18px] cursor-pointer"
          />
          {count > 0 && (
            <span className="absolute top-4 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ml-3">
              {count}
            </span>
          )}
        </div>
        <FontAwesomeIcon
          onClick={() => setShowModal("add")}
          icon={faUserPlus}
          className="text-[18px] cursor-pointer"
        />
        <FontAwesomeIcon icon={faCircleQuestion} className="text-[19px] cursor-pointer" />
        <FontAwesomeIcon
          icon={faGear}
          className="text-[17px] transition-transform hover:animate-spin cursor-pointer"
        />
        <FontAwesomeIcon
          onClick={() => logout()}
          icon={faRightFromBracket}
          className="text-[18px] cursor-pointer"
        />

        <div className="pl-[1rem] border-l-1 border-[#e8e8e838]">
          <img
            src={user.picture}
            referrerPolicy="no-referrer"
            alt=".."
            className="rounded-[50%] h-[35px] w-[35px] cursor-pointer"
          />
        </div>
      </div>
      {showModal == "add" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="inset-0 fixed bg-[#0000006c] flex items-center justify-center z-50"
        >
          <div className="bg-opacity-50 absolute right-[18%] top-[8%] flex flex-col  p-3 bg-[#000c] items-center text-[#ffffffd6] border-1 border-[#ffffff34] rounded-xl">
            <p
              onClick={() => setShowModal("adduser")}
              className="cursor-pointer hover:text-white hover:bg-[#ffffff13] p-2 rounded-md"
            >
              Add Friends
            </p>
            <p className="cursor-pointer hover:text-white hover:bg-[#ffffff15] p-2 rounded-md">
              Create Group
            </p>
          </div>
        </div>
      )}
      {showModal == "adduser" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] flex justify-center items-center z-50"
        >
          <div className="bg-opacity-50 w-[30%] h-[80%] absolute left-[35%] top-[8%] flex flex-col gap-5  p-6 bg-[#fffc] items-center text-[#000000d6] border-1 border-[#ffffff34] rounded-xl">
            <div className="flex w-[100%]">
              <input
                type="search"
                name="user"
                id="user"
                placeholder="search"
                className="border-1 w-[100%] h-10 pr-3 pl-5 outline-0 rounded-3xl"
              />
            </div>
            <div className="flex flex-col w-[100%]"></div>
          </div>
        </div>
      )}
      {showModal == "inbox" && (
        <div
          id="overlay"
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-[#00000085] flex justify-center items-center z-50"
        >
          <div className="bg-opacity-50 w-[30%] h-[80%] absolute left-[35%] top-[8%] flex flex-col gap-5  p-6 bg-[#fffc] items-center text-[#000000d6] border-1 border-[#ffffff34] rounded-xl">
            <div className="flex w-[100%]">
              <input
                type="search"
                name="user"
                id="user"
                placeholder="search"
                className="border-1 w-[100%] h-10 pr-3 pl-5 outline-0 rounded-3xl"
              />
            </div>
            <div className="flex flex-col w-[100%]">
              {friendRequests.map((friend) => {
                const status = requestStatus[friend.request_id] || "request";
                return (
                  <div className="  flex w-[100%] items-center  pt-2 pb-2 gap-2">
                    <img src={friend.user.picture} alt="..." className="rounded-[50%] w-[40px] h-[40px]" />
                    <p className="w-[100%]">{friend.user.name}</p>

                    {status === "request" ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => acceptRequest(friend.request_id)}
                          type="button"
                          className=" pt-[6px] pb-[6px] pr-4 pl-4 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-4xl text-[14px]"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectRequest(friend.request_id)}
                          type="button"
                          className=" pt-[6px] pb-[6px] pr-4 pl-4 bg-red-500 cursor-pointer hover:bg-red-700 text-white rounded-4xl text-[14px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : status === "Accepted" ? (
                      <button
                        type="button"
                        className=" pt-[6px] pb-[6px] pr-4 pl-4 bg-blue-500 cursor-pointer hover:bg-blue-700 text-white rounded-4xl text-[14px]"
                      >
                        Accepted
                      </button>
                    ) : status === "Rejected" ? (
                      <button
                        onClick={() => rejectRequest(friend.request_id)}
                        type="button"
                        className=" pt-[6px] pb-[6px] pr-4 pl-4 bg-red-500 cursor-pointer hover:bg-red-700 text-white rounded-4xl text-[14px]"
                      >
                        Rejected
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
