import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

const ChatList = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFriends = async () => {
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImNoYXJhbm50bS5kZXZAZ21haWwuY29tIiwiZXhwIjoxNzUzNjU2MjQ5fQ.HV27g5bQdc6-cKEYNNNTcx9niHlC9kzQIoEC48ogRnE";
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
        console.log(data.picture);
        setFriends(data);
      } catch (error) {
        console.error("Error fetching Chats", error);
      } finally {
        setLoading(false);
      }
    };
    getFriends();
  }, []);

  if (loading)
    return (
      <div>
        <p className="text-white">loading chats</p>
      </div>
    );

  return (
    <div className="flex text-[#e8e8e8e0] flex-col w-[25%] border-r-1 border-[var(--border)]  ">
      <div className="flex flex-col w-[100%] gap-3 p-[1rem]">
        <input
          type="search"
          name="search"
          id="search"
          placeholder="Search"
          className="bg-[#15191fd1] border-1 outline-0 h-[2.5rem] rounded-[20px] border-[var(--border)] text-md pl-4 pr-2"
        />
        <div className="flex w-[100%] justify-between items-center ">
          <div className="flex items-center gap-3 ">
            <button
              type="button"
              className="text-sm border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[20px]"
            >
              All
            </button>
            <button
              type="button"
              className="text-sm border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[20px]"
            >
              Unread
            </button>
            <button
              type="button"
              className="text-sm border-1 border-[var(--border)] pt-1 pb-1 pr-4 pl-4 rounded-[20px]"
            >
              Group
            </button>
          </div>

          <FontAwesomeIcon
            icon={faPenToSquare}
            className="text-sm border-1 border-[var(--border)] pt-2 pb-2 pr-3 pl-3 rounded-[20px]"
          />
        </div>
      </div>
      {friends.map((friend) => (
        <div className="flex flex-col">
          <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
            <img src={friend.picture} alt="..." className="rounded-[50%] w-[40px] h-[40px]" />
            <div className="flex flex-col w-[100%] ml-1 gap-1">
              <p>{friend.name}</p>
              <small className="opacity-70">hi what do you do?</small>
            </div>
            <div className="flex flex-col  gap-1 items-end">
              <p className="text-[13px]">11/5/25</p>
              <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">3</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
