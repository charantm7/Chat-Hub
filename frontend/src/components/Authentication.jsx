import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import ChatBg from "../assets/chat-app-bg.jpg";
import HandImg from "../assets/hand-chat.png";
import { useNavigate } from "react-router-dom";
import { GetValidAccessToken, logout } from "./index";

const GOOGLE_LOGIN_URL = "http://127.0.0.1:8000/v1/auth/login/google";

function Authentication() {
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [IsLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const Logout = () => {
    logout();
    setIsLoggedIn(false);
    setLoading(false);
  };

  const HandleGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };
  useEffect(() => {
    const getUser = async () => {
      const token = await GetValidAccessToken();
      console.log(token);
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }
      setIsLoggedIn(true);
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
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#0b0f1a] flex flex-col items-center justify-center">
        <div className="bg-[#111827] px-6 py-4 rounded-2xl shadow-lg border border-white/10">
          <div className="flex gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-400 tracking-wide">Connecting securely…</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-screen h-screen">
      <img src={ChatBg} alt="..." className="w-full h-full " />
      <img src={HandImg} alt="..." className="absolute bottom-0 left-0  w-150" />

      <nav className="absolute top-0 left-0 text-[#ffffffda] pt-[1rem] pl-[2rem] pr-[4rem] flex justify-between w-full items-center">
        <h1 className="text-[2rem]">Lumeo</h1>
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
          <button className="cursor-pointer" onClick={() => navigate("/chat")}>
            Try Chat
          </button>
        </div>
        {IsLoggedIn ? (
          <button
            onClick={Logout}
            type="button"
            className="text-black border border-gray-400 pt-1 pb-1 pr-3 pl-3 rounded-4xl cursor-pointer text-[17px] bg-[#fff]"
          >
            Logout
          </button>
        ) : (
          <div className="flex gap-[2rem] items-center">
            <button
              onClick={HandleGoogleLogin}
              type="button"
              className="text-black border border-gray-400 pt-1 pb-1 pr-3 pl-3 rounded-4xl cursor-pointer text-[17px] bg-[#fff]"
            >
              Sign In
            </button>
            <button
              onClick={HandleGoogleLogin}
              type="button"
              className="text-black border border-gray-400 pt-1 pb-1 pr-3 pl-3 rounded-4xl cursor-pointer text-[17px] bg-[#fff]"
            >
              Sign Up
            </button>
          </div>
        )}
      </nav>
      <div className="absolute left-[37%] text-white top-[32%]  w-[100%] ">
        <div className="flex flex-col gap-2">
          <p className="flex text-center leading-tight  text-5xl l-h">
            Your hub for all <span className="text-amber-300 ml-3"> CONVERSATION</span>, anytime...
          </p>
          <p className="opacity-70 ml-3">Talk to everyone, everywhere – seamlessly.</p>
        </div>
        {IsLoggedIn ? (
          <div>
            <p className="absolute top-[9rem] left-[23rem] bg-[#ffffff13] pt-3 pb-3 pr-5 pl-5 rounded-4xl opacity-80 text-[13px]">
              Welcome Back {user.name}
            </p>
            <button className="absolute top-[14rem] left-[20rem] flex flex-row items-center gap-3 pr-8 pl-4 pt-2 pb-2 bg-[#ffffff0f] rounded-4xl cursor-pointer hover:bg-[#ffffff22]">
              <img src={user.picture} alt="..." className="w-10 h-10 rounded-[50%]" />
              <div className="flex flex-col items-baseline gap-1 ">
                <p className="text-md">You are Logged as {user.name}</p>
                <p className="text-[12px]">{user.email}</p>
              </div>
            </button>
          </div>
        ) : (
          <div>
            <p className="absolute top-[9rem] left-[25rem] bg-[#ffffff13] pt-2 pb-2 pr-5 pl-5 rounded-4xl opacity-80 text-[13px]">
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
        )}
      </div>
    </div>
  );
}

export default Authentication;
