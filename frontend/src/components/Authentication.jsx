import React from "react";
import ChatBg from "../assets/chat-app-bg.jpg";
import HandImg from "../assets/hand-chat.png";

const GOOGLE_LOGIN_URL = "http://127.0.0.1:8000/v1/auth/login/google";

function Authentication() {
  const HandleGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };
  return (
    <div className="relative overflow-hidden w-screen h-screen">
      <img src={ChatBg} alt="..." className="w-full h-full " />
      <img src={HandImg} alt="..." className="absolute bottom-0 left-0  w-150" />

      <nav className="absolute top-0 left-0 text-[#ffffffda] pt-[1rem] pl-[2rem] pr-[4rem] flex justify-between w-full items-center">
        <h1 className="text-[2rem]">Chat Hub</h1>
        <div className="flex gap-[3rem] pt-2 pb-2 pr-6 pl-6 bg-[#ffffff15] text-[17px] rounded-4xl">
          <button type="button" className="cursor-pointer">
            About
          </button>
          <button type="button" className="cursor-pointer">
            Features
          </button>
          <button type="button" className="cursor-pointer">
            Help
          </button>
        </div>
        <div className="flex gap-[2rem] items-center">
          <button
            type="button"
            className=" text-black border-1 pt-1 pb-1 pr-3 pl-3 rounded-4xl cursor-pointer text-[17px] bg-[#fff]"
          >
            sign In
          </button>
          <button
            type="button"
            className=" text-black border-1 pt-1 pb-1 pr-3 pl-3 rounded-4xl cursor-pointer text-[17px]  bg-[#fff]"
          >
            sign Up
          </button>
        </div>
      </nav>
      <div className="absolute left-[37%] text-white top-[32%]  w-[100%] ">
        <div className="flex flex-col gap-2">
          <p className="flex text-center leading-tight  text-5xl l-h">
            Your hub for all <span className="text-amber-300 ml-3"> CONVERSATION</span>, anytime...
          </p>
          <p className="opacity-70 ml-3">Talk to everyone, everywhere – seamlessly.</p>
        </div>
        <p className="absolute top-[9rem] left-[25rem] bg-[#ffffff13] pt-3 pb-3 pr-5 pl-5 rounded-4xl opacity-80 text-[13px]">
          Try Demo
        </p>
        <button
          onClick={HandleGoogleLogin}
          className="absolute top-[14rem] left-[20rem] flex items-center  pr-8 pl-4 bg-[#ffffff0f] rounded-4xl cursor-pointer hover:bg-[#ffffff22]"
        >
          <img
            src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
            alt="..."
            className="w-15 h-15"
          />
          Sign In with Google
        </button>
      </div>
    </div>
  );
}

export default Authentication;
