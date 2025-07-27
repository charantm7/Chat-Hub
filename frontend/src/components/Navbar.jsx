import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  return (
    <nav className=" bg-[#0104099e] text-[#f0f6fc] flex flex-row justify-between p-[1rem] border-1 border-[#e8e8e82f] items-center rounded-md">
      <div>
        <h3 className="text-2xl font-bold font-sans">Chat Hub</h3>
      </div>
      <div className="flex gap-[1.5rem] items-center">
        <button className="flex items-center border-1 border-[#e8e8e838] gap-[6px] pt-[6px] pb-[6px] pr-[8px] pl-[8px] rounded-sm cursor-pointer">
          <FontAwesomeIcon icon={faRightFromBracket} className="text-[1.1rem]" />
          Logout
        </button>
        <button className="flex items-center border-1 border-[#e8e8e838] gap-[6px] pt-[6px] pb-[6px] pr-[8px] pl-[8px] rounded-sm cursor-pointer">
          <FontAwesomeIcon icon={faGear} className="text-[1rem]" />
          Settings
        </button>

        <div className="pl-[1rem] border-l-1 border-[#e8e8e838]">
          <img
            src="https://cdn-icons-png.flaticon.com/512/219/219988.png"
            alt=".."
            className="rounded-[50%] h-[40px] w-[40px] cursor-pointer"
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
