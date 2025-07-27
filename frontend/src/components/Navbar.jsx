import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  return (
    <nav className=" bg-[#0104099e] text-[#e8e8e8e0] flex flex-row justify-between pt-[.5rem] pb-[.5rem] pr-[1rem] pl-[1rem] border-1 border-b-0 border-[var(--border)] items-center rounded-t-lg">
      <div>
        <h3 className="text-2xl font-bold font-sans">Chat Hub</h3>
      </div>
      <div className="flex text-[#e8e8e8e0] gap-[2rem] items-center">
        <FontAwesomeIcon icon={faCircleQuestion} className="text-[19px] cursor-pointer" />
        <FontAwesomeIcon
          icon={faGear}
          className="text-[17px] transition-transform hover:animate-spin cursor-pointer"
        />
        <FontAwesomeIcon icon={faRightFromBracket} className="text-[18px] cursor-pointer" />

        <div className="pl-[1rem] border-l-1 border-[#e8e8e838]">
          <img
            src="https://cdn-icons-png.flaticon.com/512/219/219988.png"
            alt=".."
            className="rounded-[50%] h-[35px] w-[35px] cursor-pointer"
          />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
