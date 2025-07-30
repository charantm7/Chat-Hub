import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { faFaceSmile } from "@fortawesome/free-solid-svg-icons";
import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

function ChatArea({ user, onSelect }) {
  if (!user) {
    return (
      <div className="flex-1  flex items-center justify-center p-4 text-gray-400 ">
        <p className="  p-3 rounded-4xl bg-[#ffffff13]">Select a user to start chatting</p>
      </div>
    );
  }

  return (
    <div className="w-[75%] bg-[#14171c] flex flex-col">
      <div className="text-[#e8e8e8e0] bg-[#01040963] flex justify-between items-center pr-4 pl-4 pt-2 pb-2 border-b-1 border-[var(--border-2)]">
        <div className="flex flex-col justify-center">
          <p className="text-[15px]">{user.name}</p>
          <small className="text-[11px] opacity-70">last seen recently</small>
        </div>
        <div className="flex gap-4 text-sm items-center">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="cursor-pointer" />
          <FontAwesomeIcon icon={faEllipsisVertical} className="cursor-pointer" />
          <FontAwesomeIcon
            onClick={() => onSelect(null)}
            icon={faXmark}
            className=" p-[3px] pt-1 pb-1 rounded-[50%] cursor-pointer hover:bg-[#ff2b2bdf]"
          />
        </div>
      </div>
      <div className="h-[100%] "></div>
      <div className="flex w-[100%] bg-[#01040963] items-center text-[#e8e8e8e0] pr-4 pl-4 gap-4 border-t-1 border-[var(--border-2)]">
        <FontAwesomeIcon icon={faFaceSmile} className="text-[20px]" />
        <input
          type="text"
          name="message"
          id="message"
          placeholder="Write a message..."
          className="w-[100%] h-[3.3rem] outline-0"
        />
        <FontAwesomeIcon icon={faPaperclip} className="text-[20px]" />
        <FontAwesomeIcon icon={faMicrophone} className="text-[20px]" />
      </div>
    </div>
  );
}

export default ChatArea;
