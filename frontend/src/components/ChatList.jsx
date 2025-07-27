import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";

function ChatList() {
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

      <div className="flex flex-col">
        <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
          <img
            src="https://cdn-icons-png.flaticon.com/512/219/219988.png"
            alt="..."
            className="rounded-[50%] w-[40px] h-[40px]"
          />
          <div className="flex flex-col w-[100%] ml-1 gap-1">
            <p>Charan T M</p>
            <small className="opacity-70">hi what do you do?</small>
          </div>
          <div className="flex flex-col  gap-1 items-end">
            <p className="text-[13px]">11/5/25</p>
            <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">3</p>
          </div>
        </div>
        <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTkwS4plhmRHFyTuBM5LcRE92T1nGUwGun4w&s"
            alt="..."
            className="rounded-[50%] w-[40px] h-[40px]"
          />
          <div className="flex flex-col w-[100%] ml-1 gap-1">
            <p>Uday T M</p>
            <small className="opacity-70">It's me uday...</small>
          </div>
          <div className="flex flex-col  gap-1 items-end">
            <p className="text-[13px]">Wed</p>
            <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">36</p>
          </div>
        </div>
        <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLAKVSdh3xBdiXzAbDMPxLRYVbRJ_sfgWp2g&s"
            alt="..."
            className="rounded-[50%] w-[40px] h-[40px]"
          />
          <div className="flex flex-col w-[100%] ml-1 gap-1">
            <p>Dheeraj</p>
            <small className="opacity-70">Lorem ipsum dolor sit amet.</small>
          </div>
          <div className="flex flex-col  gap-1 items-end">
            <p className="text-[13px]">18/3/25</p>
            <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">7</p>
          </div>
        </div>
        <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8hYoztRm6_iq1wDyAQJvvP4IXRinSSLnlUA&s"
            alt="..."
            className="rounded-[50%] w-[40px] h-[40px]"
          />
          <div className="flex flex-col w-[100%] ml-1 gap-1">
            <p>Hardhik shetty R</p>
            <small className="opacity-70">Lorem, ipsum.</small>
          </div>
          <div className="flex flex-col  gap-1 items-end">
            <p className="text-[13px]">7:35</p>
            <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">1</p>
          </div>
        </div>
        <div className=" hover:bg-[#ffffff15] flex w-[100%] items-center pr-[1rem] pl-[1rem] pt-2 pb-2 gap-2 cursor-pointer">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd_NJBRwlSQDsewF0oex0dfLLxHON0X-_xuw&s"
            alt="..."
            className="rounded-[50%] w-[40px] h-[40px]"
          />
          <div className="flex flex-col w-[100%] ml-1 gap-1">
            <p>Darshan R</p>
            <small className="opacity-70">Lorem ipsum dolor sit amet consectetur.</small>
          </div>
          <div className="flex flex-col  gap-1 items-end">
            <p className="text-[13px]">2:25</p>
            <p className="text-[11px] bg-[#31363ee0]  pt-[.7px] pr-2 pb-[.7px] pl-2 rounded-xl">4</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatList;
